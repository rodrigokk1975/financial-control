import { Router } from 'express';
import { ensureAuthenticated } from '../../middlewares/ensureAuthenticated';
import { createAccountSchema, updateAccountSchema } from './accounts.schemas';
import {
  createAccount,
  deleteAccount,
  listAccounts,
  updateAccount,
} from './accounts.service';

export const accountsRouter = Router();

accountsRouter.use(ensureAuthenticated);

accountsRouter.get('/', async (req, res, next) => {
  try {
    const accounts = await listAccounts(req.userId!);
    return res.status(200).json({ accounts });
  } catch (error) {
    return next(error);
  }
});

accountsRouter.post('/', async (req, res, next) => {
  try {
    const input = createAccountSchema.parse(req.body);
    const account = await createAccount(req.userId!, input);
    return res.status(201).json({ account });
  } catch (error) {
    return next(error);
  }
});

accountsRouter.put('/:id', async (req, res, next) => {
  try {
    const input = updateAccountSchema.parse(req.body);
    const account = await updateAccount(req.userId!, req.params.id, input);
    return res.status(200).json({ account });
  } catch (error) {
    return next(error);
  }
});

accountsRouter.delete('/:id', async (req, res, next) => {
  try {
    await deleteAccount(req.userId!, req.params.id);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});
