const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.jsx') || file.endsWith('.tsx') || file.endsWith('.js')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
let count = 0;
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  const original = content;
  content = content.replace(/\b(text|bg|border|ring|shadow|from|to|via)-blue-(\d{2,3}(?:\/\d+)?)\b/g, '$1-primary-$2');
  content = content.replace(/hover:(text|bg|border)-blue-(\d{2,3}(?:\/\d+)?)\b/g, 'hover:$1-primary-$2');
  
  // also handle some text-blue-600 specific usages if any didn't match
  
  if (content !== original) {
    fs.writeFileSync(f, content, 'utf8');
    count++;
    console.log('Updated', f);
  }
});
console.log('Total files updated:', count);
