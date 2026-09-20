import fs from 'fs';

const code = fs.readFileSync('src/App.tsx', 'utf-8');

let curlyStack = [];
let parenStack = [];
let angleStack = [];

const lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Simple scan ignoring comments and strings to get a rough trace
  let inString = false;
  let stringChar = '';
  let inComment = false;
  
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    const prev = line[j - 1];
    const next = line[j + 1];
    
    if (inComment) {
      if (char === '*' && next === '/') {
        inComment = false;
        j++;
      }
      continue;
    }
    
    if (char === '/' && next === '*') {
      inComment = true;
      j++;
      continue;
    }
    
    if (char === '/' && next === '/') {
      break; // Ignore rest of line
    }
    
    if (inString) {
      if (char === stringChar && prev !== '\\') {
        inString = false;
      }
      continue;
    }
    
    if ((char === '"' || char === "'" || char === '`') && prev !== '\\') {
      inString = true;
      stringChar = char;
      continue;
    }
    
    if (char === '{') {
      curlyStack.push({ line: i + 1, col: j + 1 });
    } else if (char === '}') {
      if (curlyStack.length === 0) {
        console.log(`Extra } on line ${i + 1}:${j + 1}`);
      } else {
        curlyStack.pop();
      }
    } else if (char === '(') {
      parenStack.push({ line: i + 1, col: j + 1 });
    } else if (char === ')') {
      if (parenStack.length === 0) {
        console.log(`Extra ) on line ${i + 1}:${j + 1}`);
      } else {
        parenStack.pop();
      }
    }
  }
}

console.log('Unclosed Curlies {:', curlyStack.length);
if (curlyStack.length > 0) {
  console.log('Top unclosed curlies:', curlyStack.slice(-5));
}

console.log('Unclosed Parens (:', parenStack.length);
if (parenStack.length > 0) {
  console.log('Top unclosed parens:', parenStack.slice(-5));
}
