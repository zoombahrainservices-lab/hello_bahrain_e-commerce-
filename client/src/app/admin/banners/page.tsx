'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Banner } from '@/lib/types';
import BannerPreview from '@/components/BannerPreview';
import SingleImageUpload from '@/components/SingleImageUpload';

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    ctaLabel: '',
    ctaLink: '',
    image: '',
    active: true,
    displayOrder: 0,
    titleColor: '#FFFFFF',
    titleSize: 'lg' as 'sm' | 'md' | 'lg',
    titleBold: true,
    titleItalic: false,
    subtitleColor: '#FFFFFF',
    subtitleSize: 'md' as 'sm' | 'md' | 'lg',
    subtitleBold: false,
    subtitleItalic: false,
    buttonBgColor: '#C5A572',
    buttonTextColor: '#FFFFFF',
    textAlign: 'left' as 'left' | 'center' | 'right',
    textVertical: 'middle' as 'top' | 'middle' | 'bottom',
    buttonAlign: 'left' as 'left' | 'center' | 'right',
    buttonVertical: 'middle' as 'top' | 'middle' | 'bottom',
  });

  useEffect(() => {
    fetchBanners();
    fetchCategories();
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

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/categories');
      if (response.data && Array.isArray(response.data)) {
        setCategories(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingBanner) {
        console.log('=== BANNER UPDATE REQUEST ===');
        console.log('Banner ID:', editingBanner._id);
        console.log('Form Data:', JSON.stringify(formData, null, 2));
        console.log('Form Data Keys:', Object.keys(formData));
        console.log('============================');
        
        const response = await api.put(`/api/admin/banners/${editingBanner._id}`, formData);
        console.log('Banner updated successfully:', response.data);
      } else {
        console.log('Creating new banner:', formData);
        const response = await api.post('/api/admin/banners', formData);
        console.log('Banner created successfully:', response.data);
      }

      // Reset form
      setFormData({
        title: '',
        subtitle: '',
        ctaLabel: '',
        ctaLink: '',
        image: '',
        active: true,
        displayOrder: 0,
        titleColor: '#FFFFFF',
        titleSize: 'lg',
        titleBold: true,
        titleItalic: false,
        subtitleColor: '#FFFFFF',
        subtitleSize: 'md',
        subtitleBold: false,
        subtitleItalic: false,
        buttonBgColor: '#C5A572',
        buttonTextColor: '#FFFFFF',
        textAlign: 'left',
        textVertical: 'middle',
        buttonAlign: 'left',
        buttonVertical: 'middle',
      });
      setShowForm(false);
      setEditingBanner(null);
      await fetchBanners();
      alert(editingBanner ? 'Banner updated successfully!' : 'Banner created successfully!');
    } catch (error: any) {
      console.error('Error saving banner:', error);
      console.error('Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        stack: error?.stack,
      });
      
      let errorMessage = 'Failed to save banner';
      if (error?.response?.data) {
        const errorData = error.response.data;
        errorMessage = errorData.message || errorData.error || errorMessage;
        if (errorData.details) {
          errorMessage += `\nDetails: ${errorData.details}`;
        }
        if (errorData.hint) {
          errorMessage += `\nHint: ${errorData.hint}`;
        }
        if (errorData.code) {
          errorMessage += `\nCode: ${errorData.code}`;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      console.error('Full error response:', error?.response?.data);
      alert(`Error: ${errorMessage}\n\nCheck console for full details.`);
    }
  };

  const handleEdit = (banner: Banner) => {
    console.log('Editing banner:', banner);
    setEditingBanner(banner);
    setFormData({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      ctaLabel: banner.ctaLabel || '',
      ctaLink: banner.ctaLink || '',
      image: banner.image || '',
      active: banner.active !== undefined ? banner.active : true,
      displayOrder: banner.displayOrder || 0,
      titleColor: banner.titleColor || '#FFFFFF',
      titleSize: (banner.titleSize || 'lg') as 'sm' | 'md' | 'lg',
      titleBold: banner.titleBold !== undefined ? banner.titleBold : true,
      titleItalic: banner.titleItalic || false,
      subtitleColor: banner.subtitleColor || '#FFFFFF',
      subtitleSize: (banner.subtitleSize || 'md') as 'sm' | 'md' | 'lg',
      subtitleBold: banner.subtitleBold || false,
      subtitleItalic: banner.subtitleItalic || false,
      buttonBgColor: banner.buttonBgColor || '#C5A572',
      buttonTextColor: banner.buttonTextColor || '#FFFFFF',
      textAlign: (banner.textAlign || 'left') as 'left' | 'center' | 'right',
      textVertical: (banner.textVertical || 'middle') as 'top' | 'middle' | 'bottom',
      buttonAlign: (banner.buttonAlign || 'left') as 'left' | 'center' | 'right',
      buttonVertical: (banner.buttonVertical || 'middle') as 'top' | 'middle' | 'bottom',
    });
    setShowForm(true);
    // Scroll to form after a brief delay to ensure it's rendered
    setTimeout(() => {
      const formElement = document.querySelector('[data-banner-form]');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
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
      // When toggling active, preserve all alignment data
      await api.put(`/api/admin/banners/${banner._id}`, {
        title: banner.title,
        subtitle: banner.subtitle,
        ctaLabel: banner.ctaLabel,
        ctaLink: banner.ctaLink,
        image: banner.image,
        active: !banner.active,
        displayOrder: banner.displayOrder || 0,
        titleColor: banner.titleColor || '#FFFFFF',
        titleSize: banner.titleSize || 'lg',
        titleBold: banner.titleBold !== undefined ? banner.titleBold : true,
        titleItalic: banner.titleItalic || false,
        subtitleColor: banner.subtitleColor || '#FFFFFF',
        subtitleSize: banner.subtitleSize || 'md',
        subtitleBold: banner.subtitleBold || false,
        subtitleItalic: banner.subtitleItalic || false,
        buttonBgColor: banner.buttonBgColor || '#C5A572',
        buttonTextColor: banner.buttonTextColor || '#FFFFFF',
        textAlign: banner.textAlign || 'left',
        textVertical: banner.textVertical || 'middle',
        buttonAlign: banner.buttonAlign || 'left',
        buttonVertical: banner.buttonVertical || 'middle',
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

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
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Banners</h1>
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
              displayOrder: 0,
              titleColor: '#FFFFFF',
              titleSize: 'lg',
              titleBold: true,
              titleItalic: false,
              subtitleColor: '#FFFFFF',
              subtitleSize: 'md',
              subtitleBold: false,
              subtitleItalic: false,
              buttonBgColor: '#C5A572',
              buttonTextColor: '#FFFFFF',
              textAlign: 'left',
              textVertical: 'middle',
              buttonAlign: 'left',
              buttonVertical: 'middle',
            });
          }}
          className="w-full sm:w-auto bg-primary-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-primary-700 transition text-sm sm:text-base"
        >
          {showForm ? 'Cancel' : 'Add Banner'}
        </button>
      </div>

      {showForm && (
        <div data-banner-form className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8 overflow-x-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Form Section */}
            <div>
              <h2 className="text-xl font-bold mb-4">
                {editingBanner ? 'Edit Banner' : 'Add New Banner'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title Section */}
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Title Color</label>
                      <input
                        type="color"
                        name="titleColor"
                        value={formData.titleColor}
                        onChange={handleChange}
                        className="w-16 h-8 p-1 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Title Size</label>
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

                {/* Subtitle Section */}
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Subtitle Color</label>
                      <input
                        type="color"
                        name="subtitleColor"
                        value={formData.subtitleColor}
                        onChange={handleChange}
                        className="w-16 h-8 p-1 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Subtitle Size</label>
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

                  {/* Text alignment */}
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

                {/* CTA Section */}
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
                  {/* Button color styling */}
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

                  {/* Button alignment */}
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

                {/* CTA Link */}
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
                        {categories.map((cat) => (
                          <option key={cat.id} value={`/?category=${encodeURIComponent(cat.name)}`}>
                            {cat.name}
                          </option>
                        ))}
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

                {/* Image Upload */}
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

                {/* Display Order & Active */}
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

      {/* Banners List */}
      <div className="space-y-4">
        {banners.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500">No banners found. Create your first banner!</p>
          </div>
        ) : (
          banners.map((banner) => (
            <div key={banner._id} className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1 w-full sm:w-auto min-w-0">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                    <h3 className="text-lg sm:text-xl font-bold break-words">{banner.title}</h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        banner.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {banner.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2 break-words">{banner.subtitle}</p>
                  <p className="text-sm text-gray-500 break-words">
                    CTA: {banner.ctaLabel} → {banner.ctaLink}
                  </p>
                  <p className="text-sm text-gray-400 mt-2 truncate">Image: {banner.image}</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto sm:ml-4">
                  <button
                    onClick={() => handleToggleActive(banner)}
                    className="flex-1 sm:flex-none text-red-600 hover:text-red-800 px-3 py-2 sm:py-1 rounded-lg hover:bg-red-50 transition text-sm"
                  >
                    {banner.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleEdit(banner)}
                    className="flex-1 sm:flex-none text-green-600 hover:text-green-800 px-3 py-2 sm:py-1 rounded-lg hover:bg-green-50 transition text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(banner._id)}
                    className="flex-1 sm:flex-none text-red-600 hover:text-red-800 px-3 py-2 sm:py-1 rounded-lg hover:bg-red-50 transition text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
