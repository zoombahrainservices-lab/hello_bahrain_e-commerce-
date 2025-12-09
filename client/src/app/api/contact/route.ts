import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/contact - Submit contact form
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, message } = body;

    // Validation
    if (!name || !email || !message) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Store contact message in database
    const { data, error } = await getSupabase()
      .from('contact_messages')
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        message: message.trim(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      // If table doesn't exist, just log the message
      console.log('📧 Contact Form Submission:', {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        message: message.trim(),
        timestamp: new Date().toISOString(),
      });
      
      // Still return success since the message was logged
      return NextResponse.json({ 
        message: 'Thank you for contacting us! We will get back to you soon.',
        logged: true 
      });
    }

    return NextResponse.json({ 
      message: 'Thank you for contacting us! We will get back to you soon.',
      id: data.id 
    });
  } catch (error: any) {
    console.error('Error processing contact form:', error);
    
    // Log the message even if database insert fails
    try {
      const body = await request.json();
      console.log('📧 Contact Form Submission (fallback):', {
        name: body?.name,
        email: body?.email,
        message: body?.message,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      // Request body already consumed
    }

    return NextResponse.json(
      { message: 'Failed to send message. Please try again later.' },
      { status: 500 }
    );
  }
}

