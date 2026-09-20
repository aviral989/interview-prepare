import fs from 'fs';
const code = fs.readFileSync('src/App.tsx', 'utf-8');
const lines = code.split('\n');
const line = lines[1685]; // 0-indexed for line 1686
console.log('Line 1686:', JSON.stringify(line));
console.log('Line 1686 raw chars:', line.split('').map(c => c + ' (' + c.charCodeAt(0) + ')').join(', '));
