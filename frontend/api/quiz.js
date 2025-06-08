// Single API function for all quiz endpoints
export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, admin-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url, method } = req;
  
  // Route based on URL path
  if (url === '/api/quiz' && method === 'GET') {
    // Get all quizzes
    const mockQuizzes = [
      {
        id: 1,
        title: "Test Quiz",
        description: "Ett test quiz",
        image_url: "https://via.placeholder.com/300x200",
        created_at: new Date().toISOString()
      }
    ];
    return res.status(200).json(mockQuizzes);
  }
  
  if (url.startsWith('/api/quiz/') && method === 'GET') {
    const pathParts = url.split('/');
    
    if (pathParts[4] === 'images' && pathParts[5] === 'all') {
      // Get all images
      const mockImages = [
        "https://via.placeholder.com/800x600/FF6B6B/FFFFFF?text=Quiz+Image+1",
        "https://via.placeholder.com/800x600/4ECDC4/FFFFFF?text=Quiz+Image+2", 
        "https://via.placeholder.com/800x600/45B7D1/FFFFFF?text=Quiz+Image+3",
        "https://via.placeholder.com/800x600/96CEB4/FFFFFF?text=Quiz+Image+4"
      ];
      return res.status(200).json(mockImages);
    }
    
    // Get specific quiz
    const id = pathParts[3];
    if (id && !isNaN(parseInt(id))) {
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
      return res.status(200).json(mockQuiz);
    }
  }
  
  return res.status(404).json({ error: 'Not found' });
}