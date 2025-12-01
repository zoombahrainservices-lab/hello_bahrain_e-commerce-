import { Router, Request, Response } from 'express';
import { getSupabase } from '../config/db';

const router = Router();

// GET /api/banners/active - Get active banners
router.get('/active', async (req: Request, res: Response) => {
  try {
    const { data, error } = await getSupabase()
      .from('banners')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform banners to camelCase for frontend
    const transformedBanners = (data || []).map((banner: any) => {
      // Extract alignment data from cta_link if it exists
      const linkParts = banner.cta_link.split('|||');
      const actualLink = linkParts[0];
      let alignmentData: any = {
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
      };

      if (linkParts[1]) {
        try {
          alignmentData = JSON.parse(linkParts[1]);
        } catch (e) {
          // Invalid JSON, use defaults
        }
      }

      return {
        _id: banner.id,
        title: banner.title,
        subtitle: banner.subtitle,
        ctaLabel: banner.cta_label,
        ctaLink: actualLink, // Return clean link without alignment data
        image: banner.image,
        active: banner.active,
        textAlign: alignmentData.textAlign || 'left',
        textVertical: alignmentData.textVertical || 'middle',
        buttonAlign: alignmentData.buttonAlign || 'left',
        buttonVertical: alignmentData.buttonVertical || 'middle',
        displayOrder: alignmentData.displayOrder || 0,
        titleColor: alignmentData.titleColor || '#ffffff',
        subtitleColor: alignmentData.subtitleColor || '#e5e7eb',
        buttonBgColor: alignmentData.buttonBgColor || '#ffffff',
        buttonTextColor: alignmentData.buttonTextColor || '#111827',
        titleSize: alignmentData.titleSize || 'lg',
        subtitleSize: alignmentData.subtitleSize || 'md',
        titleBold: alignmentData.titleBold ?? true,
        titleItalic: alignmentData.titleItalic ?? false,
        subtitleBold: alignmentData.subtitleBold ?? false,
        subtitleItalic: alignmentData.subtitleItalic ?? false,
      };
    });

    res.json(transformedBanners);
  } catch (error) {
    console.error('Error fetching banners:', error);
    res.status(500).json({ message: 'Error fetching banners' });
  }
});

export default router;
