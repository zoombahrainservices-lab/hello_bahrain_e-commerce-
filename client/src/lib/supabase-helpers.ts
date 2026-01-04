import { getSupabase } from './db';

// Helper functions for common Supabase operations

export const supabaseHelpers = {
  // User helpers
  async findUserByEmail(email: string) {
    const { data, error } = await getSupabase()
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async findUserByPhone(phone: string) {
    const { data, error } = await getSupabase()
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async findUserByGoogleId(googleId: string) {
    const { data, error } = await getSupabase()
      .from('users')
      .select('*')
      .eq('google_id', googleId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async findUserById(id: string) {
    const { data, error } = await getSupabase()
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async createUser(userData: any) {
    const { data, error } = await getSupabase()
      .from('users')
      .insert(userData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateUser(id: string, updates: any) {
    const { data, error } = await getSupabase()
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Product helpers
  async findProductBySlug(slug: string) {
    const { data, error } = await getSupabase()
      .from('products')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async findProductById(id: string) {
    const { data, error } = await getSupabase()
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async searchProducts(query: any) {
    let supabaseQuery = getSupabase().from('products').select('*', { count: 'exact' });

    // Text search - using ilike for case-insensitive search
    if (query.search) {
      const searchTerm = `%${query.search}%`;
      supabaseQuery = supabaseQuery.or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`);
    }

    // Category filter
    if (query.category) {
      supabaseQuery = supabaseQuery.eq('category', query.category);
    }

    // Sorting
    if (query.sort) {
      switch (query.sort) {
        case 'price_asc':
          supabaseQuery = supabaseQuery.order('price', { ascending: true });
          break;
        case 'price_desc':
          supabaseQuery = supabaseQuery.order('price', { ascending: false });
          break;
        case 'rating':
          supabaseQuery = supabaseQuery.order('rating', { ascending: false });
          break;
        case 'newest':
        default:
          supabaseQuery = supabaseQuery.order('created_at', { ascending: false });
          break;
      }
    } else {
      supabaseQuery = supabaseQuery.order('created_at', { ascending: false });
    }

    // Pagination
    const page = query.page || 1;
    const limit = query.limit || 12;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    supabaseQuery = supabaseQuery.range(from, to);

    const { data, error, count } = await supabaseQuery;
    
    if (error) throw error;
    return { data: data || [], count: count || 0 };
  },
};


