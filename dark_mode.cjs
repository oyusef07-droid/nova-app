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

const replacements = [
  { from: /\bbg-white\b/g, to: 'bg-gray-900' },
  { from: /\bbg-gray-50\b/g, to: 'bg-gray-950' },
  { from: /\bbg-gray-100\b/g, to: 'bg-gray-800' },
  { from: /\bbg-gray-200\b/g, to: 'bg-gray-700' },
  { from: /\btext-gray-900\b/g, to: 'text-white' },
  { from: /\btext-gray-800\b/g, to: 'text-gray-100' },
  { from: /\btext-gray-700\b/g, to: 'text-gray-200' },
  { from: /\btext-gray-600\b/g, to: 'text-gray-300' },
  { from: /\btext-gray-500\b/g, to: 'text-gray-400' },
  { from: /\btext-gray-400\b/g, to: 'text-gray-500' },
  { from: /\bborder-gray-200\b/g, to: 'border-gray-800' },
  { from: /\bborder-gray-100\b/g, to: 'border-gray-800' },
  { from: /\bborder-gray-300\b/g, to: 'border-gray-700' },
  { from: /\bhover:bg-gray-50\b/g, to: 'hover:bg-gray-800' },
  { from: /\bhover:bg-gray-100\b/g, to: 'hover:bg-gray-700' },
  { from: /\bhover:text-gray-900\b/g, to: 'hover:text-white' },
];

// Special cases to skip or handle differently:
// Header.jsx already updated. We should skip Header.jsx and root.tsx to avoid overriding manual work.

files.forEach(f => {
  if (f.includes('Header.jsx') || f.includes('root.tsx') || f.includes('layout.jsx')) return;
  
  let content = fs.readFileSync(f, 'utf8');
  const original = content;
  
  replacements.forEach(({from, to}) => {
    content = content.replace(from, to);
  });
  
  if (content !== original) {
    fs.writeFileSync(f, content, 'utf8');
    count++;
    console.log('Updated', f);
  }
});
console.log('Total files converted to Dark Mode:', count);
