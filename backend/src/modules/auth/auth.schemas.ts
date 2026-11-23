import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Nome é obrigatório.' })
    .trim()
    .min(2, 'Nome deve ter pelo menos 2 caracteres.')
    .max(80, 'Nome deve ter no máximo 80 caracteres.'),
  email: z
    .string({ required_error: 'E-mail é obrigatório.' })
    .trim()
    .toLowerCase()
    .email('Informe um e-mail válido.'),
  password: z
    .string({ required_error: 'Senha é obrigatória.' })
    .min(6, 'Senha deve ter pelo menos 6 caracteres.')
    .max(100, 'Senha muito longa.'),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'E-mail é obrigatório.' })
    .trim()
    .toLowerCase()
    .email('Informe um e-mail válido.'),
  password: z
    .string({ required_error: 'Senha é obrigatória.' })
    .min(1, 'Senha é obrigatória.'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
