const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/app/contact/page.jsx',
  'src/app/complete-profile/page.jsx',
  'src/app/login/page.jsx',
  'src/app/privacy/page.jsx',
  'src/app/profile/page.jsx',
  'src/app/register/page.jsx',
  'src/app/terms/page.jsx'
];

filesToFix.forEach(relPath => {
  const absolutePath = path.join('c:\\موقع التحميل\\anything\\apps\\web', relPath);
  if (fs.existsSync(absolutePath)) {
    let content = fs.readFileSync(absolutePath, 'utf8');
    
    // Replace const { t, isRTL } = useLang(); or similar
    // We want to make sure lang and toggleLang are extracted
    content = content.replace(/const\s+\{\s*([^}]*?)\s*\}\s*=\s*useLang\(\)\s*;/g, (match, inner) => {
      let vars = inner.split(',').map(v => v.trim());
      if (!vars.includes('t')) vars.push('t');
      if (!vars.includes('lang')) vars.push('lang');
      if (!vars.includes('toggleLang')) vars.push('toggleLang');
      return `const { ${vars.join(', ')} } = useLang();`;
    });

    // Replace <Header ... /> with <Header t={t} lang={lang} toggleLang={toggleLang} />
    content = content.replace(/<Header[^>]*>/g, '<Header t={t} lang={lang} toggleLang={toggleLang} />');

    fs.writeFileSync(absolutePath, content, 'utf8');
    console.log(`Fixed ${relPath}`);
  } else {
    console.log(`File not found: ${absolutePath}`);
  }
});
