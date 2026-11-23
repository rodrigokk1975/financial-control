export interface PeriodInput {
  month?: number;
  year?: number;
  startDate?: string;
  endDate?: string;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export function resolveDateRange(input: PeriodInput): DateRange | undefined {
  if (input.startDate || input.endDate) {
    const start = input.startDate
      ? new Date(`${input.startDate}T00:00:00.000Z`)
      : new Date('1970-01-01T00:00:00.000Z');
    const end = input.endDate
      ? new Date(`${input.endDate}T23:59:59.999Z`)
      : new Date('2999-12-31T23:59:59.999Z');

    return { start, end };
  }

  if (input.month !== undefined && input.year !== undefined) {
    const start = new Date(Date.UTC(input.year, input.month - 1, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(input.year, input.month, 0, 23, 59, 59, 999));
    return { start, end };
  }

  if (input.year !== undefined) {
    const start = new Date(Date.UTC(input.year, 0, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(input.year, 11, 31, 23, 59, 59, 999));
    return { start, end };
  }

  return undefined;
}
