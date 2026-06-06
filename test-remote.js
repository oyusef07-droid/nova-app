async function test() {
  try {
    const res = await fetch("https://moka22omar-nova2.hf.space/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "packetastore@gmail.com" })
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Body:", text);
  } catch (e) {
    console.log("Error:", e);
  }
}
test();
