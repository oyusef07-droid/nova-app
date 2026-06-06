const fs = require('fs');

let orig = fs.readFileSync('route_original.js', 'utf16le'); 
if (!orig.includes('export async function POST')) {
   orig = fs.readFileSync('route_original.js', 'utf8');
}

const postIndexOrig = orig.indexOf('export async function POST');
const functionsBlock = orig.substring(orig.indexOf('function detectPlatform'), postIndexOrig);

let current = fs.readFileSync('src/app/api/analyze/route.js', 'utf8');
const detectIndex = current.indexOf('function detectPlatform');
const postIndexCurrent = current.indexOf('export async function POST');

const loadBalancerCode = `
// ───────────────────────────────────────────────
// NOVA Custom API Load Balancers
// ───────────────────────────────────────────────
// Layer 1: User's Custom Server (Desktop)
const USER_CUSTOM_SERVER = 'https://media-downloader-moka-production.up.railway.app';

// Layer 2: Agent's Custom Server (Railway)
const NOVA_API_SERVERS = [
  'https://nova-downloader-api-production.up.railway.app'
];

async function fetchFromCustomServer(url, serverUrl) {
  if (serverUrl.includes('YOUR-CUSTOM-SERVER-URL')) throw new Error('Custom server URL not set yet');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  const res = await fetch(\`\${serverUrl}/api/fetch?url=\${encodeURIComponent(url)}\`, {
    signal: controller.signal,
    headers: { 'Accept': 'application/json' }
  });
  clearTimeout(timeout);
  if (!res.ok) throw new Error(\`Server returned \${res.status}\`);
  const data = await res.json();
  if (!data.success || !data.data) throw new Error(data.error || 'Server returned unsuccessful response');
  return data.data;
}

`;

const newCode = current.substring(0, detectIndex) + functionsBlock + loadBalancerCode + current.substring(postIndexCurrent);

fs.writeFileSync('src/app/api/analyze/route.js', newCode);
console.log('Restored all fallback functions successfully');
