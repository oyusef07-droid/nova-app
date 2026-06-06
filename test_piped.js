const PIPED_INSTANCES = [
  "https://api.piped.private.coffee",
  "https://pipedapi.tokhmi.xyz",
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.adminforge.de",
  "https://pipedapi.leptons.xyz",
];

async function test() {
  for (const instance of PIPED_INSTANCES) {
    try {
      const res = await fetch(`${instance}/streams/dQw4w9WgXcQ`);
      const data = await res.json();
      console.log(`[${instance}] Video streams:`, data.videoStreams?.length, "Audio streams:", data.audioStreams?.length);
      if (data.audioStreams && data.audioStreams.length > 0) {
        console.log("Has audio streams:", data.audioStreams[0].url.substring(0, 50));
      } else {
        console.log("No audio streams");
      }
    } catch(e) {
      console.log(`[${instance}] Failed:`, e.message);
    }
  }
}

test();
