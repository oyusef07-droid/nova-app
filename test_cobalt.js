const COBALT_INSTANCES = [
  "https://apicobalt.mgytr.top",
  "https://cobaltapi.kittycat.boo",
  "https://dog.kittycat.boo",
  "https://melon.clxxped.lol",
  "https://nuko-c.meowing.de",
];

async function test() {
  for (const instance of COBALT_INSTANCES) {
    try {
      const res = await fetch(`${instance}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", isAudioOnly: true, audioFormat: "mp3" })
      });
      if (res.ok) {
         const data = await res.json();
         console.log(`[${instance}] SUCCESS:`, data.url ? "Got URL" : JSON.stringify(data));
      } else {
         const text = await res.text();
         console.log(`[${instance}] Failed: HTTP ${res.status} ${text}`);
      }
    } catch(e) {
      console.log(`[${instance}] Network Failed:`, e.message);
    }
  }
}
test();
