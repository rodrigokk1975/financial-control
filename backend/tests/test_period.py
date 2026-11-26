from core.utils.period import format_iso_utc, resolve_date_range


def test_resolve_date_range_month_and_year_utc_bounds():
    date_range = resolve_date_range(month=2, year=2026)
    assert date_range is not None
    assert format_iso_utc(date_range.start) == "2026-02-01T00:00:00.000Z"
    assert format_iso_utc(date_range.end) == "2026-02-28T23:59:59.999Z"


def test_resolve_date_range_custom_start_and_end():
    date_range = resolve_date_range(start_date="2026-05-10", end_date="2026-05-25")
    assert date_range is not None
    assert format_iso_utc(date_range.start) == "2026-05-10T00:00:00.000Z"
    assert format_iso_utc(date_range.end) == "2026-05-25T23:59:59.999Z"


def test_resolve_date_range_year_only():
    date_range = resolve_date_range(year=2026)
    assert date_range is not None
    assert format_iso_utc(date_range.start) == "2026-01-01T00:00:00.000Z"
    assert format_iso_utc(date_range.end) == "2026-12-31T23:59:59.999Z"


def test_resolve_date_range_returns_none_when_empty():
    assert resolve_date_range() is None
