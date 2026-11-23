import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../errors/AppError';

interface JwtPayload {
  sub: string;
  email: string;
}

export function ensureAuthenticated(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Token de autenticação não informado.', 401));
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return next(new AppError('Token de autenticação inválido.', 401));
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;
    if (!decoded.sub) {
      return next(new AppError('Token de autenticação inválido.', 401));
    }
    req.userId = decoded.sub;
    return next();
  } catch {
    return next(new AppError('Token de autenticação inválido ou expirado.', 401));
  }
}
