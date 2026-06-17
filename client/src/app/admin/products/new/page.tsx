'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import ProductMediaSection from '@/components/admin/products/ProductMediaSection';

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  // Once the product row is created, this holds its ID
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    category: '',
    tags: '',
    inStock: true,
    stockQuantity: '',
    rating: '0',
    isFeatured: false,
    isNew: false,
  });

  useEffect(() => {
    setAuthToken(localStorage.getItem('token'));
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await api.get('/api/categories');
      if (response.data && Array.isArray(response.data)) {
        setCategories(response.data);
        if (response.data.length > 0) {
          setFormData((prev) => ({ ...prev, category: response.data[0].name }));
        }
      }
    } catch {
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setFormData({ ...formData, [name]: value });
      if (name === 'name') {
        const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        setFormData((prev) => ({ ...prev, slug }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stockQuantity: parseInt(formData.stockQuantity) || 0,
        rating: parseFloat(formData.rating) || 0,
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
      };

      const res = await api.post('/api/admin/products', productData);
      const newId = res.data?.id ?? res.data?._id;
      if (!newId) throw new Error('Product created but ID missing in response.');

      // Keep the form visible — just unlock the image section below
      setCreatedProductId(newId);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  const productCreated = !!createdProductId;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Add New Product</h1>

      <div className="bg-white rounded-lg shadow-md p-6 max-w-3xl space-y-6">
        {/* ── Step 1: product details ────────────────────────── */}
        <div>
          {/* Step header */}
          <div className="flex items-center gap-3 mb-4">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
              productCreated ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'
            }`}>
              {productCreated ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : '1'}
            </span>
            <h2 className="text-base font-semibold text-gray-700">Product Details</h2>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <fieldset disabled={productCreated} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                name="name"
                required={!productCreated}
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
              <input
                type="text"
                name="slug"
                required={!productCreated}
                value={formData.slug}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                name="description"
                required={!productCreated}
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                <input
                  type="number"
                  name="price"
                  required={!productCreated}
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  disabled={categoriesLoading || productCreated}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                >
                  {categoriesLoading ? (
                    <option>Loading categories...</option>
                  ) : categories.length === 0 ? (
                    <option>No categories available</option>
                  ) : (
                    categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="e.g., cotton, casual, summer"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity *</label>
                <input
                  type="number"
                  name="stockQuantity"
                  required={!productCreated}
                  min="0"
                  value={formData.stockQuantity}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating (0-5)</label>
                <input
                  type="number"
                  name="rating"
                  step="0.1"
                  min="0"
                  max="5"
                  value={formData.rating}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              {(['inStock', 'isFeatured', 'isNew'] as const).map((key) => (
                <label key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    name={key}
                    checked={formData[key] as boolean}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {key === 'inStock' ? 'In Stock' : key === 'isFeatured' ? 'Featured' : 'New Arrival'}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {!productCreated && (
            <div className="flex space-x-4 mt-4">
              <button
                type="button"
                onClick={handleSubmit as any}
                disabled={loading}
                className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Product'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* ── Step 2: product images (unlocks after product is created) ── */}
        <div className={`border-t border-gray-100 pt-6 transition-opacity ${productCreated ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <div className="flex items-center gap-3 mb-4">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
              productCreated ? 'bg-blue-600 text-white' : 'bg-gray-300 text-white'
            }`}>2</span>
            <h2 className="text-base font-semibold text-gray-700">
              Product Images
              {!productCreated && <span className="ml-2 text-xs font-normal text-gray-400">(complete step 1 first)</span>}
            </h2>
          </div>

          {productCreated && (
            <ProductMediaSection productId={createdProductId!} authToken={authToken} />
          )}
        </div>

        {/* ── Done button (visible only after product created) ── */}
        {productCreated && (
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => router.push('/admin/products')}
              className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition"
            >
              Done — Go to Products
            </button>
            <button
              type="button"
              onClick={() => router.push(`/admin/products/${createdProductId}`)}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
            >
              Edit Product
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
