import { TransactionType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';
import { prisma } from '../../config/prisma';
import { AppError } from '../../errors/AppError';
import type { LoginInput, RegisterInput } from './auth.schemas';

const DEFAULT_CATEGORIES: Array<{
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
}> = [
  { name: 'Salário', type: TransactionType.INCOME, color: '#10b981', icon: 'briefcase' },
  { name: 'Freelance', type: TransactionType.INCOME, color: '#06b6d4', icon: 'laptop' },
  { name: 'Moradia', type: TransactionType.EXPENSE, color: '#f43f5e', icon: 'home' },
  { name: 'Alimentação', type: TransactionType.EXPENSE, color: '#f97316', icon: 'utensils' },
  { name: 'Transporte', type: TransactionType.EXPENSE, color: '#eab308', icon: 'car' },
  { name: 'Lazer', type: TransactionType.EXPENSE, color: '#a855f7', icon: 'gamepad-2' },
];

function signAccessToken(userId: string, email: string): string {
  const options: SignOptions = {
    subject: userId,
    expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'],
  };
  return jwt.sign({ email }, env.jwtSecret, options);
}

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    throw new AppError('Já existe uma conta cadastrada com este e-mail.', 409);
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      categories: {
        create: DEFAULT_CATEGORIES,
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  const accessToken = signAccessToken(user.id, user.email);

  return {
    user,
    accessToken,
  };
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new AppError('E-mail ou senha inválidos.', 401);
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw new AppError('E-mail ou senha inválidos.', 401);
  }

  const accessToken = signAccessToken(user.id, user.email);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
    accessToken,
  };
}

export async function getAuthenticatedUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError('Usuário não encontrado.', 404);
  }

  return user;
}
