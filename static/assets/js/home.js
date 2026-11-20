function shellTop() {
  try {
    return top.document.body?.dataset.shell === "true" ? top : null;
  } catch {
    return null;
  }
}
const cloakHost = shellTop() ?? window;

let inFrame = false;
try {
  inFrame =
    window.self !== window.top ||
    window.frameElement !== null ||
    window.location.protocol === "about:" ||
    window.location.protocol === "blob:";
} catch (e) {
  inFrame = true;
}

let hasLaunched = false;
let noticeBanner = null;

function removeBanner() {
  if (noticeBanner && noticeBanner.parentNode) {
    noticeBanner.parentNode.removeChild(noticeBanner);
    noticeBanner = null;
  }
}

function showBlockedBanner() {
  if (hasLaunched || noticeBanner || !document.body) return;
  noticeBanner = document.createElement("div");
  noticeBanner.textContent = "Pop-ups are blocked — click anywhere on the page to launch cloaked tab";
  Object.assign(noticeBanner.style, {
    position: "fixed",
    top: "12px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "#111827",
    color: "#ffffff",
    padding: "10px 18px",
    borderRadius: "8px",
    fontSize: "14px",
    fontFamily: "sans-serif",
    zIndex: "999999",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
  });
  document.body.appendChild(noticeBanner);
}

function launchCloakedTab(showAlert) {
  if (inFrame || hasLaunched) {
    return true;
  }

  const title = (window.laceTitle || (s => s))(store.get("name") || "My Drive - Google Drive");
  const icon = absoluteUrl(store.get("icon") || "https://gstatic.com");
  const targetUrl = cloakHost.location.href;

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <link rel="icon" href="${icon}">
  <style>html,body,iframe{margin:0;padding:0;width:100%;height:100%;border:none;overflow:hidden;}</style>
</head>
<body>
  <iframe src="${targetUrl}"></iframe>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const blobUrl = URL.createObjectURL(blob);

  const popup = window.open(blobUrl, "_blank");
  if (!popup || popup.closed) {
    URL.revokeObjectURL(blobUrl);
    if (showAlert) {
      alert("Window blocked. Please allow popups for this site.");
    }
    return false;
  }

  hasLaunched = true;
  removeBanner();
  return true;
}

if (!inFrame) {
  window.addEventListener("load", function () {
    setTimeout(function () {
      const opened = launchCloakedTab(false);

      if (!opened) {
        showBlockedBanner();

        function forceOnInteract() {
          if (launchCloakedTab(false)) {
            window.removeEventListener("pointerdown", forceOnInteract, true);
            window.removeEventListener("click", forceOnInteract, true);
            window.removeEventListener("keydown", forceOnInteract, true);
          }
        }

        window.addEventListener("pointerdown", forceOnInteract, true);
        window.addEventListener("click", forceOnInteract, true);
        window.addEventListener("keydown", forceOnInteract, true);
      }
    }, 5000);
  });
}

const SplashT = new Array(
  "Free and open source",
  "Need a game? Use Request A Game on the Games page",
  "Check out the FAQ to see where Nebula comes from",
  "Thanks for using the site",
  "Check out the settings page"
);

let SplashI = Math.floor(Math.random() * SplashT.length);
const SplashE = document.getElementById("splash");

const laceSplash = window.laceTitle ? s => window.laceTitle(s, false) : s => s;
function paintSplash() {
  if (!SplashE) return;
  SplashE.innerText = laceSplash(SplashT.at(SplashI));
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

const abBtn = document.getElementById("about-blank-button");
if (abBtn) {
  abBtn.addEventListener("click", function () {
    launchCloakedTab(true);
  });
}

(function buildHeading() {
  const heading = document.querySelector("h1.title");
  if (!heading) return;
  heading.textContent = "Nebula";
})();
