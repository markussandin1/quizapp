import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { DatabaseService } from './services/database';
import quizRoutes from './routes/quiz';
import adminRoutes from './routes/admin';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const dbService = new DatabaseService();

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Quiz API is running' });
});

app.use('/api/quiz', quizRoutes);
app.use('/api/admin', adminRoutes);

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await dbService.initialize();
  
  // Load quiz data with duplicate protection - TEMPORARILY DISABLED
  /*
  const { QuizService } = await import('./services/quiz');
  const quizService = new QuizService();
  
  try {
    const nutidsQuiz = {
      title: "Nutidsorientering – Örnsköldsvik vecka 22",
      description: "Testa vad du vet om vad som hänt i Örnsköldsvik den senaste veckan!",
      questions: [
        {
          question_text: "I vilken stadsdel inträffade branden där en byggnad totalförstördes under veckan?",
          question_type: "multiple_choice" as const,
          options: ["Centrum", "Domsjö", "Hörnett", "Själevad"],
          correct_answer: "Domsjö",
          time_limit: 30,
          points: 1
        },
        {
          question_text: "Vilket fordon var inblandat i olyckan där två pojkar blev allvarligt skadade?",
          question_type: "multiple_choice" as const,
          options: ["Cykel", "Fyrhjuling", "Moped", "Bil"],
          correct_answer: "Fyrhjuling",
          time_limit: 30,
          points: 1
        },
        {
          question_text: "Vilket djur drabbades av ett smittsamt virus i Ö-vik enligt en artikel under veckan?",
          question_type: "multiple_choice" as const,
          options: ["Hund", "Katt", "Kanin", "Häst"],
          correct_answer: "Katt",
          time_limit: 30,
          points: 1
        },
        {
          question_text: "Vad handlade artikeln 'Det luktar så mycket svett' om?",
          question_type: "multiple_choice" as const,
          options: [
            "Att ventilationen i en skola var trasig",
            "Att eleverna hade idrottsdag",
            "Att det var varmt i klassrummet",
            "Att många elever glömde duscha efter idrotten"
          ],
          correct_answer: "Att många elever glömde duscha efter idrotten",
          time_limit: 30,
          points: 1
        },
        {
          question_text: "Vad säljer Adam till invånarna i Ö-vik enligt en artikel under veckan?",
          question_type: "multiple_choice" as const,
          options: ["Glass", "Bröd", "Tidningar", "Blommor"],
          correct_answer: "Glass",
          time_limit: 30,
          points: 1
        },
        {
          question_text: "Det har varit flera bränder i Örnsköldsvik under veckan.",
          question_type: "true_false" as const,
          correct_answer: "true",
          time_limit: 20,
          points: 1
        }
      ]
    };
    
    if (!(await quizService.quizExistsByTitle(nutidsQuiz.title))) {
      await quizService.createQuiz(nutidsQuiz);
      console.log('✅ Nutidsorientering Örnsköldsvik quiz loaded!');
    } else {
      console.log('ℹ️ Nutidsorientering Örnsköldsvik quiz already exists - skipping');
    }
    
    // Load Gävle quiz
    const gavleQuiz = {
      title: "Nutidsorientering – Gävle vecka 22",
      description: "Testa vad du vet om vad som hänt i Gävle den senaste veckan!",
      questions: [
        {
          question_text: "Vad handlade räkningen på 16 000 kronor om som kom som en chock för en person i Gävle?",
          question_type: "multiple_choice" as const,
          options: [
            "En elräkning",
            "En vattenläcka", 
            "En mobiltelefon",
            "En parkeringsbot"
          ],
          correct_answer: "En elräkning",
          time_limit: 30,
          points: 1
        },
        {
          question_text: "Vad hände på en uteservering på Rådhustorget i veckan?",
          question_type: "multiple_choice" as const,
          options: [
            "Det öppnade en ny glasskiosk",
            "Det blev en brand",
            "Det hölls en konsert",
            "Det var en fotbollsmatch"
          ],
          correct_answer: "Det blev en brand",
          time_limit: 30,
          points: 1
        },
        {
          question_text: "Vilket fordon sjönk utanför Piteå, men kom från Gävle?",
          question_type: "multiple_choice" as const,
          options: [
            "En segelbåt",
            "En bogserbåt",
            "En fiskebåt", 
            "En färja"
          ],
          correct_answer: "En bogserbåt",
          time_limit: 30,
          points: 1
        },
        {
          question_text: "Vad blev bowlinghallen i Gävle omgjord till under veckan?",
          question_type: "multiple_choice" as const,
          options: [
            "En biograf",
            "En restaurang",
            "Ett bibliotek",
            "En skola"
          ],
          correct_answer: "En restaurang",
          time_limit: 30,
          points: 1
        },
        {
          question_text: "Vad var det för speciell idrottstävling som hölls i Gävle under veckan?",
          question_type: "multiple_choice" as const,
          options: [
            "GD/GIF-olympiaden",
            "Gävle maraton",
            "Stadsfesten",
            "Brynäs Cup"
          ],
          correct_answer: "GD/GIF-olympiaden",
          time_limit: 30,
          points: 1
        },
        {
          question_text: "Det har varit flera bränder i Gävle under veckan.",
          question_type: "true_false" as const,
          correct_answer: "true",
          time_limit: 20,
          points: 1
        }
      ]
    };
    
    if (!(await quizService.quizExistsByTitle(gavleQuiz.title))) {
      await quizService.createQuiz(gavleQuiz);
      console.log('✅ Nutidsorientering Gävle quiz loaded!');
    } else {
      console.log('ℹ️ Nutidsorientering Gävle quiz already exists - skipping');
    }
    
    console.log('🚀 Server ready with quiz data!');
  } catch (error) {
    console.log('❌ Error loading quiz:', error);
    console.log('🚀 Server ready without quiz data');
  }
  */
  
  console.log('🚀 Server ready - clean database!');
});