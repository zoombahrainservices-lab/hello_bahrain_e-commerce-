'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Banner } from '@/lib/types';
import SingleImageUpload from '@/components/SingleImageUpload';
import BannerPreview from '@/components/BannerPreview';

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    ctaLabel: '',
    ctaLink: '',
    image: '',
    active: true,
    textAlign: 'left' as 'left' | 'center' | 'right',
    textVertical: 'middle' as 'top' | 'middle' | 'bottom',
    buttonAlign: 'left' as 'left' | 'center' | 'right',
    buttonVertical: 'middle' as 'top' | 'middle' | 'bottom',
    displayOrder: 0,
    titleColor: '#ffffff',
    subtitleColor: '#e5e7eb',
    buttonBgColor: '#ffffff',
    buttonTextColor: '#111827',
    titleSize: 'lg' as 'sm' | 'md' | 'lg',
    subtitleSize: 'md' as 'sm' | 'md' | 'lg',
    titleBold: true,
    titleItalic: false,
    subtitleBold: false,
    subtitleItalic: false,
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const response = await api.get('/api/admin/banners');
      setBanners(response.data);
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      console.log('📤 Submitting banner with formData:', formData);
      console.log('🎯 Alignment values being submitted:', {
        textAlign: formData.textAlign,
        textVertical: formData.textVertical,
        buttonAlign: formData.buttonAlign,
        buttonVertical: formData.buttonVertical,
      });
      
      if (editingBanner) {
        const response = await api.put(`/api/admin/banners/${editingBanner._id}`, formData);
        console.log('✅ Banner update response:', response.data);
        console.log('🎯 Response alignment values:', {
          textAlign: response.data.textAlign,
          textVertical: response.data.textVertical,
          buttonAlign: response.data.buttonAlign,
          buttonVertical: response.data.buttonVertical,
        });
      } else {
        const response = await api.post('/api/admin/banners', formData);
        console.log('✅ Banner create response:', response.data);
      }

      // Reset form
      setFormData({
        title: '',
        subtitle: '',
        ctaLabel: '',
        ctaLink: '',
        image: '',
        active: true,
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
      });
      setShowForm(false);
      setEditingBanner(null);
      // Refresh banners to show updated orders
      await fetchBanners();
      alert(editingBanner ? 'Banner updated successfully!' : 'Banner created successfully!');
    } catch (error: any) {
      console.error('Error saving banner:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save banner';
      alert(`Failed to save banner: ${errorMessage}`);
    }
  };

  const handleEdit = (banner: Banner) => {
    console.log('✏️ Editing banner:', banner);
    console.log('🎯 Banner alignment from database:', {
      textAlign: banner.textAlign,
      textVertical: banner.textVertical,
      buttonAlign: banner.buttonAlign,
      buttonVertical: banner.buttonVertical,
    });
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle,
      ctaLabel: banner.ctaLabel,
      ctaLink: banner.ctaLink,
      image: banner.image,
      active: banner.active,
      textAlign: banner.textAlign || 'left',
      textVertical: banner.textVertical || 'middle',
      buttonAlign: banner.buttonAlign || 'left',
      buttonVertical: banner.buttonVertical || 'middle',
      displayOrder: banner.displayOrder || 0,
      titleColor: banner.titleColor || '#ffffff',
      subtitleColor: banner.subtitleColor || '#e5e7eb',
      buttonBgColor: banner.buttonBgColor || '#ffffff',
      buttonTextColor: banner.buttonTextColor || '#111827',
      titleSize: banner.titleSize || 'lg',
      subtitleSize: banner.subtitleSize || 'md',
      titleBold: banner.titleBold ?? true,
      titleItalic: banner.titleItalic ?? false,
      subtitleBold: banner.subtitleBold ?? false,
      subtitleItalic: banner.subtitleItalic ?? false,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) {
      return;
    }

    try {
      await api.delete(`/api/admin/banners/${id}`);
      setBanners(banners.filter((b) => b._id !== id));
    } catch (error) {
      console.error('Error deleting banner:', error);
      alert('Failed to delete banner');
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      await api.put(`/api/admin/banners/${banner._id}`, {
        ...banner,
        active: !banner.active,
      });
      setBanners(
        banners.map((b) =>
          b._id === banner._id ? { ...b, active: !b.active } : b
        )
      );
    } catch (error) {
      console.error('Error toggling banner:', error);
      alert('Failed to update banner');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    console.log('🔄 Form field changed:', { name, value, type });

    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Banners</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingBanner(null);
            setFormData({
              title: '',
              subtitle: '',
              ctaLabel: '',
              ctaLink: '',
              image: '',
              active: true,
              textAlign: 'left',
              textVertical: 'middle',
              buttonAlign: 'left',
              buttonVertical: 'middle',
              displayOrder: 0,
            });
          }}
          className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition"
        >
          {showForm ? 'Cancel' : 'Add Banner'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Section */}
            <div>
              <h2 className="text-xl font-bold mb-4">
                {editingBanner ? 'Edit Banner' : 'Add New Banner'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {/* Title styling directly below input */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Title Color
                  </label>
                  <input
                    type="color"
                    name="titleColor"
                    value={formData.titleColor}
                    onChange={handleChange}
                    className="w-16 h-8 p-1 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Title Size
                  </label>
                  <select
                    name="titleSize"
                    value={formData.titleSize}
                    onChange={handleChange}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="sm">Small</option>
                    <option value="md">Medium</option>
                    <option value="lg">Large</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center text-xs font-medium text-gray-600">
                  <input
                    type="checkbox"
                    name="titleBold"
                    checked={formData.titleBold}
                    onChange={handleChange}
                    className="mr-1"
                  />
                  Bold
                </label>
                <label className="flex items-center text-xs font-medium text-gray-600">
                  <input
                    type="checkbox"
                    name="titleItalic"
                    checked={formData.titleItalic}
                    onChange={handleChange}
                    className="mr-1"
                  />
                  Italic
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle *</label>
              <textarea
                name="subtitle"
                required
                rows={2}
                value={formData.subtitle}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {/* Subtitle styling directly below input */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Subtitle Color
                  </label>
                  <input
                    type="color"
                    name="subtitleColor"
                    value={formData.subtitleColor}
                    onChange={handleChange}
                    className="w-16 h-8 p-1 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Subtitle Size
                  </label>
                  <select
                    name="subtitleSize"
                    value={formData.subtitleSize}
                    onChange={handleChange}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="sm">Small</option>
                    <option value="md">Medium</option>
                    <option value="lg">Large</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center text-xs font-medium text-gray-600">
                  <input
                    type="checkbox"
                    name="subtitleBold"
                    checked={formData.subtitleBold}
                    onChange={handleChange}
                    className="mr-1"
                  />
                  Bold
                </label>
                <label className="flex items-center text-xs font-medium text-gray-600">
                  <input
                    type="checkbox"
                    name="subtitleItalic"
                    checked={formData.subtitleItalic}
                    onChange={handleChange}
                    className="mr-1"
                  />
                  Italic
                </label>
              </div>

              {/* Text alignment directly below subtitle */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Text Horizontal Align
                  </label>
                  <select
                    name="textAlign"
                    value={formData.textAlign}
                    onChange={handleChange}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Text Vertical Position
                  </label>
                  <select
                    name="textVertical"
                    value={formData.textVertical}
                    onChange={handleChange}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="top">Top</option>
                    <option value="middle">Middle</option>
                    <option value="bottom">Bottom</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CTA Label *
              </label>
              <input
                type="text"
                name="ctaLabel"
                required
                value={formData.ctaLabel}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {/* Button color styling directly below CTA label */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Button Background Color
                  </label>
                  <input
                    type="color"
                    name="buttonBgColor"
                    value={formData.buttonBgColor}
                    onChange={handleChange}
                    className="w-16 h-8 p-1 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Button Text Color
                  </label>
                  <input
                    type="color"
                    name="buttonTextColor"
                    value={formData.buttonTextColor}
                    onChange={handleChange}
                    className="w-16 h-8 p-1 border border-gray-300 rounded"
                  />
                </div>
              </div>

              {/* Button alignment directly below button styling */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Button Horizontal Align
                  </label>
                  <select
                    name="buttonAlign"
                    value={formData.buttonAlign}
                    onChange={handleChange}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Button Vertical Position
                  </label>
                  <select
                    name="buttonVertical"
                    value={formData.buttonVertical}
                    onChange={handleChange}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="top">Top</option>
                    <option value="middle">Middle</option>
                    <option value="bottom">Bottom</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CTA Link *
              </label>
              <div className="space-y-2">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      setFormData({ ...formData, ctaLink: e.target.value });
                    }
                  }}
                  value=""
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select a category...</option>
                  <optgroup label="Categories">
                    <option value="/?category=All">All Products</option>
                    <option value="/?category=T-Shirts">T-Shirts</option>
                    <option value="/?category=Hoodies">Hoodies</option>
                    <option value="/?category=Bags">Bags</option>
                    <option value="/?category=Bottles">Bottles</option>
                    <option value="/?category=Caps">Caps</option>
                    <option value="/?category=Accessories">Accessories</option>
                    <option value="/?category=Souvenirs">Souvenirs</option>
                    <option value="/?category=Luxury Items">Luxury Items</option>
                  </optgroup>
                  <optgroup label="Other Pages">
                    <option value="/">Home</option>
                    <option value="/cart">Cart</option>
                  </optgroup>
                </select>
                <input
                  type="text"
                  name="ctaLink"
                  required
                  placeholder="Or enter custom URL (e.g., /product/slug, https://example.com)"
                  value={formData.ctaLink}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500">
                  Select a category from dropdown above, or enter a custom URL in the input field
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Banner Image *
              </label>
              <SingleImageUpload
                image={formData.image}
                onChange={(image) => setFormData({ ...formData, image })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  name="displayOrder"
                  min="0"
                  value={formData.displayOrder}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      displayOrder: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lower numbers appear first (0, 1, 2...)
                </p>
              </div>
              <div className="flex items-end">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="active"
                    checked={formData.active}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
              </div>
            </div>


                <button
                  type="submit"
                  className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition"
                >
                  {editingBanner ? 'Update Banner' : 'Create Banner'}
                </button>
              </form>
            </div>

            {/* Live Preview Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Live Preview</h3>
              <BannerPreview banner={formData} />
              <div className="mt-4 p-3 bg-gray-50 rounded text-xs space-y-1">
                <p className="font-semibold mb-2">🎯 Current Alignment Settings:</p>
                <p><strong>Text Horizontal:</strong> {formData.textAlign}</p>
                <p><strong>Text Vertical:</strong> {formData.textVertical}</p>
                <p><strong>Button Horizontal:</strong> {formData.buttonAlign}</p>
                <p><strong>Button Vertical:</strong> {formData.buttonVertical}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {banners.map((banner) => (
          <div key={banner._id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold">{banner.title}</h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      banner.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {banner.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-gray-600 mb-2">{banner.subtitle}</p>
                <p className="text-sm text-gray-500">
                  CTA: {banner.ctaLabel} → {banner.ctaLink}
                </p>
                <p className="text-sm text-gray-400 mt-2 truncate">Image: {banner.image}</p>
              </div>
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => handleToggleActive(banner)}
                  className="text-blue-600 hover:text-blue-800 px-3 py-1"
                >
                  {banner.active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleEdit(banner)}
                  className="text-green-600 hover:text-green-800 px-3 py-1"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(banner._id)}
                  className="text-red-600 hover:text-red-800 px-3 py-1"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}



