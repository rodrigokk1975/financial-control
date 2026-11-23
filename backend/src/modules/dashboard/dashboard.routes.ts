import { Router } from 'express';
import { ensureAuthenticated } from '../../middlewares/ensureAuthenticated';
import { dashboardSummaryQuerySchema } from './dashboard.schemas';
import { getDashboardSummary } from './dashboard.service';

export const dashboardRouter = Router();

dashboardRouter.use(ensureAuthenticated);

dashboardRouter.get('/summary', async (req, res, next) => {
  try {
    const query = dashboardSummaryQuerySchema.parse(req.query);
    const summary = await getDashboardSummary(req.userId!, query);
    return res.status(200).json(summary);
  } catch (error) {
    return next(error);
  }
});
