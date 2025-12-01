import dotenv from 'dotenv';
import { connectDB, getSupabase } from './config/db';

dotenv.config();

const randomProducts = [
  {
    name: 'Vintage Denim Jacket',
    slug: 'vintage-denim-jacket',
    description: 'Classic vintage-style denim jacket with a relaxed fit. Perfect for layering and casual wear.',
    price: 89.99,
    category: 'Hoodies',
    tags: ['denim', 'vintage', 'casual', 'jacket'],
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500',
    images: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500',
      'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=500',
    ],
    in_stock: true,
    stock_quantity: 45,
    rating: 4.6,
    is_featured: true,
    is_new: false,
  },
  {
    name: 'Cotton Crew Neck Sweatshirt',
    slug: 'cotton-crew-neck-sweatshirt',
    description: 'Soft and comfortable crew neck sweatshirt made from premium cotton blend. Perfect for everyday comfort.',
    price: 49.99,
    category: 'Hoodies',
    tags: ['cotton', 'comfortable', 'casual', 'sweatshirt'],
    image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500',
    images: ['https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500'],
    in_stock: true,
    stock_quantity: 120,
    rating: 4.4,
    is_featured: false,
    is_new: true,
  },
  {
    name: 'Leather Crossbody Bag',
    slug: 'leather-crossbody-bag',
    description: 'Elegant leather crossbody bag with adjustable strap. Perfect for daily essentials and stylish on-the-go access.',
    price: 79.99,
    category: 'Bags',
    tags: ['leather', 'crossbody', 'elegant', 'fashion'],
    image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500',
    images: ['https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500'],
    in_stock: true,
    stock_quantity: 65,
    rating: 4.7,
    is_featured: true,
    is_new: false,
  },
  {
    name: 'Graphic Print T-Shirt',
    slug: 'graphic-print-tshirt',
    description: 'Bold graphic print t-shirt with unique design. Made from soft cotton for maximum comfort.',
    price: 34.99,
    category: 'T-Shirts',
    tags: ['graphic', 'print', 'cotton', 'casual'],
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500',
    ],
    in_stock: true,
    stock_quantity: 200,
    rating: 4.3,
    is_featured: false,
    is_new: true,
  },
  {
    name: 'Insulated Travel Mug',
    slug: 'insulated-travel-mug',
    description: 'Double-wall insulated travel mug keeps drinks hot or cold for hours. Leak-proof lid and ergonomic design.',
    price: 29.99,
    category: 'Bottles',
    tags: ['insulated', 'travel', 'mug', 'hot-cold'],
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500',
    images: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500'],
    in_stock: true,
    stock_quantity: 180,
    rating: 4.8,
    is_featured: false,
    is_new: false,
  },
  {
    name: 'Snapback Cap',
    slug: 'snapback-cap',
    description: 'Classic snapback cap with adjustable strap. One-size-fits-all design with premium materials.',
    price: 27.99,
    category: 'Caps',
    tags: ['snapback', 'adjustable', 'classic', 'cap'],
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500',
    images: ['https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500'],
    in_stock: true,
    stock_quantity: 150,
    rating: 4.5,
    is_featured: false,
    is_new: false,
  },
  {
    name: 'Wireless Earbuds Case',
    slug: 'wireless-earbuds-case',
    description: 'Protective case for wireless earbuds with charging port access. Compact and durable design.',
    price: 19.99,
    category: 'Accessories',
    tags: ['earbuds', 'case', 'protective', 'tech'],
    image: 'https://images.unsplash.com/photo-1617043786394-f977fa12eddf?w=500',
    images: ['https://images.unsplash.com/photo-1617043786394-f977fa12eddf?w=500'],
    in_stock: true,
    stock_quantity: 95,
    rating: 4.2,
    is_featured: false,
    is_new: true,
  },
  {
    name: 'Long Sleeve Henley',
    slug: 'long-sleeve-henley',
    description: 'Comfortable long sleeve henley shirt with button placket. Perfect for layering or wearing alone.',
    price: 44.99,
    category: 'T-Shirts',
    tags: ['henley', 'long-sleeve', 'comfortable', 'casual'],
    image: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=500',
    images: ['https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=500'],
    in_stock: true,
    stock_quantity: 110,
    rating: 4.6,
    is_featured: false,
    is_new: false,
  },
  {
    name: 'Fleece Pullover',
    slug: 'fleece-pullover',
    description: 'Warm and cozy fleece pullover perfect for cool weather. Soft interior and durable exterior.',
    price: 64.99,
    category: 'Hoodies',
    tags: ['fleece', 'warm', 'pullover', 'cozy'],
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500',
    images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500'],
    in_stock: true,
    stock_quantity: 85,
    rating: 4.7,
    is_featured: true,
    is_new: true,
  },
  {
    name: 'Backpack with Laptop Compartment',
    slug: 'backpack-laptop-compartment',
    description: 'Spacious backpack with dedicated laptop compartment. Multiple pockets and padded straps for comfort.',
    price: 69.99,
    category: 'Bags',
    tags: ['backpack', 'laptop', 'spacious', 'comfortable'],
    image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500',
    images: ['https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500'],
    in_stock: true,
    stock_quantity: 70,
    rating: 4.9,
    is_featured: true,
    is_new: false,
  },
  {
    name: 'Stainless Steel Tumbler',
    slug: 'stainless-steel-tumbler',
    description: 'Premium stainless steel tumbler with double-wall insulation. Keeps beverages at perfect temperature.',
    price: 32.99,
    category: 'Bottles',
    tags: ['stainless-steel', 'tumbler', 'insulated', 'premium'],
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500',
    images: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500'],
    in_stock: true,
    stock_quantity: 140,
    rating: 4.6,
    is_featured: false,
    is_new: true,
  },
  {
    name: 'Beanie with Logo',
    slug: 'beanie-with-logo',
    description: 'Warm and stylish beanie with embroidered logo. Soft acrylic blend for comfort and warmth.',
    price: 22.99,
    category: 'Caps',
    tags: ['beanie', 'warm', 'logo', 'winter'],
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500',
    images: ['https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500'],
    in_stock: true,
    stock_quantity: 160,
    rating: 4.4,
    is_featured: false,
    is_new: false,
  },
  {
    name: 'Phone Stand and Charger',
    slug: 'phone-stand-charger',
    description: 'Multi-functional phone stand with wireless charging capability. Adjustable viewing angle.',
    price: 39.99,
    category: 'Accessories',
    tags: ['phone', 'stand', 'charger', 'wireless'],
    image: 'https://images.unsplash.com/photo-1617043786394-f977fa12eddf?w=500',
    images: ['https://images.unsplash.com/photo-1617043786394-f977fa12eddf?w=500'],
    in_stock: true,
    stock_quantity: 55,
    rating: 4.5,
    is_featured: false,
    is_new: true,
  },
];

