import { Prisma } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
      ...(err.errors ? { errors: err.errors } : {}),
    });
  }

  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const key = issue.path.join('.') || 'root';
      if (!fieldErrors[key]) {
        fieldErrors[key] = [];
      }
      fieldErrors[key].push(issue.message);
    }

    return res.status(400).json({
      message: 'Erro de validação nos dados enviados.',
      errors: fieldErrors,
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        message: 'Já existe um registro com os dados informados.',
      });
    }
    if (err.code === 'P2003') {
      return res.status(409).json({
        message: 'Não é possível concluir a operação pois existem registros vinculados.',
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        message: 'Registro não encontrado.',
      });
    }
  }

  console.error('Unhandled error:', err);
  return res.status(500).json({
    message: 'Erro interno do servidor.',
  });
}
