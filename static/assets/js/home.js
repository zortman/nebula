function shellTop() {
  try {
    return top.document.body?.dataset.shell === "true" ? top : null;
  } catch {
    return null;
  }
}
const cloakHost = shellTop() ?? window;

// Keep auto-cloaking and automatic redirects turned off
store.set("ab", "false");

const SplashT = [
  "Free and open source",
  "Need a game? Use Request A Game on the Games page",
  "Check out the FAQ to see where Nebula comes from",
  "Thanks for using the site",
  "Check out the settings page",
];

let SplashI = Math.floor(Math.random() * SplashT.length);
const SplashE = document.getElementById("splash");

const laceSplash = window.laceTitle ? s => window.laceTitle(s, false) : s => s;
function paintSplash() {
  if (!SplashE) return;
  SplashE.innerText = laceSplash(SplashT[SplashI]);
}

function cycleSplash() {
  SplashI = (SplashI + 1) % SplashT.length;
  paintSplash();
  SplashE.style.animation = "none";
  void SplashE.offsetWidth;
  SplashE.style.animation = "";
}

if (SplashE) {
  paintSplash();
  SplashE.addEventListener("click", cycleSplash);
}

function openHomeAboutBlank() {
  if (navigator.userAgent.includes("Firefox")) {
    return;
  }

  const popup = open("about:blank", "_blank");
  if (!popup || popup.closed) {
    alert("Window blocked. Please allow popups for this site.");
    return;
  }

  const doc = popup.document;
  const iframe = doc.createElement("iframe");
  const link = doc.createElement("link");
  const script = doc.createElement("script");
  doc.title = (window.laceTitle || (s => s))(store.get("name") || "My Drive - Google Drive");
  link.rel = "icon";
  link.href = absoluteUrl(store.get("icon") || "https://gstatic.com");
  iframe.src = cloakHost.location.href;
  Object.assign(iframe.style, { position: "fixed", inset: "0", border: "none", outline: "none", width: "100%", height: "100%" });
  script.textContent = "window.onbeforeunload = event => { const message = 'Leave Site?'; (event || window.event).returnValue = message; return message; };";
  doc.head.append(link, script);
  doc.body.appendChild(iframe);
}

const abBtn = document.getElementById("about-blank-button");
if (abBtn) {
  abBtn.addEventListener("click", openHomeAboutBlank);
}

(function buildHeading() {
  const heading = document.querySelector("h1.title");
  if (!heading) return;
  // "Nebula"
  const codes =;
  const twins = { 116: "т", 101: "е", 115: "ѕ", 97: "а", 73: "І" };
  let text = "";
  for (const code of codes) text += twins[code] && Math.random() < 0.4 ? twins[code] : String.fromCharCode(code);
  heading.textContent = text;
})();
