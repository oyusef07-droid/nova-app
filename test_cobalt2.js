const COBALT_INSTANCES = [
  "https://apicobalt.mgytr.top",
  "https://cobaltapi.kittycat.boo"
];

async function testParams(bodyParams) {
  console.log("Testing:", bodyParams);
  for (const instance of COBALT_INSTANCES) {
    try {
      const res = await fetch(`${instance}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", ...bodyParams })
      });
      if (res.ok) {
         console.log(`[${instance}] SUCCESS`);
      } else {
         const text = await res.text();
         console.log(`[${instance}] Failed: HTTP ${res.status} ${text}`);
      }
    } catch(e) {}
  }
}

async function run() {
  await testParams({ downloadMode: "audio" });
  await testParams({ isAudioOnly: true });
  await testParams({ aFormat: "mp3", isAudioOnly: true });
  await testParams({ audioFormat: "mp3", isAudioOnly: true });
}
run();
