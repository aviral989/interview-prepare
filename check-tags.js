import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Strip TypeScript generics to avoid JSX confusion
code = code.replace(/useState\s*<[^>]+>/g, 'useState');
code = code.replace(/useRef\s*<[^>]+>/g, 'useRef');
code = code.replace(/as\s+<[^>]+>/g, '');
code = code.replace(/<string>/g, '');
code = code.replace(/<boolean>/g, '');
code = code.replace(/<number>/g, '');
code = code.replace(/<any>/g, '');
code = code.replace(/<[A-Za-z0-9_\[\]]+>/g, '');

let inComment = false;
let inString = false;
let stringChar = '';
let inTag = false;
let tagContent = '';

let tags = [];

for (let i = 0; i < code.length; i++) {
  const char = code[i];
  const next = code[i + 1];
  const prev = code[i - 1];
  
  if (inComment) {
    if (char === '*' && next === '/') {
      inComment = false;
      i++;
    }
    continue;
  }
  
  if (char === '/' && next === '*') {
    inComment = true;
    i++;
    continue;
  }
  
  // Single-line comments
  if (char === '/' && next === '/' && !inString && !inTag) {
    // skip to end of line
    while (i < code.length && code[i] !== '\n') {
      i++;
    }
    continue;
  }
  
  if (inString) {
    if (char === stringChar && prev !== '\\') {
      inString = false;
    }
    continue;
  }
  
  if ((char === '"' || char === "'" || char === '`') && prev !== '\\' && !inTag) {
    inString = true;
    stringChar = char;
    continue;
  }
  
  if (char === '<' && !inTag) {
    // Check if it's a tag or just less than operator.
    // If it's followed by a letter, a slash, or a question mark/exclamation, it's a tag
    if (/[a-zA-Z\/!]/.test(next)) {
      inTag = true;
      tagContent = '';
    }
    continue;
  }
  
  if (char === '>' && inTag) {
    inTag = false;
    // Process tagContent
    tagContent = tagContent.trim();
    // Get line number
    const sub = code.substring(0, i);
    const lineNum = sub.split('\n').length;
    
    // Parse tag name
    let tagName = '';
    let isClosing = tagContent.startsWith('/');
    let isSelfClosing = tagContent.endsWith('/') || ['img', 'input', 'hr', 'br'].includes(tagContent.toLowerCase());
    
    let cleanContent = tagContent;
    if (isClosing) cleanContent = cleanContent.substring(1);
    if (isSelfClosing && cleanContent.endsWith('/')) cleanContent = cleanContent.substring(0, cleanContent.length - 1);
    
    // Extract first word
    const match = cleanContent.match(/^[a-zA-Z0-9\-]+/);
    if (match) {
      tagName = match[0];
      if (!isSelfClosing) {
        tags.push({ name: tagName, isClosing, line: lineNum });
      }
    }
    continue;
  }
  
  if (inTag) {
    tagContent += char;
  }
}

// Now balance tags list
let stack = [];
for (const tag of tags) {
  if (tag.isClosing) {
    if (stack.length === 0) {
      console.log(`Unmatched closing tag </${tag.name}> on line ${tag.line}`);
    } else {
      const top = stack.pop();
      if (top.name !== tag.name) {
        console.log(`Mismatch on line ${tag.line}: close </${tag.name}> but top of stack is <${top.name}> from line ${top.line}`);
        // Put the top back in
        stack.push(top);
      }
    }
  } else {
    stack.push(tag);
  }
}

console.log('Finished balancing tags. Stack size remaining:', stack.length);
if (stack.length > 0) {
  console.log('Top unclosed tags starting from innermost:');
  console.log(stack.reverse().slice(0, 15));
}
