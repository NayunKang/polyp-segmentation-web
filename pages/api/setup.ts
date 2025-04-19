import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Vercel 환경에서는 setup이 필요 없음
    // 모든 데이터는 이미 data.json에 있음
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in setup:', error);
    res.status(500).json({ error: 'Failed to setup dataset' });
  }
} 