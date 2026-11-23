import { TransactionType } from '@prisma/client';
import { z } from 'zod';

const hexColorRegex = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/;

export const listCategoriesQuerySchema = z.object({
  type: z.nativeEnum(TransactionType).optional(),
});

export const createCategorySchema = z.object({
  name: z
    .string({ required_error: 'Nome da categoria é obrigatório.' })
    .trim()
    .min(2, 'Nome deve ter pelo menos 2 caracteres.')
    .max(50, 'Nome deve ter no máximo 50 caracteres.'),
  type: z.nativeEnum(TransactionType, {
    required_error: 'Tipo da categoria (INCOME ou EXPENSE) é obrigatório.',
  }),
  color: z
    .string()
    .regex(hexColorRegex, 'Cor deve estar em formato hexadecimal (ex: #6366f1).')
    .default('#6366f1'),
  icon: z.string().trim().min(1).max(40).default('tag'),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
