import { z } from "zod"

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
  phone: z.string().optional(),
  address_zip: z.string().optional(),
  address_state: z.string().max(2).optional(),
  address_city: z.string().optional(),
  address_street: z.string().optional(),
  address_number: z.string().optional(),
  address_neighborhood: z.string().optional(),
  tax_regime: z.string().optional(),
  cnae: z.string().optional(),
  timezone: z.string().optional(),
  currency: z.string().optional()
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
