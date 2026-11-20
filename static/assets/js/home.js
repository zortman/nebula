function shellTop() {
  try {
    return top.document.body?.dataset.shell === "true" ? top : null;
  } catch {
    return null;
  }
}
const cloakHost = shellTop() ?? window;

let inFrame;
try {
  inFrame = window !== top || window.shellRedirecting === true;
} catch (e) {
  inFrame = true;
}

let hasLaunched = false;

function launchAboutBlank(showAlert) {
  if (hasLaunched || navigator.userAgent.includes("Firefox")) {
    return true;
  }

  const popup = open("about:blank", "_blank");
  if (!popup || popup.closed) {
    if (showAlert) {
      alert("Window blocked. Please allow popups for this site.");
    }
    return false;
  }

  hasLaunched = true;

  const doc = popup.document;
  const iframe = doc.createElement("iframe");
  const link = doc.createElement("link");
  const script = doc.createElement("script");

  doc.title = (window.laceTitle || (s => s))(store.get("name") || "My Drive - Google Drive");
  link.rel = "icon";
  link.href = absoluteUrl(store.get("icon") || "https://gstatic.com");

  iframe.src = cloakHost.location.href;
  Object.assign(iframe.style, {
    position: "fixed",
    inset: "0",
    border: "none",
    outline: "none",
    width: "100%",
    height: "100%"
  });

  script.textContent = "window.onbeforeunload = event => { const message = 'Leave Site?'; (event || window.event).returnValue = message; return message; };";

  doc.head.append(link, script);
  doc.body.appendChild(iframe);

  // Close the original tab if permitted by the browser
  window.close();
  return true;
}

// Wait for the site to load, then wait 5 seconds and launch into about:blank
if (!inFrame) {
  window.addEventListener("load", function () {
    setTimeout(function () {
      const opened = launchAboutBlank(false);

      // If Chrome's popup blocker stopped the 5-second timer, force open on the first click or key press
      if (!opened) {
        function forceOnInteract() {
          if (launchAboutBlank(false)) {
            document.removeEventListener("click", forceOnInteract, true);
            document.removeEventListener("keydown", forceOnInteract, true);
          }
        }
        document.addEventListener("click", forceOnInteract, true);
        document.addEventListener("keydown", forceOnInteract, true);
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
    launchAboutBlank(true);
  });
}

(function buildHeading() {
  const heading = document.querySelector("h1.title");
  if (!heading) return;
  heading.textContent = "Nebula";
})();
