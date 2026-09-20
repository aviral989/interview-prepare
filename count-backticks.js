import fs from 'fs';

const code = fs.readFileSync('src/App.tsx', 'utf-8');

let doubleQuotes = 0;
let singleQuotes = 0;
let backticks = 0;

let inSingleComment = false;
let inMultiComment = false;

// Scan character-by-character
for (let i = 0; i < code.length; i++) {
  const char = code[i];
  const next = code[i + 1];
  const prev = code[i - 1];
  
  if (inMultiComment) {
    if (char === '*' && next === '/') {
      inMultiComment = false;
      i++;
    }
    continue;
  }
  if (inSingleComment) {
    if (char === '\n') {
      inSingleComment = false;
    }
    continue;
  }
  if (char === '/' && next === '*') {
    inMultiComment = true;
    i++;
    continue;
  }
  if (char === '/' && next === '/') {
    inSingleComment = true;
    i++;
    continue;
  }
  
  if (char === '"' && prev !== '\\') {
    doubleQuotes++;
  }
  if (char === "'" && prev !== '\\') {
    singleQuotes++;
  }
  if (char === '`' && prev !== '\\') {
    backticks++;
  }
}

console.log('Double quotes:', doubleQuotes);
console.log('Single quotes:', singleQuotes);
console.log('Backticks:', backticks);

if (doubleQuotes % 2 !== 0) {
  console.log('WARNING: Double quotes are unbalanced!');
}
if (singleQuotes % 2 !== 0) {
  console.log('WARNING: Single quotes are unbalanced!');
}
if (backticks % 2 !== 0) {
  console.log('WARNING: Backticks are unbalanced!');
}
