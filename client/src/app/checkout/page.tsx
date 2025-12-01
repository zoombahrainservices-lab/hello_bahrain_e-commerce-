'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { api } from '@/lib/api';

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

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const { items, getTotal, clearCart } = useCart();
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    country: '',
    postalCode: '',
    phone: '',
  });

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useSavedAddress, setUseSavedAddress] = useState(false);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/checkout');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (items.length === 0) {
      router.push('/cart');
    }
  }, [items, router]);

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  const fetchAddresses = async () => {
    try {
      const response = await api.get('/api/profile/addresses');
      setSavedAddresses(response.data || []);
      
      // Auto-select default address if available
      const defaultAddress = response.data?.find((addr: Address) => addr.isDefault);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
        setUseSavedAddress(true);
        setFormData({
          fullName: defaultAddress.fullName,
          addressLine1: defaultAddress.addressLine1,
          addressLine2: defaultAddress.addressLine2 || '',
          city: defaultAddress.city,
          country: defaultAddress.country,
          postalCode: defaultAddress.postalCode,
          phone: defaultAddress.phone,
        });
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const handleSelectAddress = (address: Address) => {
    setSelectedAddressId(address.id);
    setUseSavedAddress(true);
    setShowNewAddressForm(false);
    setFormData({
      fullName: address.fullName,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      country: address.country,
      postalCode: address.postalCode,
      phone: address.phone,
    });
  };

  const handleUseNewAddress = () => {
    setUseSavedAddress(false);
    setSelectedAddressId(null);
    setShowNewAddressForm(true);
    setFormData({
      fullName: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      country: 'Bahrain',
      postalCode: '',
      phone: '',
    });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Validate form data
      if (!formData.fullName || !formData.addressLine1 || !formData.city || 
          !formData.country || !formData.postalCode || !formData.phone) {
        setError('Please fill in all required fields');
        setSubmitting(false);
        return;
      }

      // Prepare order data
      const orderData = {
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        shippingAddress: formData,
      };

      await api.post('/api/orders', orderData);

      // Clear cart and redirect
      clearCart();
      router.push('/profile/orders?success=true');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (authLoading || items.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Shipping Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-6">Shipping Information</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {/* Saved Addresses */}
            {savedAddresses.length > 0 && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-700">Saved Addresses</h3>
                  <Link
                    href="/profile?tab=addresses"
                    className="text-primary-600 hover:text-primary-700 text-sm"
                  >
                    Manage Addresses
                  </Link>
                </div>
                <div className="space-y-3 mb-4">
                  {savedAddresses.map((address) => (
                    <div
                      key={address.id}
                      onClick={() => handleSelectAddress(address)}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                        selectedAddressId === address.id && useSavedAddress
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{address.label}</span>
                            {address.isDefault && (
                              <span className="bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded">
                                Default
                              </span>
                            )}
                            {selectedAddressId === address.id && useSavedAddress && (
                              <span className="text-primary-600 text-sm">✓ Selected</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700">
                            {address.fullName}, {address.addressLine1}
                            {address.addressLine2 && <>, {address.addressLine2}</>}
                            <br />
                            {address.city}, {address.postalCode}, {address.country}
                            <br />
                            Phone: {address.phone}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleUseNewAddress}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  + Use a different address
                </button>
                {!showNewAddressForm && useSavedAddress && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Using selected address. Click &quot;Use a different address&quot; to enter a
                      new one.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* New Address Form */}
            {(!useSavedAddress || showNewAddressForm || savedAddresses.length === 0) && (
              <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    name="addressLine1"
                    required
                    value={formData.addressLine1}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    name="addressLine2"
                    value={formData.addressLine2}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postal Code *
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      required
                      value={formData.postalCode}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country *
                  </label>
                  <input
                    type="text"
                    name="country"
                    required
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-6 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Processing...' : 'Place Order'}
                </button>
              </form>
            )}

            {savedAddresses.length > 0 && useSavedAddress && !showNewAddressForm && (
              <div className="mt-6">
                <button
                  onClick={() => handleSubmit()}
                  disabled={submitting || !selectedAddressId}
                  className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Processing...' : 'Place Order'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>

            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-3">
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-gray-600 text-sm">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-sm">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">${getTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-semibold">Free</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total</span>
                <span>${getTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

