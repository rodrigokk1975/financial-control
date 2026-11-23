import { TransactionType } from '@prisma/client';
import { z } from 'zod';

const isoDateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;

export const listTransactionsQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  startDate: z
    .string()
    .regex(isoDateOnlyRegex, 'startDate deve estar no formato YYYY-MM-DD.')
    .optional(),
  endDate: z
    .string()
    .regex(isoDateOnlyRegex, 'endDate deve estar no formato YYYY-MM-DD.')
    .optional(),
  type: z.nativeEnum(TransactionType).optional(),
  accountId: z.string().uuid('accountId inválido.').optional(),
  categoryId: z.string().uuid('categoryId inválido.').optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(15),
});

export const createTransactionSchema = z.object({
  accountId: z
    .string({ required_error: 'Conta é obrigatória.' })
    .uuid('ID de conta inválido.'),
  categoryId: z
    .string({ required_error: 'Categoria é obrigatória.' })
    .uuid('ID de categoria inválido.'),
  type: z.nativeEnum(TransactionType, {
    required_error: 'Tipo da transação (INCOME ou EXPENSE) é obrigatório.',
  }),
  amount: z.coerce
    .number({ required_error: 'Valor é obrigatório.' })
    .positive('O valor deve ser maior que zero.'),
  description: z
    .string({ required_error: 'Descrição é obrigatória.' })
    .trim()
    .min(2, 'Descrição deve ter pelo menos 2 caracteres.')
    .max(140, 'Descrição deve ter no máximo 140 caracteres.'),
  date: z.coerce.date({ required_error: 'Data é obrigatória.' }),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
