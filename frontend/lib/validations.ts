import { z } from "zod"

const emptyToUndefined = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined
  }
  return value
}

const optionalText = (maxLength: number, message?: string) =>
  z.preprocess(emptyToUndefined, z.string().max(maxLength, message).optional())

export const loginSchema = z.object({
  email: z.string().email("Informe um e-mail válido."),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres.")
})

export const registerSchema = z.object({
  company: z.object({
    trade_name: z.string().min(2, "Nome fantasia obrigatório."),
    legal_name: z.string().min(2, "Razão social obrigatória."),
    cnpj: z.string().min(14, "CNPJ inválido."),
    email: z.string().email("E-mail da empresa inválido."),
    phone: z.string().optional()
  }),
  user: z.object({
    name: z.string().min(2, "Nome obrigatório."),
    email: z.string().email("E-mail do usuário inválido."),
    password: z
      .string()
      .min(8, "A senha deve ter pelo menos 8 caracteres.")
      .regex(/[A-Z]/, "Inclua uma letra maiúscula.")
      .regex(/[a-z]/, "Inclua uma letra minúscula.")
      .regex(/[0-9]/, "Inclua um número.")
      .regex(/[^\w\s]/, "Inclua um caractere especial.")
  })
})

export const forgotPasswordSchema = z.object({
  email: z.string().email("Informe um e-mail válido.")
})

export const resetPasswordSchema = z.object({
  new_password: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres.")
    .regex(/[A-Z]/, "Inclua uma letra maiúscula.")
    .regex(/[a-z]/, "Inclua uma letra minúscula.")
    .regex(/[0-9]/, "Inclua um número.")
    .regex(/[^\w\s]/, "Inclua um caractere especial.")
})

export const onboardingSchema = z.object({
  phone: optionalText(20, "Telefone deve ter no máximo 20 caracteres."),
  address_zip: z.preprocess(
    emptyToUndefined,
    z.string().regex(/^\d{5}-?\d{3}$/, "CEP deve ter 8 dígitos.").optional()
  ),
  address_state: z.preprocess(
    emptyToUndefined,
    z.string().length(2, "Use a sigla do estado.").transform((value) => value.toUpperCase()).optional()
  ),
  address_city: optionalText(120, "Cidade deve ter no máximo 120 caracteres."),
  address_street: optionalText(255, "Rua deve ter no máximo 255 caracteres."),
  address_number: optionalText(30, "Número deve ter no máximo 30 caracteres."),
  address_neighborhood: optionalText(120, "Bairro deve ter no máximo 120 caracteres."),
  tax_regime: optionalText(50, "Regime tributário deve ter no máximo 50 caracteres."),
  cnae: optionalText(20, "CNAE deve ter no máximo 20 caracteres."),
  timezone: optionalText(80, "Timezone deve ter no máximo 80 caracteres."),
  currency: z.preprocess(
    emptyToUndefined,
    z.string().length(3, "Moeda deve ter 3 letras.").transform((value) => value.toUpperCase()).optional()
  )
})

export const categorySchema = z.object({
  name: z.string().min(2, "Nome obrigatório."),
  description: z.string().optional()
})

export const productSchema = z.object({
  sku: z.string().min(1, "SKU obrigatório."),
  name: z.string().min(2, "Nome obrigatório."),
  barcode: z.string().optional(),
  description: z.string().optional(),
  category_id: z.string().optional(),
  unit: z.string().default("UN"),
  cost_price: z.coerce.number().min(0),
  sale_price: z.coerce.number().min(0),
  min_stock: z.coerce.number().min(0)
})

export const movementSchema = z.object({
  product_id: z.string().min(1, "Produto obrigatório."),
  type: z.enum(["inbound", "outbound", "adjustment"]),
  quantity: z.coerce.number().gt(0, "Quantidade deve ser maior que zero."),
  notes: z.string().optional()
})

export const businessPartySchema = z.object({
  person_kind: z.enum(["individual", "company"]),
  name: z.string().min(2, "Nome obrigatório."),
  email: z.union([z.string().email("Informe um e-mail válido."), z.literal("")]).optional(),
  phone: z.string().optional(),
  document_number: z.string().min(11, "Documento obrigatório."),
  state_registration: z.string().optional(),
  municipal_registration: z.string().optional(),
  address_zip: z.string().optional(),
  address_state: z.string().max(2, "Use a sigla do estado.").optional(),
  address_city: z.string().optional(),
  address_street: z.string().optional(),
  address_number: z.string().optional(),
  address_neighborhood: z.string().optional(),
  notes: z.string().optional()
})
