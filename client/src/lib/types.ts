export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'free' | 'premium' | 'public';
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  image: string;
  images: string[];
  inStock: boolean;
  stockQuantity: number;
  rating: number;
  isFeatured: boolean;
  isNew: boolean;
  promotionalLabel?: string;
  promotionalLabelColor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Banner {
  // IDs can come back as either id or _id depending on route
  _id: string;
  id?: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaLink: string;
  image: string;
  active: boolean;
  // Optional styling + alignment (used by admin + homepage)
  textAlign?: 'left' | 'center' | 'right';
  textVertical?: 'top' | 'middle' | 'bottom';
  buttonAlign?: 'left' | 'center' | 'right';
  buttonVertical?: 'top' | 'middle' | 'bottom';
  displayOrder?: number;
  titleColor?: string;
  subtitleColor?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
  titleSize?: 'sm' | 'md' | 'lg';
  subtitleSize?: 'sm' | 'md' | 'lg';
  titleBold?: boolean;
  titleItalic?: boolean;
  subtitleBold?: boolean;
  subtitleItalic?: boolean;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  slug: string;
  // Track available stock when item was added to cart
  stockQuantity?: number;
}

export interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  country: string;
  postalCode: string;
  phone: string;
}

export interface Order {
  _id: string;
  // Some admin endpoints may return 'id' instead of '_id'
  id?: string;
  // User can be populated as a User object or a string ID; some responses may use 'users'
  user: string | User;
  users?: User | null;
  items: {
    product: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'unpaid' | 'paid';
  // Some API responses may use snake_case variants
  payment_status?: 'unpaid' | 'paid';
  shippingAddress: ShippingAddress;
  createdAt: string;
  updatedAt: string;
  created_at?: string;
}

