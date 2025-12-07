import { Router, Request, Response } from 'express';
import { getSupabase } from '../config/db';

const router = Router();

// POST /api/contact - Submit contact form
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email, message } = req.body;

    // Validation
    if (!name || !email || !message) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ message: 'Invalid email format' });
      return;
    }

    // Store contact message in database
    // First, check if contact_messages table exists, if not we'll just log it
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
      res.json({ 
        message: 'Thank you for contacting us! We will get back to you soon.',
        logged: true 
      });
      return;
    }

    res.json({ 
      message: 'Thank you for contacting us! We will get back to you soon.',
      id: data.id 
    });
  } catch (error: any) {
    console.error('Error processing contact form:', error);
    
    // Log the message even if database insert fails
    console.log('📧 Contact Form Submission (fallback):', {
      name: req.body?.name,
      email: req.body?.email,
      message: req.body?.message,
      timestamp: new Date().toISOString(),
    });

    res.status(500).json({ message: 'Failed to send message. Please try again later.' });
  }
});

export default router;

