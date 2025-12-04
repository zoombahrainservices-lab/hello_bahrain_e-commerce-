import { Router, Request, Response } from 'express';

const router = Router();

const merchantId = process.env.EAZYPAY_MERCHANT_ID || '';
const apiPassword = process.env.EAZYPAY_API_PASSWORD || '';
const baseUrl = process.env.EAZYPAY_API_BASE_URL || '';
const returnUrl = process.env.EAZYPAY_RETURN_URL || '';
const cancelUrl = process.env.EAZYPAY_CANCEL_URL || '';

function getAuthHeader() {
  const username = `merchant.${merchantId}`;
  const token = Buffer.from(`${username}:${apiPassword}`).toString('base64');
  return `Basic ${token}`;
}

// POST /api/eazypay/session - create EazyPay/MPGS session
router.post('/session', async (req: Request, res: Response) => {
  try {
    if (!merchantId || !apiPassword || !baseUrl) {
      res.status(500).json({ message: 'EazyPay environment variables are not configured' });
      return;
    }

    const { amount, currency = 'BHD', orderId } = req.body || {};

    if (!amount || !orderId) {
      res.status(400).json({ message: 'amount and orderId are required' });
      return;
    }

    const payload = {
      apiOperation: 'INITIATE_CHECKOUT',
      order: {
        id: String(orderId),
        amount: Number(amount).toFixed(3),
        currency,
        description: `Order #${orderId}`,
      },
      interaction: {
        operation: 'PURCHASE',
        returnUrl,
        cancelUrl,
      },
    };

    const response = await fetch(
      `${baseUrl}/merchant/${encodeURIComponent(merchantId)}/session`,
      {
        method: 'POST',
        headers: {
          Authorization: getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error('EazyPay session error', response.status, text);
      res.status(500).json({ message: 'Failed to create EazyPay session' });
      return;
    }

    const data = await response.json();
    const sessionId = data?.session?.id;

    if (!sessionId) {
      console.error('EazyPay response missing session.id', data);
      res.status(500).json({ message: 'Invalid EazyPay response' });
      return;
    }

    res.json({ sessionId, orderId });
  } catch (error) {
    console.error('EazyPay session exception', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/eazypay/status - check payment status for an order
router.post('/status', async (req: Request, res: Response) => {
  try {
    if (!merchantId || !apiPassword || !baseUrl) {
      res.status(500).json({ message: 'EazyPay environment variables are not configured' });
      return;
    }

    const { orderId } = req.body || {};

    if (!orderId) {
      res.status(400).json({ message: 'orderId is required' });
      return;
    }

    const response = await fetch(
      `${baseUrl}/merchant/${encodeURIComponent(merchantId)}/order/${encodeURIComponent(
        String(orderId)
      )}`,
      {
        method: 'GET',
        headers: {
          Authorization: getAuthHeader(),
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error('EazyPay status error', response.status, text);
      res.status(500).json({ message: 'Failed to fetch EazyPay status' });
      return;
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('EazyPay status exception', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;


