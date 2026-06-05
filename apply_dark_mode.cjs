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
  // Backgrounds
  { regex: /(?<!dark:)(bg-white)/g, newStr: 'bg-white dark:bg-gray-900' },
  { regex: /(?<!dark:)(bg-gray-50)(?!\d)/g, newStr: 'bg-gray-50 dark:bg-gray-950' },
  { regex: /(?<!dark:)(bg-gray-100)(?!\d)/g, newStr: 'bg-gray-100 dark:bg-gray-800' },
  { regex: /(?<!dark:)(bg-gray-200)(?!\d)/g, newStr: 'bg-gray-200 dark:bg-gray-700' },
  
  // Text colors
  { regex: /(?<!dark:)(text-gray-900)/g, newStr: 'text-gray-900 dark:text-white' },
  { regex: /(?<!dark:)(text-gray-800)/g, newStr: 'text-gray-800 dark:text-gray-100' },
  { regex: /(?<!dark:)(text-gray-700)/g, newStr: 'text-gray-700 dark:text-gray-200' },
  { regex: /(?<!dark:)(text-gray-600)/g, newStr: 'text-gray-600 dark:text-gray-300' },
  { regex: /(?<!dark:)(text-gray-500)/g, newStr: 'text-gray-500 dark:text-gray-400' },
  { regex: /(?<!dark:)(text-gray-400)/g, newStr: 'text-gray-400 dark:text-gray-500' },

  // Borders
  { regex: /(?<!dark:)(border-gray-200)(?!\d)/g, newStr: 'border-gray-200 dark:border-gray-800' },
  { regex: /(?<!dark:)(border-gray-100)(?!\d)/g, newStr: 'border-gray-100 dark:border-gray-800' },
  { regex: /(?<!dark:)(border-gray-300)(?!\d)/g, newStr: 'border-gray-300 dark:border-gray-700' },

  // Hover states
  { regex: /(?<!dark:)(hover:bg-gray-50)(?!\d)/g, newStr: 'hover:bg-gray-50 dark:hover:bg-gray-800' },
  { regex: /(?<!dark:)(hover:bg-gray-100)(?!\d)/g, newStr: 'hover:bg-gray-100 dark:hover:bg-gray-700' },
  { regex: /(?<!dark:)(hover:text-gray-900)/g, newStr: 'hover:text-gray-900 dark:hover:text-white' }
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  const original = content;
  
  replacements.forEach(({regex, newStr}) => {
    content = content.replace(regex, newStr);
  });
  
  // Custom fix for any duplicate "dark:dark:" that might occur
  content = content.replace(/dark:dark:/g, 'dark:');
  
  if (content !== original) {
    fs.writeFileSync(f, content, 'utf8');
    count++;
    console.log('Updated', f);
  }
});
console.log('Total files converted to true Dark Mode classes:', count);
