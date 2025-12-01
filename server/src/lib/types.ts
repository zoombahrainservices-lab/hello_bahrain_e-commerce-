// Database types matching our Supabase schema

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string | null;
  google_id: string | null;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  image: string;
  images: string[];
  in_stock: boolean;
  stock_quantity: number;
  rating: number;
  is_featured: boolean;
  is_new: boolean;
  created_at: string;
  updated_at: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  cta_label: string;
  cta_link: string;
  image: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'unpaid' | 'paid';
  shipping_address: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    country: string;
    postalCode: string;
    phone: string;
  };
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  created_at: string;
}

