const url = "https://www.facebook.com/photo/?fbid=830206252479532&set=a.510340331132794";
const formData = new URLSearchParams();
formData.append("q", url);
formData.append("vt", "facebook");

fetch("https://getmyfb.com/api/ajaxSearch", {
  method: "POST",
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "Origin": "https://getmyfb.com",
    "Referer": "https://getmyfb.com/"
  },
  body: formData
})
.then(r => r.json())
.then(data => console.log(JSON.stringify(data, null, 2)))
.catch(console.error);
