from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.accounts.models import Account, AccountType
from apps.categories.models import Category, TransactionType
from apps.transactions.models import Transaction
from apps.users.models import User


def _shift_year_month(year: int, month: int, offset: int) -> tuple[int, int]:
    total_months = year * 12 + (month - 1) - offset
    return total_months // 12, (total_months % 12) + 1


class Command(BaseCommand):
    help = "Popula o banco com usuário demo (demo@finpulse.dev / 123456) e 6 meses de movimentações."

    @transaction.atomic
    def handle(self, *args, **options) -> None:
        email = "demo@finpulse.dev"
        user, created = User.objects.get_or_create(
            email=email,
            defaults={"name": "Rodrigo Demo"},
        )
        if created or not user.has_usable_password():
            user.set_password("123456")
            user.save(update_fields=["password"])

        if Account.objects.filter(user=user).exists():
            self.stdout.write(
                self.style.WARNING(
                    f"Seed already populated for {email} — skipping."
                )
            )
            return

        checking = Account.objects.create(
            user=user,
            name="Nubank Conta",
            type=AccountType.CHECKING,
            initial_balance=Decimal("4500.00"),
            color="#8b5cf6",
        )
        card = Account.objects.create(
            user=user,
            name="Cartão Black",
            type=AccountType.CREDIT_CARD,
            initial_balance=Decimal("0.00"),
            color="#0f172a",
        )
        savings = Account.objects.create(
            user=user,
            name="Reserva CDB",
            type=AccountType.INVESTMENT,
            initial_balance=Decimal("12000.00"),
            color="#10b981",
        )

        categories_data = [
            {"name": "Salário", "type": TransactionType.INCOME, "color": "#10b981", "icon": "briefcase"},
            {"name": "Freelance", "type": TransactionType.INCOME, "color": "#06b6d4", "icon": "laptop"},
            {"name": "Rendimentos", "type": TransactionType.INCOME, "color": "#3b82f6", "icon": "trending-up"},
            {"name": "Moradia", "type": TransactionType.EXPENSE, "color": "#f43f5e", "icon": "home"},
            {"name": "Alimentação", "type": TransactionType.EXPENSE, "color": "#f97316", "icon": "utensils"},
            {"name": "Transporte", "type": TransactionType.EXPENSE, "color": "#eab308", "icon": "car"},
            {"name": "Lazer", "type": TransactionType.EXPENSE, "color": "#a855f7", "icon": "gamepad-2"},
            {"name": "Saúde", "type": TransactionType.EXPENSE, "color": "#ec4899", "icon": "heart-pulse"},
        ]

        by_name: dict[str, Category] = {}
        for item in categories_data:
            cat = Category.objects.create(user=user, **item)
            by_name[cat.name] = cat

        now = datetime.now(timezone.utc)
        transactions: list[Transaction] = []

        for offset in range(5, -1, -1):
            year, month = _shift_year_month(now.year, now.month, offset)
            transactions.extend(
                [
                    Transaction(
                        user=user,
                        account=checking,
                        category=by_name["Salário"],
                        type=TransactionType.INCOME,
                        amount=Decimal("7800.00"),
                        description="Salário mensal",
                        date=datetime(year, month, 5, 9, 0, 0, tzinfo=timezone.utc),
                    ),
                    Transaction(
                        user=user,
                        account=checking,
                        category=by_name["Freelance"],
                        type=TransactionType.INCOME,
                        amount=Decimal("1850.00") if offset % 2 == 0 else Decimal("950.00"),
                        description="Projeto web sob demanda",
                        date=datetime(year, month, 18, 14, 0, 0, tzinfo=timezone.utc),
                    ),
                    Transaction(
                        user=user,
                        account=savings,
                        category=by_name["Rendimentos"],
                        type=TransactionType.INCOME,
                        amount=Decimal(f"{145.5 + offset * 6:.2f}"),
                        description="Rendimento CDB 110% CDI",
                        date=datetime(year, month, 25, 10, 0, 0, tzinfo=timezone.utc),
                    ),
                    Transaction(
                        user=user,
                        account=checking,
                        category=by_name["Moradia"],
                        type=TransactionType.EXPENSE,
                        amount=Decimal("2150.00"),
                        description="Aluguel e condomínio",
                        date=datetime(year, month, 8, 11, 0, 0, tzinfo=timezone.utc),
                    ),
                    Transaction(
                        user=user,
                        account=card,
                        category=by_name["Alimentação"],
                        type=TransactionType.EXPENSE,
                        amount=Decimal(f"{1120 + offset * 45:.2f}"),
                        description="Supermercado e restaurantes",
                        date=datetime(year, month, 14, 19, 30, 0, tzinfo=timezone.utc),
                    ),
                    Transaction(
                        user=user,
                        account=card,
                        category=by_name["Transporte"],
                        type=TransactionType.EXPENSE,
                        amount=Decimal(f"{420 + offset * 20:.2f}"),
                        description="Combustível e aplicativos",
                        date=datetime(year, month, 16, 17, 0, 0, tzinfo=timezone.utc),
                    ),
                    Transaction(
                        user=user,
                        account=card,
                        category=by_name["Lazer"],
                        type=TransactionType.EXPENSE,
                        amount=Decimal(f"{390 + (offset % 3) * 90:.2f}"),
                        description="Cinema, streaming e saídas",
                        date=datetime(year, month, 21, 21, 0, 0, tzinfo=timezone.utc),
                    ),
                    Transaction(
                        user=user,
                        account=checking,
                        category=by_name["Saúde"],
                        type=TransactionType.EXPENSE,
                        amount=Decimal("280.00"),
                        description="Academia e farmácia",
                        date=datetime(year, month, 12, 8, 30, 0, tzinfo=timezone.utc),
                    ),
                ]
            )

        Transaction.objects.bulk_create(transactions)
        self.stdout.write(
            self.style.SUCCESS(
                f"Seed completed: {len(transactions)} transactions created for {email}."
            )
        )
