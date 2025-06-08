// Vercel Function: /api/quiz/index.js
export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, admin-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Enkel mock data för att testa
  const mockQuizzes = [
    {
      id: 1,
      title: "Test Quiz",
      description: "Ett test quiz",
      image_url: "https://via.placeholder.com/300x200",
      created_at: new Date().toISOString()
    }
  ];

  if (req.method === 'GET') {
    return res.status(200).json(mockQuizzes);
  }
  
  return res.status(404).json({ error: 'Not found' });
}