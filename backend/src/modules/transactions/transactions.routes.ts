import { Router } from 'express';
import { ensureAuthenticated } from '../../middlewares/ensureAuthenticated';
import {
  createTransactionSchema,
  listTransactionsQuerySchema,
  updateTransactionSchema,
} from './transactions.schemas';
import {
  createTransaction,
  deleteTransaction,
  listTransactions,
  updateTransaction,
} from './transactions.service';

export const transactionsRouter = Router();

transactionsRouter.use(ensureAuthenticated);

transactionsRouter.get('/', async (req, res, next) => {
  try {
    const query = listTransactionsQuerySchema.parse(req.query);
    const result = await listTransactions(req.userId!, query);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
});

transactionsRouter.post('/', async (req, res, next) => {
  try {
    const input = createTransactionSchema.parse(req.body);
    const transaction = await createTransaction(req.userId!, input);
    return res.status(201).json({ transaction });
  } catch (error) {
    return next(error);
  }
});

transactionsRouter.put('/:id', async (req, res, next) => {
  try {
    const input = updateTransactionSchema.parse(req.body);
    const transaction = await updateTransaction(req.userId!, req.params.id, input);
    return res.status(200).json({ transaction });
  } catch (error) {
    return next(error);
  }
});

transactionsRouter.delete('/:id', async (req, res, next) => {
  try {
    await deleteTransaction(req.userId!, req.params.id);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});
