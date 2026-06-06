const fs = require('fs');
const file = 'src/app/api/analyze/route.js';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  "const USER_CUSTOM_SERVER = 'https://YOUR-CUSTOM-SERVER-URL.com';",
  "const USER_CUSTOM_SERVER = 'https://media-downloader-moka-production.up.railway.app';"
);
fs.writeFileSync(file, content);
console.log('Updated URL successfully');
