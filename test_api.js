import { POST } from './src/app/api/analyze/route.js';

async function test() {
  const req = {
    json: async () => ({ url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" })
  };
  
  const res = await POST(req);
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

test();
