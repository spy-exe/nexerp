from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal, ROUND_HALF_UP
from html import escape
from uuid import UUID, uuid4

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.models.fiscal import FiscalDocument
from app.models.sale import Sale
from app.services.audit_service import AuditService


MONEY_PRECISION = Decimal("0.01")
HOMOLOGATION_MESSAGE = "NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL"
SP_HOMOLOGATION_NFE_AUTHORIZATION_URL = "https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx"
UF_CODES = {
    "AC": "12",
    "AL": "27",
    "AP": "16",
    "AM": "13",
    "BA": "29",
    "CE": "23",
    "DF": "53",
    "ES": "32",
    "GO": "52",
    "MA": "21",
    "MT": "51",
    "MS": "50",
    "MG": "31",
    "PA": "15",
    "PB": "25",
    "PR": "41",
    "PE": "26",
    "PI": "22",
    "RJ": "33",
    "RN": "24",
    "RS": "43",
    "RO": "11",
    "RR": "14",
    "SC": "42",
    "SP": "35",
    "SE": "28",
    "TO": "17",
}


@dataclass(frozen=True, slots=True)
class HomologationAuthorization:
    status: str
    protocol: str
    authorized_at: datetime
    message: str


class SefazHomologationClient:
    """Boundary for the real SEFAZ SOAP client.

    A valid A1/A3 certificate is required before replacing this deterministic
    homologation adapter with network submission.
    """

    async def authorize(self, *, access_key: str, xml_content: str) -> HomologationAuthorization:
        protocol_seed = f"{access_key}{len(xml_content)}"
        return HomologationAuthorization(
            status="authorized_homologation",
            protocol=f"135{abs(hash(protocol_seed)) % 10_000_000_000:010d}",
            authorized_at=datetime.now(tz=UTC),
            message="Autorizado em homologacao controlada. Configure certificado para envio SOAP real.",
        )


