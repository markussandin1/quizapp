// Vercel Function: /api/quiz/images/all.js
export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, admin-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  // Mock bilder
  const mockImages = [
    "https://via.placeholder.com/800x600/FF6B6B/FFFFFF?text=Quiz+Image+1",
    "https://via.placeholder.com/800x600/4ECDC4/FFFFFF?text=Quiz+Image+2", 
    "https://via.placeholder.com/800x600/45B7D1/FFFFFF?text=Quiz+Image+3",
    "https://via.placeholder.com/800x600/96CEB4/FFFFFF?text=Quiz+Image+4"
  ];

  if (req.method === 'GET') {
    return res.status(200).json(mockImages);
  }
  
  return res.status(404).json({ error: 'Not found' });
}