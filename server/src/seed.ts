import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { connectDB, getSupabase } from './config/db';

dotenv.config();

const sampleProducts = [
  {
    name: 'Classic Logo T-Shirt',
    slug: 'classic-logo-tshirt',
    description: 'Premium cotton t-shirt with our iconic logo. Comfortable and stylish for everyday wear.',
    price: 29.99,
    category: 'T-Shirts',
    tags: ['casual', 'cotton', 'logo'],
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500',
    ],
    in_stock: true,
    stock_quantity: 100,
    rating: 4.5,
    is_featured: true,
    is_new: false,
  },
  {
    name: 'Premium Hoodie',
    slug: 'premium-hoodie',
    description: 'Cozy and warm hoodie perfect for chilly days. Made with premium fleece material.',
    price: 59.99,
    category: 'Hoodies',
    tags: ['warm', 'fleece', 'winter'],
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500',
    images: [
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500',
      'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=500',
    ],
    in_stock: true,
    stock_quantity: 75,
    rating: 4.8,
    is_featured: true,
    is_new: true,
  },
  {
    name: 'Canvas Tote Bag',
    slug: 'canvas-tote-bag',
    description: 'Eco-friendly canvas tote bag perfect for shopping or daily use. Durable and spacious.',
    price: 19.99,
    category: 'Bags',
    tags: ['eco-friendly', 'canvas', 'utility'],
    image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500',
    images: ['https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500'],
    in_stock: true,
    stock_quantity: 150,
    rating: 4.2,
    is_featured: false,
    is_new: false,
  },
  {
    name: 'Stainless Steel Water Bottle',
    slug: 'stainless-steel-water-bottle',
    description: 'Keep your drinks cold for 24 hours or hot for 12. BPA-free and leak-proof.',
    price: 24.99,
    category: 'Bottles',
    tags: ['stainless-steel', 'insulated', 'eco-friendly'],
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500',
    images: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500'],
    in_stock: true,
    stock_quantity: 200,
    rating: 4.7,
    is_featured: false,
    is_new: true,
  },
  {
    name: 'Baseball Cap',
    slug: 'baseball-cap',
    description: 'Classic baseball cap with adjustable strap. Perfect for sunny days.',
    price: 24.99,
    category: 'Caps',
    tags: ['cap', 'adjustable', 'sun-protection'],
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500',
    images: ['https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500'],
    in_stock: true,
    stock_quantity: 120,
    rating: 4.3,
    is_featured: false,
    is_new: false,
  },
  {
    name: 'Laptop Sleeve',
    slug: 'laptop-sleeve',
    description: 'Protective laptop sleeve with soft interior lining. Fits most 13-15 inch laptops.',
    price: 34.99,
    category: 'Accessories',
    tags: ['laptop', 'protective', 'tech'],
    image: 'https://images.unsplash.com/photo-1617043786394-f977fa12eddf?w=500',
    images: ['https://images.unsplash.com/photo-1617043786394-f977fa12eddf?w=500'],
    in_stock: true,
    stock_quantity: 80,
    rating: 4.6,
    is_featured: false,
    is_new: false,
  },
  {
    name: 'Performance Polo Shirt',
    slug: 'performance-polo-shirt',
    description: 'Breathable polo shirt perfect for both casual and semi-formal occasions.',
    price: 39.99,
    category: 'T-Shirts',
    tags: ['polo', 'breathable', 'versatile'],
    image: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=500',
    images: ['https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=500'],
    in_stock: true,
    stock_quantity: 90,
    rating: 4.4,
    is_featured: false,
    is_new: false,
  },
  {
    name: 'Zip-Up Jacket',
    slug: 'zip-up-jacket',
    description: 'Lightweight jacket perfect for layering. Features multiple pockets and water-resistant fabric.',
    price: 79.99,
    category: 'Hoodies',
    tags: ['jacket', 'water-resistant', 'pockets'],
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500',
    images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500'],
    in_stock: true,
    stock_quantity: 60,
    rating: 4.9,
    is_featured: true,
    is_new: true,
  },
];

const sampleBanners = [
  {
    title: 'New Collection',
    subtitle: 'Explore our latest arrivals for the season',
    cta_label: 'Shop Now',
    cta_link: '/merch',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200',
    active: true,
  },
  {
    title: 'Special Offer',
    subtitle: 'Get 20% off on all hoodies this week',
    cta_label: 'View Hoodies',
    cta_link: '/merch?category=Hoodies',
    image: 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=1200',
    active: true,
  },
];

const seed = async () => {
  try {
    console.log('🌱 Starting seed process...');
    
    await connectDB();
    const supabase = getSupabase();

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('banners').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Create admin user
    console.log('👤 Creating admin user...');
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .insert({
        name: 'Admin User',
        email: 'admin@hellobahrain.com',
        password_hash: adminPasswordHash,
        role: 'admin',
      })
      .select()
      .single();

    if (adminError) throw adminError;
    console.log(`✅ Admin user created: ${adminUser.email}`);

    // Create test user
    console.log('👤 Creating test user...');
    const userPasswordHash = await bcrypt.hash('user123', 10);
    const { data: testUser, error: userError } = await supabase
      .from('users')
      .insert({
        name: 'Test User',
        email: 'user@example.com',
        password_hash: userPasswordHash,
        role: 'user',
      })
      .select()
      .single();

    if (userError) throw userError;
    console.log(`✅ Test user created: ${testUser.email}`);

    // Create products
    console.log('📦 Creating products...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .insert(sampleProducts)
      .select();

    if (productsError) throw productsError;
    console.log(`✅ Created ${products?.length || 0} products`);

    // Create banners
    console.log('🎨 Creating banners...');
    const { data: banners, error: bannersError } = await supabase
      .from('banners')
      .insert(sampleBanners)
      .select();

    if (bannersError) throw bannersError;
    console.log(`✅ Created ${banners?.length || 0} banners`);

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📋 Login credentials:');
    console.log('Admin: admin@hellobahrain.com / admin123');
    console.log('User: user@example.com / user123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seed();
