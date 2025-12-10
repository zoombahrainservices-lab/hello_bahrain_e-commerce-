import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { getSupabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

// PATCH /api/admin/users/:id/role - Update user role
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = params;
    const body = await request.json();
    const { role } = body;

    if (!role || !['user', 'admin'].includes(role)) {
      return NextResponse.json(
        { message: 'Invalid role. Must be "user" or "admin"' },
        { status: 400 }
      );
    }

    const { data, error } = await getSupabase()
      .from('users')
      .update({ role })
      .eq('id', id)
      .select('id, name, email, role, created_at')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      createdAt: data.created_at,
    });
  } catch (error: any) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { message: 'Error updating user role', error: error?.message },
      { status: 500 }
    );
  }
}


