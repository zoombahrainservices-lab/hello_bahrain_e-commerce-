'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import Link from 'next/link';

interface Address {
  id: string;
  label: string;
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  country: string;
  postalCode: string;
  phone: string;
  isDefault: boolean;
}

export default function ProfilePage() {
  const { user, loading: authLoading, fetchMe } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'profile' | 'addresses'>('profile');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [editingProfile, setEditingProfile] = useState(false);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    country: 'Bahrain',
    postalCode: '',
    phone: '',
    isDefault: false,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/profile');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchAddresses();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/profile');
      setProfileData({
        name: response.data.name || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await api.get('/api/profile/addresses');
      setAddresses(response.data || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      await api.put('/api/profile', profileData);
      setSuccess('Profile updated successfully!');
      await fetchMe(); // Refresh user data in context
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      if (editingAddress) {
        await api.put(`/api/profile/addresses/${editingAddress.id}`, addressForm);
        setSuccess('Address updated successfully!');
      } else {
        await api.post('/api/profile/addresses', addressForm);
        setSuccess('Address added successfully!');
      }
      await fetchAddresses();
      setShowAddressForm(false);
      setEditingAddress(null);
      resetAddressForm();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      await api.delete(`/api/profile/addresses/${id}`);
      setSuccess('Address deleted successfully!');
      await fetchAddresses();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete address');
    }
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setAddressForm({
      label: address.label,
      fullName: address.fullName,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      country: address.country,
      postalCode: address.postalCode,
      phone: address.phone,
      isDefault: address.isDefault,
    });
    setShowAddressForm(true);
  };

  const resetAddressForm = () => {
    setAddressForm({
      label: 'Home',
      fullName: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      country: 'Bahrain',
      postalCode: '',
      phone: '',
      isDefault: false,
    });
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab('addresses')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'addresses'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Saved Addresses
          </button>
        </nav>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold">Profile Details</h2>
              <p className="text-sm text-gray-500">
                View your name, email and mobile number. Click edit to make changes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditingProfile((prev) => !prev)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
            >
              {editingProfile ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                required
                disabled={!editingProfile}
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  editingProfile ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                required
                disabled={!editingProfile}
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  editingProfile ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                disabled={!editingProfile}
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                placeholder="+973 1234 5678"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  editingProfile ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                }`}
              />
            </div>

            <div className="flex space-x-4">
              {editingProfile && (
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              )}
              <Link
                href="/profile/orders"
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                View Orders
              </Link>
            </div>

            <div className="mt-8 border-t pt-4">
              <h3 className="text-lg font-semibold mb-2">Privacy &amp; Data</h3>
              <div className="space-y-1 text-sm text-gray-700">
                <p>
                  <Link href="/privacy-policy" className="text-primary-600 hover:text-primary-700 underline">
                    Privacy Policy
                  </Link>
                </p>
                <p>
                  Data deletion request:{' '}
                  <a
                    href="mailto:support@zoombahrain.co?subject=Data%20Deletion%20Request"
                    className="text-primary-600 hover:text-primary-700 underline"
                  >
                    contact support
                  </a>
                </p>
                <p>
                  Email preferences:{' '}
                  <a
                    href="mailto:support@zoombahrain.co?subject=Email%20Preferences"
                    className="text-primary-600 hover:text-primary-700 underline"
                  >
                    unsubscribe / manage notifications
                  </a>
                </p>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Addresses Tab */}
      {activeTab === 'addresses' && (
        <div className="space-y-6">
          {/* Address List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Saved Addresses</h2>
              <button
                onClick={() => {
                  resetAddressForm();
                  setEditingAddress(null);
                  setShowAddressForm(true);
                }}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
              >
                + Add New Address
              </button>
            </div>

            {addresses.length === 0 && !showAddressForm ? (
              <p className="text-gray-500">No saved addresses. Add one to get started!</p>
            ) : (
              <div className="space-y-4">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold">{address.label}</span>
                          {address.isDefault && (
                            <span className="bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700">
                          {address.fullName}
                          <br />
                          {address.addressLine1}
                          {address.addressLine2 && <>, {address.addressLine2}</>}
                          <br />
                          {address.city}, {address.postalCode}
                          <br />
                          {address.country}
                          <br />
                          Phone: {address.phone}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditAddress(address)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(address.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Address Form */}
          {showAddressForm && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h2>
              <form onSubmit={handleAddressSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Label *</label>
                  <select
                    required
                    value={addressForm.label}
                    onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.addressLine1}
                    onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                  <input
                    type="text"
                    value={addressForm.addressLine2}
                    onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code *</label>
                    <input
                      type="text"
                      required
                      value={addressForm.postalCode}
                      onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                    <input
                      type="text"
                      required
                      value={addressForm.country}
                      onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                    <input
                      type="tel"
                      required
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={addressForm.isDefault}
                      onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Set as default address</span>
                  </label>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : editingAddress ? 'Update Address' : 'Add Address'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddressForm(false);
                      setEditingAddress(null);
                      resetAddressForm();
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}




