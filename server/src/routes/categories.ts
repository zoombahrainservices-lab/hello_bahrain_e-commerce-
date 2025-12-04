import { Router, Request, Response } from 'express';
import { getSupabase } from '../config/db';

const router = Router();

// GET /api/categories - public list of product categories
router.get('/', async (req: Request, res: Response) => {
  try {
    const { data, error } = await getSupabase()
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    const categories = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
    }));

    res.json(categories);
  } catch (error) {
    console.error('Error fetching public categories:', error);
    res.status(500).json({ message: 'Error fetching categories' });
  }
});

export default router;


