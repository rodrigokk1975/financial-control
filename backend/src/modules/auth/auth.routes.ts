import { Router } from 'express';
import { ensureAuthenticated } from '../../middlewares/ensureAuthenticated';
import { loginSchema, registerSchema } from './auth.schemas';
import { getAuthenticatedUser, loginUser, registerUser } from './auth.service';

export const authRouter = Router();

authRouter.post('/register', async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const result = await registerUser(input);
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const result = await loginUser(input);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
});

authRouter.get('/me', ensureAuthenticated, async (req, res, next) => {
  try {
    const user = await getAuthenticatedUser(req.userId!);
    return res.status(200).json({ user });
  } catch (error) {
    return next(error);
  }
});
