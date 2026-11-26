from __future__ import annotations

import calendar
from dataclasses import dataclass
from datetime import date, datetime, timezone


@dataclass(frozen=True)
class DateRange:
    start: datetime
    end: datetime


def _parse_iso_date(value: str) -> date:
    return date.fromisoformat(value)


def resolve_date_range(
    *,
    month: int | None = None,
    year: int | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
) -> DateRange | None:
    if start_date or end_date:
        start_d = _parse_iso_date(start_date) if start_date else date(1970, 1, 1)
        end_d = _parse_iso_date(end_date) if end_date else date(2999, 12, 31)
        start = datetime(
            start_d.year, start_d.month, start_d.day, 0, 0, 0, 0, tzinfo=timezone.utc
        )
        end = datetime(
            end_d.year, end_d.month, end_d.day, 23, 59, 59, 999000, tzinfo=timezone.utc
        )
        return DateRange(start=start, end=end)

    if month is not None and year is not None:
        last_day = calendar.monthrange(year, month)[1]
        start = datetime(year, month, 1, 0, 0, 0, 0, tzinfo=timezone.utc)
        end = datetime(year, month, last_day, 23, 59, 59, 999000, tzinfo=timezone.utc)
        return DateRange(start=start, end=end)

    if year is not None:
        start = datetime(year, 1, 1, 0, 0, 0, 0, tzinfo=timezone.utc)
        end = datetime(year, 12, 31, 23, 59, 59, 999000, tzinfo=timezone.utc)
        return DateRange(start=start, end=end)

    return None


def format_iso_utc(dt: datetime) -> str:
    """Format a datetime as ISO-8601 UTC string ending with Z (matching JS toISOString)."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    else:
        dt = dt.astimezone(timezone.utc)
    ms = dt.microsecond // 1000
    return dt.strftime("%Y-%m-%dT%H:%M:%S") + f".{ms:03d}Z"
