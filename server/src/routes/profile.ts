import { Router, Response, Request } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getSupabase } from '../config/db';
import bcrypt from 'bcrypt';

const router = Router();

// All profile routes require authentication
router.use(authMiddleware);

// GET /api/profile - Get user profile
router.get('/', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { data: user, error } = await getSupabase()
      .from('users')
      .select('id, name, email, phone, role, created_at, updated_at')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// PUT /api/profile - Update user profile
router.put('/', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { name, email, phone } = req.body;

    // Validate email format
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ message: 'Invalid email format' });
      return;
    }

    // Check if email is already taken by another user
    if (email) {
      const { data: existingUser } = await getSupabase()
        .from('users')
        .select('id')
        .eq('email', email)
        .neq('id', req.user.id)
        .single();

      if (existingUser) {
        res.status(400).json({ message: 'Email already in use' });
        return;
      }
    }

    // Update user
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    if (phone !== undefined) updateData.phone = phone || null;

    const { data: updatedUser, error } = await getSupabase()
      .from('users')
      .update(updateData)
      .eq('id', req.user.id)
      .select('id, name, email, phone, role, created_at, updated_at')
      .single();

    if (error) throw error;

    res.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone || '',
      role: updatedUser.role,
      createdAt: updatedUser.created_at,
      updatedAt: updatedUser.updated_at,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// PUT /api/profile/password - Change password
router.put('/password', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: 'Current password and new password are required' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ message: 'New password must be at least 6 characters' });
      return;
    }

    // Get user with password hash
    const { data: user, error: fetchError } = await getSupabase()
      .from('users')
      .select('password_hash')
      .eq('id', req.user.id)
      .single();

    if (fetchError) throw fetchError;

    if (!user.password_hash) {
      res.status(400).json({ message: 'Password change not available for Google accounts' });
      return;
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      res.status(400).json({ message: 'Current password is incorrect' });
      return;
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    const { error: updateError } = await getSupabase()
      .from('users')
      .update({ password_hash: newPasswordHash })
      .eq('id', req.user.id);

    if (updateError) throw updateError;

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Error changing password' });
  }
});

// ========== ADDRESS MANAGEMENT ==========

// GET /api/profile/addresses - Get all user addresses
router.get('/addresses', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { data: addresses, error } = await getSupabase()
      .from('user_addresses')
      .select('*')
      .eq('user_id', req.user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    const transformedAddresses = (addresses || []).map((addr: any) => ({
      id: addr.id,
      label: addr.label,
      fullName: addr.full_name,
      addressLine1: addr.address_line1,
      addressLine2: addr.address_line2,
      city: addr.city,
      country: addr.country,
      postalCode: addr.postal_code,
      phone: addr.phone,
      isDefault: addr.is_default,
      createdAt: addr.created_at,
      updatedAt: addr.updated_at,
    }));

    res.json(transformedAddresses);
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({ message: 'Error fetching addresses' });
  }
});

// POST /api/profile/addresses - Create new address
router.post('/addresses', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { label, fullName, addressLine1, addressLine2, city, country, postalCode, phone, isDefault } = req.body;

    // Validation
    if (!label || !fullName || !addressLine1 || !city || !country || !postalCode || !phone) {
      res.status(400).json({ message: 'All required fields must be provided' });
      return;
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await getSupabase()
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', req.user.id);
    }

    // Create address
    const { data: address, error } = await getSupabase()
      .from('user_addresses')
      .insert({
        user_id: req.user.id,
        label,
        full_name: fullName,
        address_line1: addressLine1,
        address_line2: addressLine2 || null,
        city,
        country,
        postal_code: postalCode,
        phone,
        is_default: isDefault || false,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      id: address.id,
      label: address.label,
      fullName: address.full_name,
      addressLine1: address.address_line1,
      addressLine2: address.address_line2,
      city: address.city,
      country: address.country,
      postalCode: address.postal_code,
      phone: address.phone,
      isDefault: address.is_default,
      createdAt: address.created_at,
      updatedAt: address.updated_at,
    });
  } catch (error) {
    console.error('Error creating address:', error);
    res.status(500).json({ message: 'Error creating address' });
  }
});

// PUT /api/profile/addresses/:id - Update address
router.put('/addresses/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const { label, fullName, addressLine1, addressLine2, city, country, postalCode, phone, isDefault } = req.body;

    // Verify address belongs to user
    const { data: existingAddress } = await getSupabase()
      .from('user_addresses')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (!existingAddress) {
      res.status(404).json({ message: 'Address not found' });
      return;
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await getSupabase()
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', req.user.id)
        .neq('id', id);
    }

    // Update address
    const updateData: any = {};
    if (label) updateData.label = label;
    if (fullName) updateData.full_name = fullName;
    if (addressLine1) updateData.address_line1 = addressLine1;
    if (addressLine2 !== undefined) updateData.address_line2 = addressLine2 || null;
    if (city) updateData.city = city;
    if (country) updateData.country = country;
    if (postalCode) updateData.postal_code = postalCode;
    if (phone) updateData.phone = phone;
    if (isDefault !== undefined) updateData.is_default = isDefault;

    const { data: updatedAddress, error } = await getSupabase()
      .from('user_addresses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      id: updatedAddress.id,
      label: updatedAddress.label,
      fullName: updatedAddress.full_name,
      addressLine1: updatedAddress.address_line1,
      addressLine2: updatedAddress.address_line2,
      city: updatedAddress.city,
      country: updatedAddress.country,
      postalCode: updatedAddress.postal_code,
      phone: updatedAddress.phone,
      isDefault: updatedAddress.is_default,
      createdAt: updatedAddress.created_at,
      updatedAt: updatedAddress.updated_at,
    });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ message: 'Error updating address' });
  }
});

// DELETE /api/profile/addresses/:id - Delete address
router.delete('/addresses/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    // Verify address belongs to user
    const { data: existingAddress } = await getSupabase()
      .from('user_addresses')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (!existingAddress) {
      res.status(404).json({ message: 'Address not found' });
      return;
    }

    const { error } = await getSupabase()
      .from('user_addresses')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ message: 'Error deleting address' });
  }
});

export default router;

