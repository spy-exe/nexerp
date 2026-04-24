from __future__ import annotations


def only_digits(value: str) -> str:
    return "".join(char for char in value if char.isdigit())


def validate_cnpj(value: str) -> str:
    digits = only_digits(value)
    if len(digits) != 14 or digits == digits[0] * 14:
        raise ValueError("CNPJ inválido.")

    def calculate_digit(slice_size: int) -> str:
        weights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        total = sum(int(number) * weight for number, weight in zip(digits[:slice_size], weights[-slice_size:], strict=False))
        remainder = total % 11
        return "0" if remainder < 2 else str(11 - remainder)

    if digits[12] != calculate_digit(12) or digits[13] != calculate_digit(13):
        raise ValueError("CNPJ inválido.")
    return digits


def validate_cpf(value: str) -> str:
    digits = only_digits(value)
    if len(digits) != 11 or digits == digits[0] * 11:
        raise ValueError("CPF inválido.")

    def calculate_digit(slice_size: int) -> str:
        total = sum(int(number) * weight for number, weight in zip(digits[:slice_size], range(slice_size + 1, 1, -1), strict=False))
        remainder = (total * 10) % 11
        return "0" if remainder == 10 else str(remainder)

    if digits[9] != calculate_digit(9) or digits[10] != calculate_digit(10):
        raise ValueError("CPF inválido.")
    return digits


def validate_cep(value: str) -> str:
    digits = only_digits(value)
    if len(digits) != 8:
        raise ValueError("CEP inválido.")
    return digits
