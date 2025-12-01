import { Router, Response, Request } from 'express';
import { getSupabase } from '../config/db';
import { authMiddleware, requireAdmin } from '../middleware/auth';
import { supabaseHelpers } from '../lib/supabase';
import { uploadBase64Image, uploadMultipleBase64Images } from '../lib/storage';

const router = Router();

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(requireAdmin);

// ========== SUMMARY/STATS ==========

// GET /api/admin/summary
router.get('/summary', async (req: Request, res: Response) => {
  try {
    // Get total users
    const { count: totalUsers } = await getSupabase()
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get total orders
    const { count: totalOrders } = await getSupabase()
      .from('orders')
      .select('*', { count: 'exact', head: true });

    // Get product count
    const { count: productCount } = await getSupabase()
      .from('products')
      .select('*', { count: 'exact', head: true });

    // Get paid orders for revenue calculation
    const { data: paidOrders } = await getSupabase()
      .from('orders')
      .select('total')
      .eq('payment_status', 'paid');

    const totalRevenue = paidOrders?.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0) || 0;

    // Get recent orders
    const { data: recentOrders } = await getSupabase()
      .from('orders')
      .select(`
        *,
        users!orders_user_id_fkey(id, name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    // Transform orders to match frontend expectations
    const transformedOrders = (recentOrders || []).map((order: any) => {
      // Handle user data - Supabase returns it as 'users' from the join
      const userData = order.users || null;
      
      return {
        _id: order.id,
        id: order.id,
        user: userData ? {
          id: userData.id,
          name: userData.name,
          email: userData.email,
        } : order.user_id,
        user_id: order.user_id,
        total: parseFloat(order.total.toString()),
        status: order.status,
        paymentStatus: order.payment_status,
        payment_status: order.payment_status,
        shippingAddress: order.shipping_address,
        shipping_address: order.shipping_address,
        createdAt: order.created_at,
        created_at: order.created_at,
        updatedAt: order.updated_at,
        updated_at: order.updated_at,
        items: [], // Will be populated if needed
      };
    });

    res.json({
      totalUsers: totalUsers || 0,
      totalOrders: totalOrders || 0,
      totalRevenue,
      productCount: productCount || 0,
      recentOrders: transformedOrders,
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ message: 'Error fetching summary' });
  }
});

// ========== PRODUCT MANAGEMENT ==========

// GET /api/admin/products - Get all products for admin
router.get('/products', async (req: Request, res: Response) => {
  try {
    const { data, error } = await getSupabase()
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform to match frontend expectations
    const transformedProducts = (data || []).map((product: any) => ({
      _id: product.id,
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      category: product.category,
      tags: product.tags || [],
      image: product.image,
      images: product.images || [],
      inStock: product.in_stock,
      in_stock: product.in_stock,
      stockQuantity: product.stock_quantity,
      stock_quantity: product.stock_quantity,
      rating: product.rating,
      isFeatured: product.is_featured,
      is_featured: product.is_featured,
      isNew: product.is_new,
      is_new: product.is_new,
      createdAt: product.created_at,
      created_at: product.created_at,
      updatedAt: product.updated_at,
      updated_at: product.updated_at,
    }));

    res.json(transformedProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// GET /api/admin/products/:id - Get single product by ID
router.get('/products/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await getSupabase()
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({ message: 'Product not found' });
        return;
      }
      throw error;
    }

    // Transform to match frontend expectations
    const product = {
      _id: data.id,
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      price: data.price,
      category: data.category,
      tags: data.tags || [],
      image: data.image,
      images: data.images || [],
      inStock: data.in_stock,
      in_stock: data.in_stock,
      stockQuantity: data.stock_quantity,
      stock_quantity: data.stock_quantity,
      rating: data.rating,
      isFeatured: data.is_featured,
      is_featured: data.is_featured,
      isNew: data.is_new,
      is_new: data.is_new,
      createdAt: data.created_at,
      created_at: data.created_at,
      updatedAt: data.updated_at,
      updated_at: data.updated_at,
    };

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product' });
  }
});

// POST /api/admin/products - Create product
router.post('/products', async (req: Request, res: Response) => {
  try {
    const productData = req.body;

    // Validate required fields
    if (!productData.name || !productData.slug || !productData.price) {
      res.status(400).json({ message: 'Name, slug, and price are required' });
      return;
    }

    // Check if slug is unique
    const existing = await supabaseHelpers.findProductBySlug(productData.slug);
    if (existing) {
      res.status(400).json({ message: 'Product with this slug already exists' });
      return;
    }

    // Upload images to Supabase Storage and replace base64 with URLs
    const mainImageUrl = await uploadBase64Image(productData.image, 'products');
    const additionalImageUrls = await uploadMultipleBase64Images(productData.images || [], 'products');

    // Transform data to match database schema
    const insertData = {
      name: productData.name,
      slug: productData.slug,
      description: productData.description,
      price: productData.price,
      category: productData.category,
      tags: productData.tags || [],
      image: mainImageUrl,
      images: additionalImageUrls,
      in_stock: productData.inStock !== undefined ? productData.inStock : true,
      stock_quantity: productData.stockQuantity || 0,
      rating: productData.rating || 0,
      is_featured: productData.isFeatured || false,
      is_new: productData.isNew || false,
    };

    const { data, error } = await getSupabase()
      .from('products')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    // Transform back to camelCase for response
    const response = {
      _id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      price: data.price,
      category: data.category,
      tags: data.tags,
      image: data.image,
      images: data.images,
      inStock: data.in_stock,
      stockQuantity: data.stock_quantity,
      rating: data.rating,
      isFeatured: data.is_featured,
      isNew: data.is_new,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    res.status(201).json(response);
  } catch (error: any) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Error creating product' });
  }
});

// PUT /api/admin/products/:id - Update product
router.put('/products/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const productData = req.body;

    // Transform data to match database schema
    const updateData: any = {};
    if (productData.name !== undefined) updateData.name = productData.name;
    if (productData.slug !== undefined) updateData.slug = productData.slug;
    if (productData.description !== undefined) updateData.description = productData.description;
    if (productData.price !== undefined) updateData.price = productData.price;
    if (productData.category !== undefined) updateData.category = productData.category;
    if (productData.tags !== undefined) updateData.tags = productData.tags;
    if (productData.image !== undefined) {
      updateData.image = await uploadBase64Image(productData.image, 'products');
    }
    if (productData.images !== undefined) {
      updateData.images = await uploadMultipleBase64Images(productData.images, 'products');
    }
    if (productData.inStock !== undefined) updateData.in_stock = productData.inStock;
    if (productData.stockQuantity !== undefined) updateData.stock_quantity = productData.stockQuantity;
    if (productData.rating !== undefined) updateData.rating = productData.rating;
    if (productData.isFeatured !== undefined) updateData.is_featured = productData.isFeatured;
    if (productData.isNew !== undefined) updateData.is_new = productData.isNew;

    const { data, error } = await getSupabase()
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({ message: 'Product not found' });
        return;
      }
      throw error;
    }

    // Transform back to camelCase
    const response = {
      _id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      price: data.price,
      category: data.category,
      tags: data.tags,
      image: data.image,
      images: data.images,
      inStock: data.in_stock,
      stockQuantity: data.stock_quantity,
      rating: data.rating,
      isFeatured: data.is_featured,
      isNew: data.is_new,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Error updating product' });
  }
});

// DELETE /api/admin/products/:id - Delete product
router.delete('/products/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await getSupabase()
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({ message: 'Product not found' });
        return;
      }
      throw error;
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product' });
  }
});

// ========== BANNER MANAGEMENT ==========

// GET /api/admin/banners - Get all banners
router.get('/banners', async (req: Request, res: Response) => {
  try {
    const { data, error } = await getSupabase()
      .from('banners')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform to camelCase for frontend
    const transformedBanners = (data || []).map((banner: any) => {
      // Extract alignment data from cta_link if it exists
      const linkParts = banner.cta_link.split('|||');
      const actualLink = linkParts[0];
      let savedAlignment: any = {
        textAlign: 'left',
        textVertical: 'middle',
        buttonAlign: 'left',
        buttonVertical: 'middle',
        displayOrder: 0,
        titleColor: '#ffffff',
        subtitleColor: '#e5e7eb',
        buttonBgColor: '#ffffff',
        buttonTextColor: '#111827',
        titleSize: 'lg',
        subtitleSize: 'md',
        titleBold: true,
        titleItalic: false,
        subtitleBold: false,
        subtitleItalic: false,
      };

      if (linkParts[1]) {
        try {
          savedAlignment = JSON.parse(linkParts[1]);
        } catch (e) {
          // Invalid JSON, use defaults
        }
      }

      return {
        _id: banner.id,
        title: banner.title,
        subtitle: banner.subtitle,
        ctaLabel: banner.cta_label,
        ctaLink: actualLink, // Return clean link without alignment data
        image: banner.image,
        active: banner.active,
        textAlign: savedAlignment.textAlign || 'left',
        textVertical: savedAlignment.textVertical || 'middle',
        buttonAlign: savedAlignment.buttonAlign || 'left',
        buttonVertical: savedAlignment.buttonVertical || 'middle',
        displayOrder: savedAlignment.displayOrder || 0,
        titleColor: savedAlignment.titleColor || '#ffffff',
        subtitleColor: savedAlignment.subtitleColor || '#e5e7eb',
        buttonBgColor: savedAlignment.buttonBgColor || '#ffffff',
        buttonTextColor: savedAlignment.buttonTextColor || '#111827',
        titleSize: savedAlignment.titleSize || 'lg',
        subtitleSize: savedAlignment.subtitleSize || 'md',
        titleBold: savedAlignment.titleBold ?? true,
        titleItalic: savedAlignment.titleItalic ?? false,
        subtitleBold: savedAlignment.subtitleBold ?? false,
        subtitleItalic: savedAlignment.subtitleItalic ?? false,
        createdAt: banner.created_at,
        updatedAt: banner.updated_at,
      };
    });

    res.json(transformedBanners);
  } catch (error) {
    console.error('Error fetching banners:', error);
    res.status(500).json({ message: 'Error fetching banners' });
  }
});

// POST /api/admin/banners - Create banner
router.post('/banners', async (req: Request, res: Response) => {
  try {
    const bannerData = req.body;

    // Upload banner image to Supabase Storage (avoid huge base64 in DB)
    const bannerImageUrl = await uploadBase64Image(bannerData.image, 'banners');

    // Store alignment settings in the cta_link field
    let finalCtaLink = bannerData.ctaLink || '/';
    const alignmentData = {
      textAlign: bannerData.textAlign || 'left',
      textVertical: bannerData.textVertical || 'middle',
      buttonAlign: bannerData.buttonAlign || 'left',
      buttonVertical: bannerData.buttonVertical || 'middle',
      displayOrder: bannerData.displayOrder || 0,
      titleColor: bannerData.titleColor || '#ffffff',
      subtitleColor: bannerData.subtitleColor || '#e5e7eb',
      buttonBgColor: bannerData.buttonBgColor || '#ffffff',
      buttonTextColor: bannerData.buttonTextColor || '#111827',
      titleSize: bannerData.titleSize || 'lg',
      subtitleSize: bannerData.subtitleSize || 'md',
      titleBold: bannerData.titleBold ?? true,
      titleItalic: bannerData.titleItalic ?? false,
      subtitleBold: bannerData.subtitleBold ?? false,
      subtitleItalic: bannerData.subtitleItalic ?? false,
    };
    
    // Append alignment data to link
    finalCtaLink = `${bannerData.ctaLink}|||${JSON.stringify(alignmentData)}`;

    // Transform to snake_case for database - only use existing columns
    const insertData: any = {
      title: bannerData.title,
      subtitle: bannerData.subtitle,
      cta_label: bannerData.ctaLabel,
      cta_link: finalCtaLink, // Store alignment here
      image: bannerImageUrl,
      active: bannerData.active !== undefined ? bannerData.active : true,
    };

    // Only include display_order if provided and column exists
    if (bannerData.displayOrder !== undefined) {
      try {
        insertData.display_order = bannerData.displayOrder;
      } catch (e) {
        // Column doesn't exist, skip
      }
    }

    const { data, error } = await getSupabase()
      .from('banners')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    // Extract alignment data from cta_link
    const createLinkParts = data.cta_link.split('|||');
    const createActualLink = createLinkParts[0];
    let createAlignment: any = {
      textAlign: 'left',
      textVertical: 'middle',
      buttonAlign: 'left',
      buttonVertical: 'middle',
      displayOrder: 0,
    };

    if (createLinkParts[1]) {
      try {
        createAlignment = JSON.parse(createLinkParts[1]);
      } catch (e) {
        // Invalid JSON, use defaults
      }
    }

    // Transform back to camelCase for response
    const response = {
      _id: data.id,
      title: data.title,
      subtitle: data.subtitle,
      ctaLabel: data.cta_label,
      ctaLink: createActualLink, // Return clean link
      image: data.image,
      active: data.active,
      textAlign: createAlignment.textAlign || 'left',
      textVertical: createAlignment.textVertical || 'middle',
      buttonAlign: createAlignment.buttonAlign || 'left',
      buttonVertical: createAlignment.buttonVertical || 'middle',
      displayOrder: createAlignment.displayOrder || 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating banner:', error);
    res.status(500).json({ message: 'Error creating banner' });
  }
});

// PUT /api/admin/banners/:id - Update banner
router.put('/banners/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const bannerData = req.body;

    // Handle display_order conflict resolution (only if column exists)
    if (bannerData.displayOrder !== undefined) {
      try {
        const newOrder = bannerData.displayOrder;
        
        // Check if another banner already has this order
        const { data: conflictingBanner, error: conflictError } = await getSupabase()
          .from('banners')
          .select('id, display_order')
          .eq('display_order', newOrder)
          .neq('id', id)
          .maybeSingle();

        // If column doesn't exist, conflictError will be set, skip conflict resolution
        if (!conflictError && conflictingBanner) {
          // Get the current banner's order
          const { data: currentBanner } = await getSupabase()
            .from('banners')
            .select('display_order')
            .eq('id', id)
            .maybeSingle();

          const oldOrder = currentBanner?.display_order;

          // Swap orders: give the conflicting banner the old order
          if (oldOrder !== undefined && oldOrder !== null) {
            await getSupabase()
              .from('banners')
              .update({ display_order: oldOrder })
              .eq('id', conflictingBanner.id);
          } else {
            // If current banner has no order, find the next available order
            const { data: allBanners } = await getSupabase()
              .from('banners')
              .select('display_order')
              .neq('id', id);

            const usedOrders = (allBanners || [])
              .map((b: any) => b.display_order)
              .filter((o: any) => o !== null && o !== undefined)
              .map((o: any) => parseInt(o) || 0);

            let nextOrder = 0;
            while (usedOrders.includes(nextOrder)) {
              nextOrder++;
            }

            await getSupabase()
              .from('banners')
              .update({ display_order: nextOrder })
              .eq('id', conflictingBanner.id);
          }
        }
      } catch (orderError) {
        // Column doesn't exist or other error, just skip conflict resolution
        console.log('Display order conflict resolution skipped:', orderError);
      }
    }

    // Store alignment settings in the cta_link field
    let updateCtaLink = bannerData.ctaLink || '';
    const updateAlignmentData = {
      textAlign: bannerData.textAlign || 'left',
      textVertical: bannerData.textVertical || 'middle',
      buttonAlign: bannerData.buttonAlign || 'left',
      buttonVertical: bannerData.buttonVertical || 'middle',
      displayOrder: bannerData.displayOrder || 0,
      titleColor: bannerData.titleColor || '#ffffff',
      subtitleColor: bannerData.subtitleColor || '#e5e7eb',
      buttonBgColor: bannerData.buttonBgColor || '#ffffff',
      buttonTextColor: bannerData.buttonTextColor || '#111827',
      titleSize: bannerData.titleSize || 'lg',
      subtitleSize: bannerData.subtitleSize || 'md',
      titleBold: bannerData.titleBold ?? true,
      titleItalic: bannerData.titleItalic ?? false,
      subtitleBold: bannerData.subtitleBold ?? false,
      subtitleItalic: bannerData.subtitleItalic ?? false,
    };
    
    // Remove any existing alignment data from the link
    const updateLinkParts = updateCtaLink.split('|||');
    const updateActualLink = updateLinkParts[0];
    
    // Append alignment data
    updateCtaLink = `${updateActualLink}|||${JSON.stringify(updateAlignmentData)}`;

    // Transform to snake_case for database - only use existing columns
    const updateData: any = {};
    if (bannerData.title !== undefined) updateData.title = bannerData.title;
    if (bannerData.subtitle !== undefined) updateData.subtitle = bannerData.subtitle;
    if (bannerData.ctaLabel !== undefined) updateData.cta_label = bannerData.ctaLabel;
    updateData.cta_link = updateCtaLink; // Store alignment here
    if (bannerData.image !== undefined) {
      // Upload new image to Supabase Storage and save URL
      updateData.image = await uploadBase64Image(bannerData.image, 'banners');
    }
    if (bannerData.active !== undefined) updateData.active = bannerData.active;

    console.log('🔄 Updating banner with data:', JSON.stringify(updateData, null, 2));
    console.log('🎯 Alignment values being sent:', {
      text_align: updateData.text_align,
      text_vertical: updateData.text_vertical,
      button_align: updateData.button_align,
      button_vertical: updateData.button_vertical,
    });

    let { data, error } = await getSupabase()
      .from('banners')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    // If error is about missing columns, try to update basic columns first, then optional separately
    if (error && error.message && (
      error.message.includes('column') && error.message.includes('does not exist') ||
      error.message.includes('text_align') || error.message.includes('text_vertical') ||
      error.message.includes('button_align') || error.message.includes('button_vertical') ||
      error.message.includes('display_order')
    )) {
      console.log('Column error detected, trying separate updates...');
      
      // First update basic columns
      const basicUpdateData: any = {
        title: bannerData.title,
        subtitle: bannerData.subtitle,
        cta_label: bannerData.ctaLabel,
        cta_link: bannerData.ctaLink,
        image: bannerData.image,
        active: bannerData.active !== undefined ? bannerData.active : true,
      };

      const basicResult = await getSupabase()
        .from('banners')
        .update(basicUpdateData)
        .eq('id', id)
        .select()
        .single();

      if (basicResult.error) {
        error = basicResult.error;
        data = null;
      } else {
        data = basicResult.data;
        error = null;
        
        // Now try to update optional columns separately (they might not exist)
        const optionalUpdateData: any = {};
        if (bannerData.textAlign !== undefined) optionalUpdateData.text_align = bannerData.textAlign;
        if (bannerData.textVertical !== undefined) optionalUpdateData.text_vertical = bannerData.textVertical;
        if (bannerData.buttonAlign !== undefined) optionalUpdateData.button_align = bannerData.buttonAlign;
        if (bannerData.buttonVertical !== undefined) optionalUpdateData.button_vertical = bannerData.buttonVertical;
        if (bannerData.displayOrder !== undefined) optionalUpdateData.display_order = bannerData.displayOrder;

        if (Object.keys(optionalUpdateData).length > 0) {
          const optionalResult = await getSupabase()
            .from('banners')
            .update(optionalUpdateData)
            .eq('id', id)
            .select()
            .single();

          // If optional update succeeds, use that data
          if (!optionalResult.error) {
            data = optionalResult.data;
            console.log('Optional columns updated successfully');
          } else {
            console.log('Optional columns update failed (columns may not exist):', optionalResult.error.message);
            // This is okay - basic update succeeded, optional columns just don't exist
          }
        }
      }
    }

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({ message: 'Banner not found' });
        return;
      }
      console.error('Banner update error details:', error);
      throw error;
    }

    // Transform back to camelCase for response
    // Always use database values if they exist, otherwise use provided values
    const response = {
      _id: data.id,
      title: data.title,
      subtitle: data.subtitle,
      ctaLabel: data.cta_label,
      ctaLink: data.cta_link,
      image: data.image,
      active: data.active,
      // Check database first, then fallback to provided values or defaults
      textAlign: data.text_align !== undefined && data.text_align !== null ? data.text_align : (bannerData.textAlign || 'left'),
      textVertical: data.text_vertical !== undefined && data.text_vertical !== null ? data.text_vertical : (bannerData.textVertical || 'middle'),
      buttonAlign: data.button_align !== undefined && data.button_align !== null ? data.button_align : (bannerData.buttonAlign || 'left'),
      buttonVertical: data.button_vertical !== undefined && data.button_vertical !== null ? data.button_vertical : (bannerData.buttonVertical || 'middle'),
      displayOrder: data.display_order !== undefined && data.display_order !== null ? data.display_order : (bannerData.displayOrder !== undefined ? bannerData.displayOrder : 0),
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    console.log('✅ Banner update response:', JSON.stringify(response, null, 2));
    console.log('💾 Database values after update:', {
      text_align: data.text_align,
      text_vertical: data.text_vertical,
      button_align: data.button_align,
      button_vertical: data.button_vertical,
      display_order: data.display_order,
    });
    console.log('📤 Response alignment values:', {
      textAlign: response.textAlign,
      textVertical: response.textVertical,
      buttonAlign: response.buttonAlign,
      buttonVertical: response.buttonVertical,
    });
    res.json(response);
  } catch (error: any) {
    console.error('Error updating banner:', error);
    const errorMessage = error.message || 'Error updating banner';
    const errorDetails = error.details || error.hint || '';
    res.status(500).json({ 
      message: errorMessage,
      details: errorDetails,
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// DELETE /api/admin/banners/:id - Delete banner
router.delete('/banners/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await getSupabase()
      .from('banners')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({ message: 'Banner not found' });
        return;
      }
      throw error;
    }

    res.json({ message: 'Banner deleted successfully' });
  } catch (error) {
    console.error('Error deleting banner:', error);
    res.status(500).json({ message: 'Error deleting banner' });
  }
});

// ========== ORDER MANAGEMENT ==========

// GET /api/admin/orders - Get all orders
router.get('/orders', async (req: Request, res: Response) => {
  try {
    const { status, userId } = req.query;

    let query = getSupabase()
      .from('orders')
      .select(`
        *,
        users!orders_user_id_fkey(id, name, email),
        order_items (*)
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }
    if (userId) {
      query = query.eq('user_id', userId as string);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Transform data to match frontend expectations
    const orders = (data || []).map((order: any) => {
      // Handle user data - Supabase returns it as 'users' from the join
      const userData = order.users || null;
      
      return {
        _id: order.id,
        id: order.id,
        user: userData ? {
          id: userData.id,
          name: userData.name,
          email: userData.email,
        } : order.user_id,
        user_id: order.user_id,
        items: (order.order_items || []).map((item: any) => ({
          product: item.product_id,
          name: item.product_name || 'Unknown Product',
          price: parseFloat(item.price.toString()),
          quantity: item.quantity,
          image: item.product_image || '',
        })),
        total: parseFloat(order.total.toString()),
        status: order.status,
        paymentStatus: order.payment_status,
        payment_status: order.payment_status,
        shippingAddress: order.shipping_address,
        shipping_address: order.shipping_address,
        createdAt: order.created_at,
        created_at: order.created_at,
        updatedAt: order.updated_at,
        updated_at: order.updated_at,
      };
    });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// PATCH /api/admin/orders/:id/status - Update order status
router.patch('/orders/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ message: 'Invalid status' });
      return;
    }

    const { data, error } = await getSupabase()
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select(`
        *,
        users!orders_user_id_fkey(id, name, email)
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({ message: 'Order not found' });
        return;
      }
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Error updating order status' });
  }
});

// ========== USER MANAGEMENT ==========

// GET /api/admin/users - Get all users
router.get('/users', async (req: Request, res: Response) => {
  try {
    const { data, error } = await getSupabase()
      .from('users')
      .select('id, name, email, role, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform to match expected format
    const users = (data || []).map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.created_at,
    }));

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// PATCH /api/admin/users/:id/role - Update user role
router.patch('/users/:id/role', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      res.status(400).json({ message: 'Invalid role' });
      return;
    }

    const { data, error } = await getSupabase()
      .from('users')
      .update({ role })
      .eq('id', id)
      .select('id, name, email, role, created_at')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      throw error;
    }

    // Transform response
    const user = {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      createdAt: data.created_at,
    };

    res.json(user);
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Error updating user role' });
  }
});

export default router;
