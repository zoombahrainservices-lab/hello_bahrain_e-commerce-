import { Router, Request, Response } from 'express';
import { supabaseHelpers } from '../lib/supabase';

const router = Router();

// GET /api/products - Public product listing with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      search,
      category,
      sort = 'newest',
      page = '1',
      limit = '12',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const query: any = {
      search: search as string,
      category: category as string,
      sort: sort as string,
      page: pageNum,
      limit: limitNum,
    };

    const result = await supabaseHelpers.searchProducts(query);

    const totalPages = Math.ceil(result.count / limitNum);

    // Transform products to camelCase for frontend
    const transformedItems = (result.data || []).map((product: any) => ({
      _id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      category: product.category,
      tags: product.tags,
      image: product.image,
      images: product.images,
      inStock: product.in_stock,
      stockQuantity: product.stock_quantity,
      rating: product.rating,
      isFeatured: product.is_featured,
      isNew: product.is_new,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    }));

    res.json({
      items: transformedItems,
      total: result.count,
      page: pageNum,
      totalPages,
      limit: limitNum,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// GET /api/products/:slug - Get single product by slug
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const product = await supabaseHelpers.findProductBySlug(slug);

    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    // Transform to camelCase for frontend
    const transformedProduct = {
      _id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      category: product.category,
      tags: product.tags,
      image: product.image,
      images: product.images,
      inStock: product.in_stock,
      stockQuantity: product.stock_quantity,
      rating: product.rating,
      isFeatured: product.is_featured,
      isNew: product.is_new,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    };

    res.json(transformedProduct);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product' });
  }
});

export default router;
