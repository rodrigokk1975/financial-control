import { AccountType, PrismaClient, TransactionType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'demo@finpulse.dev';
  const passwordHash = await bcrypt.hash('123456', 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: 'Rodrigo Demo',
      email,
      passwordHash,
    },
  });

  const existingAccounts = await prisma.account.count({
    where: { userId: user.id },
  });

  if (existingAccounts > 0) {
    console.log('Seed already populated for demo@finpulse.dev — skipping.');
    return;
  }

  const [checking, card, savings] = await Promise.all([
    prisma.account.create({
      data: {
        userId: user.id,
        name: 'Nubank Conta',
        type: AccountType.CHECKING,
        initialBalance: 4500.0,
        color: '#8b5cf6',
      },
    }),
    prisma.account.create({
      data: {
        userId: user.id,
        name: 'Cartão Black',
        type: AccountType.CREDIT_CARD,
        initialBalance: 0,
        color: '#0f172a',
      },
    }),
    prisma.account.create({
      data: {
        userId: user.id,
        name: 'Reserva CDB',
        type: AccountType.INVESTMENT,
        initialBalance: 12000.0,
        color: '#10b981',
      },
    }),
  ]);

  const categoriesData = [
    { name: 'Salário', type: TransactionType.INCOME, color: '#10b981', icon: 'briefcase' },
    { name: 'Freelance', type: TransactionType.INCOME, color: '#06b6d4', icon: 'laptop' },
    { name: 'Rendimentos', type: TransactionType.INCOME, color: '#3b82f6', icon: 'trending-up' },
    { name: 'Moradia', type: TransactionType.EXPENSE, color: '#f43f5e', icon: 'home' },
    { name: 'Alimentação', type: TransactionType.EXPENSE, color: '#f97316', icon: 'utensils' },
    { name: 'Transporte', type: TransactionType.EXPENSE, color: '#eab308', icon: 'car' },
    { name: 'Lazer', type: TransactionType.EXPENSE, color: '#a855f7', icon: 'gamepad-2' },
    { name: 'Saúde', type: TransactionType.EXPENSE, color: '#ec4899', icon: 'heart-pulse' },
  ];

  const categories = await Promise.all(
    categoriesData.map((cat) =>
      prisma.category.create({
        data: { userId: user.id, ...cat },
      })
    )
  );

  const byName = Object.fromEntries(categories.map((c) => [c.name, c]));
  const now = new Date();
  const transactions: Array<{
    userId: string;
    accountId: string;
    categoryId: string;
    type: TransactionType;
    amount: number;
    description: string;
    date: Date;
  }> = [];

  for (let offset = 5; offset >= 0; offset--) {
    const year = now.getFullYear();
    const month = now.getMonth() - offset;

    transactions.push(
      {
        userId: user.id,
        accountId: checking.id,
        categoryId: byName['Salário'].id,
        type: TransactionType.INCOME,
        amount: 7800,
        description: 'Salário mensal',
        date: new Date(year, month, 5, 9, 0, 0),
      },
      {
        userId: user.id,
        accountId: checking.id,
        categoryId: byName['Freelance'].id,
        type: TransactionType.INCOME,
        amount: offset % 2 === 0 ? 1850 : 950,
        description: 'Projeto web sob demanda',
        date: new Date(year, month, 18, 14, 0, 0),
      },
      {
        userId: user.id,
        accountId: savings.id,
        categoryId: byName['Rendimentos'].id,
        type: TransactionType.INCOME,
        amount: 145.5 + offset * 6,
        description: 'Rendimento CDB 110% CDI',
        date: new Date(year, month, 25, 10, 0, 0),
      },
      {
        userId: user.id,
        accountId: checking.id,
        categoryId: byName['Moradia'].id,
        type: TransactionType.EXPENSE,
        amount: 2150,
        description: 'Aluguel e condomínio',
        date: new Date(year, month, 8, 11, 0, 0),
      },
      {
        userId: user.id,
        accountId: card.id,
        categoryId: byName['Alimentação'].id,
        type: TransactionType.EXPENSE,
        amount: 1120 + offset * 45,
        description: 'Supermercado e restaurantes',
        date: new Date(year, month, 14, 19, 30, 0),
      },
      {
        userId: user.id,
        accountId: card.id,
        categoryId: byName['Transporte'].id,
        type: TransactionType.EXPENSE,
        amount: 420 + offset * 20,
        description: 'Combustível e aplicativos',
        date: new Date(year, month, 16, 17, 0, 0),
      },
      {
        userId: user.id,
        accountId: card.id,
        categoryId: byName['Lazer'].id,
        type: TransactionType.EXPENSE,
        amount: 390 + (offset % 3) * 90,
        description: 'Cinema, streaming e saídas',
        date: new Date(year, month, 21, 21, 0, 0),
      },
      {
        userId: user.id,
        accountId: checking.id,
        categoryId: byName['Saúde'].id,
        type: TransactionType.EXPENSE,
        amount: 280,
        description: 'Academia e farmácia',
        date: new Date(year, month, 12, 8, 30, 0),
      }
    );
  }

  await prisma.transaction.createMany({ data: transactions });
  console.log(`Seed completed: ${transactions.length} transactions created for ${email}.`);
}

main()
  .catch((error) => {
    console.error('Seed error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
