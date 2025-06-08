const fs = require('fs');
const path = require('path');

function findFilesRecursive(dir, extensions, results = []) {
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      if (file === 'node_modules') continue; // Skip node_modules
      
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        findFilesRecursive(fullPath, extensions, results);
      } else {
        const ext = path.extname(file).toLowerCase();
        if (extensions.includes(ext)) {
          results.push(fullPath);
        }
      }
    }
  } catch (error) {
    // Skip directories we can't read
  }
  
  return results;
}

console.log('🔍 Searching for quiz data sources...\n');

// Find SQLite databases
console.log('📊 SQLite databases:');
const dbFiles = findFilesRecursive('/Users/marsan/Kod-projekt/quizapp', ['.sqlite', '.sqlite3', '.db']);
dbFiles.forEach(file => {
  console.log(`  - ${file}`);
  try {
    const stats = fs.statSync(file);
    console.log(`    Size: ${stats.size} bytes, Modified: ${stats.mtime}`);
  } catch (e) {
    console.log(`    (Cannot read file stats)`);
  }
});

if (dbFiles.length === 0) {
  console.log('  (No SQLite databases found)');
}

console.log('\n🔍 Checking for hardcoded quiz data in JavaScript/TypeScript files...');

// Check server files for hardcoded quiz data
const codeFiles = [
  '/Users/marsan/Kod-projekt/quizapp/backend/src/server.ts',
  '/Users/marsan/Kod-projekt/quizapp/backend/src/simple-server.js'
];

codeFiles.forEach(filePath => {
  console.log(`\n📄 Checking: ${path.basename(filePath)}`);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Look for quiz data
    if (content.includes('quiz') || content.includes('questions')) {
      const lines = content.split('\n');
      let foundQuizData = false;
      
      lines.forEach((line, index) => {
        if (line.includes('title:') && (line.includes('Naturkunskap') || line.includes('Allehanda') || line.includes('Nutidsorientering'))) {
          console.log(`  Line ${index + 1}: ${line.trim()}`);
          foundQuizData = true;
        }
      });
      
      if (!foundQuizData) {
        console.log('  ✅ No hardcoded quiz data found');
      }
    } else {
      console.log('  ✅ No quiz references found');
    }
  } catch (error) {
    console.log(`  ❌ Cannot read file: ${error.message}`);
  }
});

console.log('\n🎯 Recommendations:');
console.log('1. Delete all .sqlite files found above');
console.log('2. Remove any hardcoded quiz data from server files');
console.log('3. Restart the server completely');
console.log('4. Check http://localhost:3001/api/quiz to verify it\'s empty');