class FiscalService:
    def __init__(self, db: AsyncSession, sefaz_client: SefazHomologationClient | None = None) -> None:
        self.db = db
        self.audit = AuditService(db)
        self.sefaz_client = sefaz_client or SefazHomologationClient()

    async def list_documents(self, company_id: UUID) -> list[FiscalDocument]:
        result = await self.db.execute(
            select(FiscalDocument)
            .where(FiscalDocument.company_id == company_id)
            .order_by(FiscalDocument.issued_at.desc())
        )
        return list(result.scalars().all())

    async def get_document(self, company_id: UUID, document_id: UUID) -> FiscalDocument:
        result = await self.db.execute(
            select(FiscalDocument).where(
                FiscalDocument.company_id == company_id,
                FiscalDocument.id == document_id,
            )
        )
        document = result.scalar_one_or_none()
        if document is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Documento fiscal não encontrado.")
        return document

    async def issue_homologation_nfe(
        self,
        *,
        company_id: UUID,
        user_id: UUID,
        sale_id: UUID,
        ip_address: str | None,
    ) -> FiscalDocument:
        sale = await self._get_sale(company_id, sale_id)
        await self._ensure_sale_without_document(company_id, sale_id)
        number = await self._next_number(company_id)
        issued_at = datetime.now(tz=UTC)
        uf_code = UF_CODES.get((sale.company.address_state or "SP").upper(), UF_CODES["SP"])
        access_key = self._build_access_key(
            uf_code=uf_code,
            issued_at=issued_at,
            cnpj=sale.company.cnpj,
            series="001",
            number=number,
        )
        xml_content = self._build_homologation_xml(sale=sale, access_key=access_key, issued_at=issued_at, number=number)
        authorization = await self.sefaz_client.authorize(access_key=access_key, xml_content=xml_content)

        document = FiscalDocument(
            company_id=company_id,
            sale_id=sale.id,
            user_id=user_id,
            model="55",
            series="001",
            number=number,
            environment="homologation",
            status=authorization.status,
            access_key=access_key,
            protocol=authorization.protocol,
            sefaz_endpoint=SP_HOMOLOGATION_NFE_AUTHORIZATION_URL,
            total_amount=self._money(sale.total_amount),
            issued_at=issued_at,
            authorized_at=authorization.authorized_at,
            xml_content=xml_content,
            response_message=authorization.message,
        )
        self.db.add(document)
        await self.db.flush()

        self.audit.log(
            company_id=company_id,
            user_id=user_id,
            action="fiscal.nfe.homologation_issued",
            table_name="fiscal_documents",
            record_id=str(document.id),
            new_data={
                "sale_id": str(sale.id),
                "access_key": document.access_key,
                "protocol": document.protocol,
                "total_amount": str(document.total_amount),
                "sefaz_endpoint": document.sefaz_endpoint,
            },
            ip_address=ip_address,
            note=authorization.message,
        )
        await self.db.commit()
        return await self.get_document(company_id, document.id)

    async def _get_sale(self, company_id: UUID, sale_id: UUID) -> Sale:
        result = await self.db.execute(
            select(Sale)
            .options(
                joinedload(Sale.company),
                joinedload(Sale.customer),
                selectinload(Sale.items),
                selectinload(Sale.payments),
            )
            .where(Sale.company_id == company_id, Sale.id == sale_id, Sale.status == "completed")
        )
        sale = result.scalar_one_or_none()
        if sale is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venda concluída não encontrada.")
        return sale

    async def _ensure_sale_without_document(self, company_id: UUID, sale_id: UUID) -> None:
        result = await self.db.execute(
            select(FiscalDocument.id).where(
                FiscalDocument.company_id == company_id,
                FiscalDocument.sale_id == sale_id,
                FiscalDocument.status != "cancelled",
            )
        )
        if result.scalar_one_or_none() is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Já existe NF-e emitida para esta venda.",
            )

    async def _next_number(self, company_id: UUID) -> int:
        result = await self.db.execute(
            select(func.max(FiscalDocument.number)).where(FiscalDocument.company_id == company_id)
        )
        current = result.scalar_one_or_none() or 0
        return int(current) + 1

    def _build_homologation_xml(self, *, sale: Sale, access_key: str, issued_at: datetime, number: int) -> str:
        company = sale.company
        customer = sale.customer
        customer_name = customer.name if customer else "CONSUMIDOR NAO IDENTIFICADO"
        customer_document = customer.document_number if customer else "00000000000"
        items = "\n".join(
            self._build_item_xml(index=index, item=item)
            for index, item in enumerate(sale.items, start=1)
        )
        payments = "\n".join(
            f'<detPag><tPag>{self._payment_code(payment.method)}</tPag><vPag>{self._money(payment.amount)}</vPag></detPag>'
            for payment in sale.payments
        )
        return f"""<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe Id="NFe{access_key}" versao="4.00">
    <ide>
      <cUF>{access_key[:2]}</cUF>
      <cNF>{access_key[35:43]}</cNF>
      <natOp>Venda</natOp>
      <mod>55</mod>
      <serie>1</serie>
      <nNF>{number}</nNF>
      <dhEmi>{issued_at.isoformat()}</dhEmi>
      <tpNF>1</tpNF>
      <idDest>1</idDest>
      <cMunFG>3550308</cMunFG>
      <tpImp>1</tpImp>
      <tpEmis>1</tpEmis>
      <cDV>{access_key[-1]}</cDV>
      <tpAmb>2</tpAmb>
      <finNFe>1</finNFe>
      <indFinal>1</indFinal>
      <indPres>1</indPres>
      <procEmi>0</procEmi>
      <verProc>NexERP-1.0</verProc>
    </ide>
    <emit>
      <CNPJ>{escape(company.cnpj)}</CNPJ>
      <xNome>{escape(company.legal_name)}</xNome>
      <xFant>{escape(company.trade_name)}</xFant>
    </emit>
    <dest>
      <CNPJ>{escape(customer_document.zfill(14))}</CNPJ>
      <xNome>{escape(customer_name)}</xNome>
      <indIEDest>9</indIEDest>
    </dest>
{items}
    <total>
      <ICMSTot>
        <vBC>0.00</vBC>
        <vICMS>0.00</vICMS>
        <vProd>{self._money(sale.subtotal)}</vProd>
        <vNF>{self._money(sale.total_amount)}</vNF>
      </ICMSTot>
    </total>
    <pag>{payments}</pag>
    <infAdic><infCpl>{HOMOLOGATION_MESSAGE}</infCpl></infAdic>
  </infNFe>
</NFe>"""

    def _build_item_xml(self, *, index: int, item) -> str:
        return f"""    <det nItem="{index}">
      <prod>
        <cProd>{escape(item.product_sku)}</cProd>
        <xProd>{escape(item.product_name)}</xProd>
        <NCM>00000000</NCM>
        <CFOP>5102</CFOP>
        <uCom>{escape(item.unit)}</uCom>
        <qCom>{item.quantity}</qCom>
        <vUnCom>{self._money(item.unit_price)}</vUnCom>
        <vProd>{self._money(item.total_amount)}</vProd>
      </prod>
      <imposto><ICMS><ICMS102><orig>0</orig><CSOSN>102</CSOSN></ICMS102></ICMS></imposto>
    </det>"""

    @staticmethod
    def _build_access_key(*, uf_code: str, issued_at: datetime, cnpj: str, series: str, number: int) -> str:
        cnpj_digits = "".join(character for character in cnpj if character.isdigit()).zfill(14)[-14:]
        base = (
            f"{uf_code}"
            f"{issued_at:%y%m}"
            f"{cnpj_digits}"
            "55"
            f"{int(series):03d}"
            f"{number:09d}"
            "1"
            f"{uuid4().int % 100_000_000:08d}"
        )
        return f"{base}{FiscalService._mod11_digit(base)}"

    @staticmethod
    def _mod11_digit(value: str) -> int:
        weights = list(range(2, 10))
        total = 0
        for index, digit in enumerate(reversed(value)):
            total += int(digit) * weights[index % len(weights)]
        remainder = total % 11
        digit = 11 - remainder
        return 0 if digit >= 10 else digit

    @staticmethod
    def _payment_code(method: str) -> str:
        return {
            "cash": "01",
            "card": "03",
            "pix": "17",
            "credit": "99",
        }.get(method, "99")

    @staticmethod
    def _money(value: Decimal) -> Decimal:
        return Decimal(value).quantize(MONEY_PRECISION, rounding=ROUND_HALF_UP)
