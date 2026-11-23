import { AccountType, TransactionType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  account: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  category: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  transaction: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../config/prisma', () => ({
  prisma: prismaMock,
}));

import { createApp } from '../app';
import { env } from '../config/env';

const app = createApp();

function makeToken(userId = '11111111-1111-4111-8111-111111111111') {
  return jwt.sign({ email: 'tester@finpulse.dev' }, env.jwtSecret, {
    subject: userId,
    expiresIn: '1h',
  });
}

describe('Financial Control API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /api/health returns 200 ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/auth/me blocks unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('POST /api/auth/login returns JWT for valid credentials', async () => {
    const passwordHash = await bcrypt.hash('secret123', 4);
    prismaMock.user.findUnique.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Rodrigo',
      email: 'rodrigo@finpulse.dev',
      passwordHash,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'rodrigo@finpulse.dev',
      password: 'secret123',
    });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTypeOf('string');
    expect(res.body.user.email).toBe('rodrigo@finpulse.dev');
  });

  it('GET /api/accounts calculates currentBalance from initialBalance and transactions', async () => {
    const accId = '22222222-2222-4222-8222-222222222222';
    prismaMock.account.findMany.mockResolvedValue([
      {
        id: accId,
        userId: '11111111-1111-4111-8111-111111111111',
        name: 'Nubank',
        type: AccountType.CHECKING,
        initialBalance: 1000,
        color: '#8b5cf6',
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { transactions: 2 },
      },
    ]);
    prismaMock.transaction.groupBy.mockResolvedValue([
      { accountId: accId, type: TransactionType.INCOME, _sum: { amount: 2500 } },
      { accountId: accId, type: TransactionType.EXPENSE, _sum: { amount: 850.5 } },
    ]);

    const res = await request(app)
      .get('/api/accounts')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.accounts).toHaveLength(1);
    expect(res.body.accounts[0].currentBalance).toBe(2649.5);
  });

  it('DELETE /api/accounts/:id returns 409 when account has linked transactions', async () => {
    prismaMock.account.findFirst.mockResolvedValue({
      id: '22222222-2222-4222-8222-222222222222',
      userId: '11111111-1111-4111-8111-111111111111',
      _count: { transactions: 3 },
    });

    const res = await request(app)
      .delete('/api/accounts/22222222-2222-4222-8222-222222222222')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(409);
  });

  it('POST /api/transactions rejects category type mismatch with 400', async () => {
    const accountId = '22222222-2222-4222-8222-222222222222';
    const categoryId = '33333333-3333-4333-8333-333333333333';

    prismaMock.account.findFirst.mockResolvedValue({ id: accountId });
    prismaMock.category.findFirst.mockResolvedValue({
      id: categoryId,
      type: TransactionType.INCOME,
    });

    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({
        accountId,
        categoryId,
        type: TransactionType.EXPENSE,
        amount: 120,
        description: 'Almoço',
        date: '2026-11-15',
      });

    expect(res.status).toBe(400);
  });

  it('GET /api/dashboard/summary returns aggregated KPIs and category breakdown', async () => {
    const accId = '22222222-2222-4222-8222-222222222222';
    prismaMock.account.findMany.mockResolvedValue([
      {
        id: accId,
        name: 'Conta Principal',
        type: AccountType.CHECKING,
        initialBalance: 5000,
        color: '#10b981',
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { transactions: 2 },
      },
    ]);
    prismaMock.transaction.groupBy.mockResolvedValue([
      { accountId: accId, type: TransactionType.INCOME, _sum: { amount: 4000 } },
      { accountId: accId, type: TransactionType.EXPENSE, _sum: { amount: 1000 } },
    ]);

    prismaMock.transaction.findMany
      .mockResolvedValueOnce([
        {
          id: 'tx-1',
          type: TransactionType.INCOME,
          amount: 4000,
          date: new Date('2026-11-05T12:00:00.000Z'),
          category: { id: 'c1', name: 'Salário', color: '#10b981', icon: 'briefcase' },
        },
        {
          id: 'tx-2',
          type: TransactionType.EXPENSE,
          amount: 1000,
          date: new Date('2026-11-10T12:00:00.000Z'),
          category: { id: 'c2', name: 'Moradia', color: '#f43f5e', icon: 'home' },
        },
      ])
      .mockResolvedValueOnce([
        { type: TransactionType.INCOME, amount: 4000, date: new Date('2026-11-05T12:00:00.000Z') },
        { type: TransactionType.EXPENSE, amount: 1000, date: new Date('2026-11-10T12:00:00.000Z') },
      ])
      .mockResolvedValueOnce([]);

    const res = await request(app)
      .get('/api/dashboard/summary?month=11&year=2026')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.kpis.totalBalance).toBe(8000);
    expect(res.body.kpis.periodIncome).toBe(4000);
    expect(res.body.kpis.periodExpense).toBe(1000);
    expect(res.body.kpis.periodBalance).toBe(3000);
    expect(res.body.kpis.savingsRate).toBe(75);
    expect(res.body.expensesByCategory).toHaveLength(1);
    expect(res.body.expensesByCategory[0].percentage).toBe(100);
    expect(res.body.monthlyEvolution).toHaveLength(6);
  });
});
