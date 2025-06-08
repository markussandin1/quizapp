// Vercel Function: /api/quiz/[id].js
export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, admin-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;
  
  // Mock quiz med frågor
  const mockQuiz = {
    id: parseInt(id),
    title: "Test Quiz",
    description: "Ett test quiz",
    image_url: "https://via.placeholder.com/300x200",
    questions: [
      {
        id: 1,
        question_text: "Vad är huvudstaden i Sverige?",
        question_type: "multiple_choice",
        options: ["Stockholm", "Göteborg", "Malmö", "Uppsala"],
        correct_answer: "Stockholm",
        explanation: "Stockholm är Sveriges huvudstad",
        time_limit: 30,
        points: 1
      }
    ]
  };

  if (req.method === 'GET') {
    return res.status(200).json(mockQuiz);
  }
  
  return res.status(404).json({ error: 'Not found' });
}