async function addProducts() {
  try {
    console.log('🛍️  Adding random products to database...\n');

    await connectDB();
    const supabase = getSupabase();

    // Insert products
    const { data: products, error } = await supabase
      .from('products')
      .insert(randomProducts)
      .select();

    if (error) {
      // Check if error is due to duplicate slugs
      if (error.code === '23505') {
        console.log('⚠️  Some products already exist (duplicate slugs).');
        console.log('ℹ️  Trying to add products one by one...\n');
        
        let added = 0;
        let skipped = 0;
        
        for (const product of randomProducts) {
          try {
            const { data, error: insertError } = await supabase
              .from('products')
              .insert(product)
              .select()
              .single();
            
            if (insertError) {
              if (insertError.code === '23505') {
                console.log(`⏭️  Skipped: ${product.name} (already exists)`);
                skipped++;
              } else {
                console.log(`❌ Error adding ${product.name}: ${insertError.message}`);
              }
            } else {
              console.log(`✅ Added: ${product.name}`);
              added++;
            }
          } catch (err: any) {
            console.log(`⚠️  Error with ${product.name}: ${err.message}`);
          }
        }
        
        console.log(`\n📊 Summary:`);
        console.log(`✅ Added: ${added} products`);
        console.log(`⏭️  Skipped: ${skipped} products (already exist)`);
      } else {
        throw error;
      }
    } else {
      console.log(`✅ Successfully added ${products?.length || 0} products!\n`);
      
      products?.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} - $${product.price}`);
      });
    }

    console.log('\n🎉 Products addition completed!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error adding products:', error.message);
    process.exit(1);
  }
}

addProducts();




