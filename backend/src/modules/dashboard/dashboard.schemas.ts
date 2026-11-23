import { z } from 'zod';

const isoDateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;

export const dashboardSummaryQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  startDate: z
    .string()
    .regex(isoDateOnlyRegex, 'startDate deve estar no formato YYYY-MM-DD.')
    .optional(),
  endDate: z
    .string()
    .regex(isoDateOnlyRegex, 'endDate deve estar no formato YYYY-MM-DD.')
    .optional(),
});

export type DashboardSummaryQuery = z.infer<typeof dashboardSummaryQuerySchema>;
