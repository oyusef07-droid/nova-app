const https = require('https');

https.get('https://moka22omar-nova2.hf.space/api/auth/providers', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("Providers:", data);
  });
});

const req = https.request('https://moka22omar-nova2.hf.space/api/auth/csrf', (res) => {
  let data = '';
  let cookies = res.headers['set-cookie'];
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const csrf = JSON.parse(data).csrfToken;
    console.log("CSRF Token:", csrf);
    
    // Now request signin/google
    const postData = `csrfToken=${encodeURIComponent(csrf)}`;
    const options = {
      hostname: 'moka22omar-nova2.hf.space',
      port: 443,
      path: '/api/auth/signin/google',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'Cookie': cookies ? cookies.join('; ') : ''
      }
    };
    
    const req2 = https.request(options, (res2) => {
      console.log("Status:", res2.statusCode);
      console.log("Headers:", res2.headers);
      res2.on('data', () => {});
    });
    req2.write(postData);
    req2.end();
  });
});
req.end();
