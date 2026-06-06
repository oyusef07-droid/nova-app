import { ndown, tikdown, ytdown, twitterdown } from 'nayan-media-downloader';

async function testAll() {
  try {
    const ig = await ndown('https://www.instagram.com/reel/C2_r8D9s2O5/');
    console.log('IG:', JSON.stringify(ig).slice(0, 150));
  } catch(e) { console.error('IG ERR', e.message); }

  try {
    const tw = await twitterdown('https://x.com/SpaceX/status/1768270612503613618');
    console.log('TW:', JSON.stringify(tw).slice(0, 150));
  } catch(e) { console.error('TW ERR', e.message); }

  try {
    const yt = await ytdown('https://www.youtube.com/watch?v=jNQXAC9IVRw');
    console.log('YT:', JSON.stringify(yt).slice(0, 150));
  } catch(e) { console.error('YT ERR', e.message); }
  
  try {
    const fb = await ndown('https://www.facebook.com/facebook/videos/10153231379946729/');
    console.log('FB:', JSON.stringify(fb).slice(0, 150));
  } catch(e) { console.error('FB ERR', e.message); }
}

testAll();
