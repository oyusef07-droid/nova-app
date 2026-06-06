async function test() {
  const url = 'https://m.reviewrate.net/embed-lc2ftuq6chmr.html?as_play=1';
  console.log('Fetching', url);
  const res = await fetch(url);
  const text = await res.text();
  const matches = text.match(/https?:\/\/[^"'\s]+\.(m3u8|mp4)/gi);
  if (matches) {
    console.log("Matches found:", matches);
  } else {
    console.log("No matches found. Dumping first 1000 chars:");
    console.log(text.substring(0, 1000));
  }
}

test().catch(console.error);
