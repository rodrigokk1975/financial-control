import { AccountType } from '@prisma/client';
import { z } from 'zod';

const hexColorRegex = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/;

export const createAccountSchema = z.object({
  name: z
    .string({ required_error: 'Nome da conta é obrigatório.' })
    .trim()
    .min(2, 'Nome deve ter pelo menos 2 caracteres.')
    .max(60, 'Nome deve ter no máximo 60 caracteres.'),
  type: z.nativeEnum(AccountType).default(AccountType.CHECKING),
  initialBalance: z.coerce.number().finite('Saldo inicial inválido.').default(0),
  color: z
    .string()
    .regex(hexColorRegex, 'Cor deve estar em formato hexadecimal (ex: #10b981).')
    .default('#10b981'),
});

export const updateAccountSchema = createAccountSchema.partial();

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
