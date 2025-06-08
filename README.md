# 🧠 Nutidsquiz - Quiz App för Mellanstadiet

En webbaserad quiz-applikation optimerad för elever i årskurs 4-6 (10-12 år).

## 🚀 Installation och Setup

### Backend (API Server)

1. Navigera till backend-mappen:
```bash
cd backend
```

2. Installera dependencies:
```bash
npm install
```

3. Starta utvecklingsservern:
```bash
npm run dev
```

Alternativt, för att testa utan TypeScript:
```bash
node src/simple-server.js
```

Backend-servern kommer att starta på `http://localhost:3001`

### Frontend (React App)

1. Navigera till frontend-mappen:
```bash
cd frontend
```

2. Installera dependencies (lägg till react-router-dom om det inte redan finns):
```bash
npm install
npm install react-router-dom
```

3. Starta utvecklingsservern:
```bash
npm start
```

Frontend-applikationen kommer att öppnas på `http://localhost:3000`

## 📝 Testning

### 1. Test av Backend API

Använd dessa endpoints för att testa backend:

- **Health Check**: `GET http://localhost:3001/api/health`
- **Lista Quiz**: `GET http://localhost:3001/api/quiz`  
- **Hämta Specifikt Quiz**: `GET http://localhost:3001/api/quiz/1`

### 2. Upload av Quiz Data

För att ladda upp ett nytt quiz, använd sample-quiz.json:

```bash
curl -X POST http://localhost:3001/api/quiz/upload \
  -F "quizFile=@sample-quiz.json"
```

### 3. Test av Frontend

1. Öppna `http://localhost:3000` i webbläsaren
2. Du bör se startsidan med tillgängliga quiz
3. Klicka på "Starta Quiz" för att testa quiz-funktionaliteten
4. Testa timer, svar och resultatvisning

## 🎯 Funktioner

### ✅ Implementerat
- Responsiv design för surfplattor och datorer
- Quiz-interface med timer och progress-indikator
- Stöd för flervalsfrågkor och sant/falskt-frågor
- Omedelbar feedback med animationer
- Detaljerad resultatvisning
- JSON-baserad quiz-uppladdning
- SQLite-databas för datalagring

### 🚧 Kommande funktioner
- Användarregistrering och autentisering
- Klasshantering för lärare
- Detaljerad statistik och rankningsystem
- Export-funktionalitet (CSV/Excel)
- Mobiloptimering

## 🎨 Design

Applikationen är designad med fokus på:
- **Stora, lättklickade knappar** för touchskärmar
- **Tydlig typografi** läsbar för yngre elever
- **Färgglada gradienter** för att skapa engagemang
- **Animationer och emojis** för positiv feedback
- **Svenskt språk** anpassat för målgruppen

## 📱 Responsiv Design

Appen är optimerad för:
- Surfplattor (iPad, Android tablets)
- Desktop-datorer
- Större smartphones (planerad förbättring)

## 🔧 Teknisk Stack

- **Frontend**: React 19 + TypeScript + CSS3
- **Backend**: Node.js + Express + TypeScript
- **Databas**: SQLite3
- **Styling**: Anpassad CSS med gradients och animationer
- **Routing**: React Router DOM

## 📊 Databasschema

```sql
users (id, name, class_name, school, password_hash, role, created_at)
quizzes (id, title, description, created_by, created_at)
questions (id, quiz_id, question_text, question_type, options, correct_answer, time_limit, points)
quiz_sessions (id, user_id, quiz_id, started_at, completed_at, total_score, max_score)
user_answers (id, session_id, question_id, user_answer, is_correct, answered_at, time_taken)
```

## 🎮 Hur man skapar nya Quiz

1. Skapa en JSON-fil enligt detta format:

```json
{
  "title": "Quiz-titel",
  "description": "Beskrivning av quizet",
  "questions": [
    {
      "question_text": "Din fråga här?",
      "question_type": "multiple_choice",
      "options": ["Alternativ 1", "Alternativ 2", "Alternativ 3", "Alternativ 4"],
      "correct_answer": "Rätt alternativ",
      "time_limit": 30,
      "points": 1
    }
  ]
}
```

2. Ladda upp via API eller webgränssnitt (kommer i framtida version)

## 🎯 Målgrupp

Applikationen är specifikt designad för:
- **Elever**: 10-12 år (årskurs 4-6)
- **Lärare**: För att skapa och hantera quiz
- **Skolor**: Klassrumsanvändning med surfplattor

## 🔒 Säkerhet

- Input-validering för alla formulär
- SQL injection-skydd
- CORS-konfiguration
- Helmet för säkerhetsheaders
- Säker filuppladdning med validering