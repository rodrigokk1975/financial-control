import { Router } from 'express';
import { ensureAuthenticated } from '../../middlewares/ensureAuthenticated';
import {
  createCategorySchema,
  listCategoriesQuerySchema,
  updateCategorySchema,
} from './categories.schemas';
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from './categories.service';

export const categoriesRouter = Router();

categoriesRouter.use(ensureAuthenticated);

categoriesRouter.get('/', async (req, res, next) => {
  try {
    const query = listCategoriesQuerySchema.parse(req.query);
    const categories = await listCategories(req.userId!, query.type);
    return res.status(200).json({ categories });
  } catch (error) {
    return next(error);
  }
});

categoriesRouter.post('/', async (req, res, next) => {
  try {
    const input = createCategorySchema.parse(req.body);
    const category = await createCategory(req.userId!, input);
    return res.status(201).json({ category });
  } catch (error) {
    return next(error);
  }
});

categoriesRouter.put('/:id', async (req, res, next) => {
  try {
    const input = updateCategorySchema.parse(req.body);
    const category = await updateCategory(req.userId!, req.params.id, input);
    return res.status(200).json({ category });
  } catch (error) {
    return next(error);
  }
});

categoriesRouter.delete('/:id', async (req, res, next) => {
  try {
    await deleteCategory(req.userId!, req.params.id);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});
