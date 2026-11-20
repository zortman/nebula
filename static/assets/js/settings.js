function tokenizeDropdowns() {
  const nativeValue = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value");
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const used = new Set();
  const makeToken = () => {
    let token;
    do {
      token = "";
      for (let i = 0; i < 10; i++) token += alphabet[Math.floor(Math.random() * alphabet.length)];
    } while (used.has(token));
    used.add(token);
    return token;
  };
  const lace = window.laceTitle || (text => text);

  for (const select of document.querySelectorAll("select")) {
    const toToken = new Map();
    const toReal = new Map();
    for (const option of select.options) {
      const real = option.hasAttribute("value") ? option.getAttribute("value") : option.textContent;
      const token = makeToken();
      toToken.set(real, token);
      toReal.set(token, real);
      option.setAttribute("value", token);
      option.textContent = lace(option.textContent);
      Object.defineProperty(option, "value", { get: () => real, configurable: true });
    }
    Object.defineProperty(select, "value", {
      get() {
        const token = nativeValue.get.call(this);
        return toReal.has(token) ? toReal.get(token) : token;
      },
      set(next) {
        const key = String(next);
        nativeValue.set.call(this, toToken.has(key) ? toToken.get(key) : key);
      },
      configurable: true,
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  tokenizeDropdowns();
  const adTypeElement = document.getElementById("adType");
  if (adTypeElement) {
    adTypeElement.addEventListener("change", function () {
      store.set("ads", this.value === "default" ? "on" : this.value);
    });
    const storedAd = store.get("ads");
    adTypeElement.value = storedAd === "popups" || storedAd === "off" ? storedAd : "default";
  }

  const sjOnly = Array.from(document.querySelectorAll("[data-sj-only]"));
  const uvOnly = Array.from(document.querySelectorAll("[data-uv-only]"));
  function syncProxyCards(proxy) {
    for (const el of sjOnly) el.style.display = proxy === "sj" ? "" : "none";
    for (const el of uvOnly) el.style.display = proxy === "sj" ? "none" : "";
  }

  const pChangeElement = document.getElementById("pChange");
  if (pChangeElement) {
    pChangeElement.addEventListener("change", function () {
      store.set("proxy", this.value);
      syncProxyCards(this.value);
    });
    pChangeElement.value = store.get("proxy") || "sj";
  }

  const transportElement = document.getElementById("transport-dropdown");
  if (transportElement) {
    transportElement.value = store.get("transport") === "libcurl" ? "libcurl" : "epoxy";
    transportElement.addEventListener("change", function () {
      store.set("transport", this.value);
      window.location.reload();
    });
  }

  syncProxyCards(store.get("proxy") || "sj");

  const wispInput = document.getElementById("wisp-input");
  if (wispInput) {
    wispInput.value = store.get("wisp-url") || "";
    wispInput.addEventListener("keydown", event => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      const val = wispInput.value.trim();
      if (val === "") {
        store.remove("wisp-url");
      } else if (/^wss?:\/\//i.test(val)) {
        store.set("wisp-url", val);
      } else {
        alert("Enter a valid Wisp URL starting with ws:// or wss://");
        return;
      }
      window.location.reload();
    });
  }

  const eventKeyInput = document.getElementById("eventKeyInput");
  const linkInput = document.getElementById("linkInput");
  const panicLinkDropdown = document.getElementById("panic-link-dropdown");
  const panicLinkCustomRow = document.getElementById("panic-link-custom-row");

  eventKeyInput.value = store.get("eventKeyRaw") || "`";

  function commitOnEnter(input, save) {
    input.addEventListener("change", save);
    input.addEventListener("keydown", event => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      save();
      input.blur();
    });
  }

  commitOnEnter(eventKeyInput, () => {
    const raw = eventKeyInput.value;
    store.set("eventKey", JSON.stringify(raw.split(",")));
    store.set("eventKeyRaw", raw);
  });

  const panicPresets = Array.from(panicLinkDropdown.options)
    .map(option => option.value)
    .filter(value => value !== "default" && value !== "custom");
  const storedPanicLink = store.get("pLink") || "";

  if (!storedPanicLink) panicLinkDropdown.value = "default";
  else if (panicPresets.includes(storedPanicLink)) panicLinkDropdown.value = storedPanicLink;
  else {
    panicLinkDropdown.value = "custom";
    linkInput.value = storedPanicLink;
  }

  function syncPanicLinkRow() {
    panicLinkCustomRow.style.display = panicLinkDropdown.value === "custom" ? "" : "none";
  }

  panicLinkDropdown.addEventListener("change", () => {
    const choice = panicLinkDropdown.value;
    syncPanicLinkRow();
    if (choice === "default") store.remove("pLink");
    else if (choice === "custom") savePanicLink();
    else store.set("pLink", choice);
  });

  function savePanicLink() {
    const value = linkInput.value.trim();
    if (value) store.set("pLink", value);
    else store.remove("pLink");
  }

  commitOnEnter(linkInput, savePanicLink);
  syncPanicLinkRow();

  const cloakDropdown = document.getElementById("cloak-dropdown");
  const customCloakRow = document.getElementById("custom-cloak-row");
  const customCloakName = document.getElementById("custom-cloak-name");
  const customCloakIcon = document.getElementById("custom-cloak-icon");

  function syncCustomCloakRow() {
    customCloakRow.style.display = cloakDropdown.value === "custom" ? "" : "none";
  }

  cloakDropdown.value = store.get("selectedOption") || "Thesaurus";
  cloakDropdown.addEventListener("change", () => handleDropdownChange(cloakDropdown));

  customCloakName.value = store.get("CustomName") || "";
  customCloakIcon.value = store.get("CustomIcon") || "";
  customCloakName.addEventListener("change", applyCustomCloak);
  customCloakIcon.addEventListener("change", applyCustomCloak);
  syncCustomCloakRow();

  const abSwitch = document.getElementById("ab-settings-switch");
  if (abSwitch) {
    abSwitch.checked = false;
    store.set("ab", "false");
  }

  const shellSwitch = document.getElementById("shell-settings-switch");
  shellSwitch.checked = store.get("shell") === "true";
  shellSwitch.addEventListener("change", function () {
    if (this.checked) store.set("shell", "true");
    else store.remove("shell");
    window.applyShell?.();
  });

  const themeDropdown = document.getElementById("theme-dropdown");
  themeDropdown.value = store.get("theme") || "default";
  themeDropdown.addEventListener("change", function () {
    themeChange(this);
  });

  const bgDropdown = document.getElementById("background-dropdown");
  const gradientRow = document.getElementById("gradient-style-row");
  const gradientDropdown = document.getElementById("gradient-dropdown");
  const bgCustomRow = document.getElementById("background-custom-row");
  const bgInput = document.getElementById("background-input");
  const bgGallery = document.getElementById("background-gallery");
  const bgCustomToggle = document.getElementById("background-custom-toggle");
  const bgRemoveButton = document.getElementById("background-remove-button");
  const bgLoadMore = document.getElementById("background-load-more");
  const bgBlur = document.getElementById("background-blur");
  const bgBlurValue = document.getElementById("background-blur-value");

  const backgroundOptions = Object.entries(window.BACKGROUND_LIBRARY).map(([key, option]) => ({ key, ...option }));
  const initialBackgroundCount = 15;
  let renderedBackgroundCount = 0;

  const savedBg = store.get("backgroundImage");
  const legacyCustom = store.get("backgroundMode") === "custom";
  const savedBgMode = legacyCustom ? "default" : store.get("backgroundMode") || "gradient";
  const storedImageMode = store.get("backgroundImageMode");
  const savedImageMode = legacyCustom || storedImageMode === "custom" ? "custom" : storedImageMode === "all" ? "all" : "none";
  const savedBlur = Math.max(0, Math.min(100, Number(store.get("backgroundBlur")) || 0));

  bgDropdown.value = savedBgMode;
  gradientDropdown.value = store.get("gradientStyle") || "multi";
  bgBlur.value = savedBlur;
bgBlurValue.value = `${savedBlur}%`;
bgBlurValue.textContent = `${savedBlur}%`;
  bgCustomRow.dataset.open = savedImageMode === "custom" ? "true" : "false";
  if (savedImageMode === "custom") bgInput.value = savedBg && savedBg !== "none" ? savedBg : "";

  function applyBackgroundImage() {
    const mode = store.get("backgroundImageMode");
    const url = mode === "custom" ? bgInput.value.trim() : mode === "all" ? backgroundUrlFor(store.get("backgroundKey")) : "";
    bgCustomRow.style.display = bgCustomRow.dataset.open === "true" ? "" : "none";
    if (url) {
      document.body.dataset.customBackground = "true";
      document.body.style.setProperty("--custom-background-image", url('${url}'));
    } else {
      delete document.body.dataset.customBackground;
      document.body.style.removeProperty("--custom-background-image");
    }
    for (const option of bgGallery.querySelectorAll(".bg-option")) {
      option.classList.toggle("active", mode === "all" && option.dataset.key === store.get("backgroundKey"));
    }
  }

  function renderBackgroundOptions() {
    const nextCount = Math.min(renderedBackgroundCount + initialBackgroundCount, backgroundOptions.length);
    for (const option of backgroundOptions.slice(renderedBackgroundCount, nextCount)) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "bg-option";
      button.dataset.key = option.key;
      button.setAttribute("aria-label", "Use " + option.label + " background");

      const preview = document.createElement("img");
      preview.className = "bg-option-preview";
preview.src = option.url;
preview.loading = "lazy";
preview.alt = "";
const label = document.createElement("span");
label.className = "bg-option-label";
label.textContent = option.label;
button.append(preview, label);
button.addEventListener("click", () => {
bgCustomRow.dataset.open = "false";
if (store.get("backgroundImageMode") === "all" && store.get("backgroundKey") === option.key) {
store.remove("backgroundKey");
store.set("backgroundImageMode", "none");
} else {
store.set("backgroundKey", option.key);
store.set("backgroundImageMode", "all");
}
applyBackgroundImage();
});
bgGallery.appendChild(button);
}
renderedBackgroundCount = nextCount;
bgLoadMore.style.display = renderedBackgroundCount < backgroundOptions.length ? "" : "none";
}
function applyBackground() {
const mode = bgDropdown.value;
gradientRow.style.display = mode === "gradient" ? "" : "none";
if (mode === "gradient") {
document.body.dataset.background = "gradient";
document.body.dataset.gradient = gradientDropdown.value;
} else if (mode === "none") {
document.body.dataset.background = "solid";
delete document.body.dataset.gradient;
} else {
delete document.body.dataset.background;
delete document.body.dataset.gradient;
}
}
bgDropdown.addEventListener("change", () => {
store.set("backgroundMode", bgDropdown.value);
applyBackground();
});
gradientDropdown.addEventListener("change", () => {
store.set("gradientStyle", gradientDropdown.value);
applyBackground();
});
bgCustomToggle.addEventListener("click", () => {
const open = bgCustomRow.dataset.open === "true";
bgCustomRow.dataset.open = open ? "false" : "true";
bgCustomRow.style.display = open ? "none" : "";
if (!open) bgInput.focus();
});
bgRemoveButton.addEventListener("click", () => {
bgCustomRow.dataset.open = "false";
store.remove("backgroundImage");
store.remove("backgroundKey");
store.set("backgroundImageMode", "none");
bgInput.value = "";
applyBackgroundImage();
});
bgBlur.addEventListener("input", () => {
store.set("backgroundBlur", bgBlur.value);
bgBlurValue.value = `${bgBlur.value}%`;
bgBlurValue.value = `${bgBlur.value}%`;
bgBlurValue.textContent = `${bgBlur.value}%`;
});
document.getElementById("save-button").addEventListener("click", () => {
const url = bgInput.value.trim();
if (!url) return;
store.set("backgroundImage", url);
store.set("backgroundImageMode", "custom");
bgCustomRow.dataset.open = "false";
applyBackgroundImage();
});
bgLoadMore.addEventListener("click", renderBackgroundOptions);
renderBackgroundOptions();
document.body.style.setProperty("--background-blur", savedBlur);
applyBackground();
applyBackgroundImage();
const particlesDropdown = document.getElementById("particles-dropdown");
const savedParticles = store.get("particles");
const shimmerPatterns = ["grid", "wiggle", "wiggle-grid", "starfield", "twist", "displace", "shimmer", "organic", "shimmer-aurora", "morph", "meteors"];
const savedParticleMode = savedParticles;
const particlesCustomToggle = document.getElementById("particles-custom-toggle");
const particlesCustomPanel = document.getElementById("particles-custom-panel");
const particlesCustomFields = document.getElementById("particles-custom-fields");
const particleControlSets = {
grid: [
["gap", "Gap", 4, 80, 1, 32],
["size", "Size", 0.5, 8, 0.1, 3.5],
["speed", "Speed", 0, 100, 1, 49],
["opacity", "Opacity", 0, 1, 0.05, 1],
],
wiggle: [
["count", "Count", 50, 800, 1, 400],
["sizeRange", "Size range", 0.1, 4, 0.1, 0.85],
["speed", "Speed", 0.05, 3, 0.05, 0.6],
["twinkle", "Twinkle", 0.1, 8, 0.1, 3.45],
["drift", "Drift", 0, 60, 1, 28],
["opacity", "Opacity", 0, 1, 0.05, 1],
],
starfield: [
["count", "Count", 50, 800, 1, 300],
["seed", "Seed", 0, 99999, 1, 12345],
["size", "Size", 0.1, 4, 0.1, 1],
["duration", "Duration", 100, 10000, 50, 4200],
["faded", "Faded", 0, 1, 0.05, 0.03],
["opacity", "Opacity", 0, 1, 0.05, 1],
],
twist: [
["gap", "Gap", 4, 50, 1, 13],
["size", "Size", 0.2, 5, 0.1, 1.5],
["peak", "Peak", 0, 2, 0.05, 1],
["zoom", "Zoom", 1, 120, 1, 60],
["twist", "Twist", 0.25, 5, 0.05, 1.5],
["arms", "Arms", 1, 8, 1, 2],
["spin", "Spin", 0, 2, 0.05, 0.42],
["drift", "Drift", 0, 500, 5, 270],
["width", "Width", 0.5, 12, 0.5, 6],
["floor", "Floor", 0, 1, 0.05, 0],
["opacity", "Opacity", 0, 1, 0.05, 1],
],
displace: [
["count", "Count", 50, 600, 1, 260],
["emission", "Emission", 1, 60, 1, 20],
["size", "Size", 0.1, 8, 0.1, 3.3],
["speed", "Speed", 1, 120, 1, 50],
["lifetime", "Lifetime", 1, 30, 0.5, 11],
["drift", "Drift", 0, 40, 1, 10],
["forceRadius", "Force radius", 20, 300, 5, 120],
["force", "Force", 0, 1000, 10, 470],
["friction", "Friction", 0.5, 0.99, 0.01, 0.92],
["opacity", "Opacity", 0, 1, 0.05, 1],
],
shimmer: [
["spacing", "Spacing", 4, 60, 1, 22],
["size", "Size", 0.5, 8, 0.1, 3.5],
["speed", "Speed", 0, 6, 0.05, 2.6],
["waveX", "Wave X", 0, 1, 0.01, 0.25],
["waveY", "Wave Y", 0, 1, 0.01, 0.21],
["base", "Base", 0, 1, 0.01, 0.2],
["intensity", "Intensity", 0, 6, 0.05, 3.4],
["opacity", "Opacity", 0, 1, 0.05, 1],
],
organic: null,
"shimmer-aurora": null,
morph: null,
meteors: [
["count", "Count", 1, 12, 1, 3],
["angle", "Angle", -180, 180, 1, 20],
["speed", "Speed", 50, 1200, 10, 500],
["lifespan", "Lifespan", 0.05, 1, 0.05, 0.7],
["fadeSpeed", "Fade out speed", 0.02, 1, 0.02, 0.2],
["length", "Length", 20, 500, 5, 240],
["width", "Width", 0.5, 8, 0.5, 2],
["delay", "Delay", 0, 20, 0.5, 5],
],
};
const fieldControls = [
["speed", "Speed", 0, 3, 0.05, 1],
["brightness", "Brightness", 0, 2, 0.05, 1],
["dotSize", "Dot size", 0.1, 4, 0.05, 1],
["density", "Density", 0.25, 3, 0.05, 1],
["scale", "Scale", 0.25, 4, 0.05, 1],
["vignette", "Vignette", 0, 2, 0.05, 1],
["opacity", "Opacity", 0, 1, 0.05, 1],
];
particleControlSets.organic = fieldControls;
particleControlSets["shimmer-aurora"] = fieldControls;
particleControlSets.morph = fieldControls;
particlesDropdown.value = savedParticleMode === "false" ? "off" : ["smoke", ...shimmerPatterns].includes(savedParticleMode) ? savedParticleMode : "on";
particlesDropdown.addEventListener("change", function () {
const mode = this.value === "off" ? "false" : this.value;
store.set("particles", mode);
if (shimmerPatterns.includes(mode)) {
store.set("shimmerPattern", mode);
renderParticleControls(mode);
} else {
particlesCustomPanel.style.display = "none";
}
});
function renderParticleControls(mode) {
particlesCustomFields.replaceChildren();
const controls = particleControlSets[mode];
if (!controls) {
particlesCustomPanel.style.display = "none";
return;
}
for (const [key, label, min, max, step, fallback] of controls) {
const id = particle-${mode}-${key}.replace(/[^a-z0-9-]/gi, "-");
const storageKey = particle_${mode}_${key};
const rawValue = store.get(storageKey);
const storedValue = Number(rawValue);
const value = rawValue !== undefined && rawValue !== null && rawValue !== "" && Number.isFinite(storedValue) ? storedValue : fallback;
const labelElement = document.createElement("label");
labelElement.htmlFor = id;
labelElement.textContent = label + " ";
const output = document.createElement("output");
output.id = ${id}-value;
output.textContent = value;
labelElement.appendChild(output);
const input = document.createElement("input");
input.id = id;
input.type = "range";
input.min = min;
input.max = max;
input.step = step;
input.value = value;
input.addEventListener("input", () => {
const nextValue = Number(input.value);
output.textContent = input.value;
store.set(storageKey, input.value);
window.updateShimmeringDots?.({ [key]: nextValue });
});
particlesCustomFields.append(labelElement, input);
}
particlesCustomPanel.style.display = "";
}
const initialParticleMode = shimmerPatterns.includes(savedParticleMode) ? savedParticleMode : "grid";
renderParticleControls(initialParticleMode);
particlesCustomPanel.style.display = shimmerPatterns.includes(savedParticleMode) && store.get("shimmerControlsOpen") === "true" ? "" : "none";
particlesCustomToggle.addEventListener("click", () => {
const open = particlesCustomPanel.style.display !== "none";
particlesCustomPanel.style.display = open ? "none" : "";
store.set("shimmerControlsOpen", open ? "false" : "true");
});
const tabsLayoutDropdown = document.getElementById("tabs-layout-dropdown");
tabsLayoutDropdown.value = store.get("tabsLayout") === "vertical" ? "vertical" : "horizontal";
tabsLayoutDropdown.addEventListener("change", () => store.set("tabsLayout", tabsLayoutDropdown.value));
const pointerTrailDropdown = document.getElementById("pointer-trail-dropdown");
const pointerCustomDropdown = document.getElementById("pointer-custom-dropdown");
const pointerIdleMotion = document.getElementById("pointer-idle-motion");
const pointerClickEffectDropdown = document.getElementById("pointer-click-effect-dropdown");
const legacyPointer = store.get("pointer");
const trailPointers = [
"rainbow-trail",
"rainbow-stars",
"white-orbs",
"blue-orbs-trail",
"curly-cursor",
"rainbow-ribbon",
"fairy-dust",
"echo-trail",
"chasing-cursors",
"dot-trail",
"bubble-trail",
"snowflake-trail",
"afterglow",
"magnetic-trail",
"color-trail",
"falling-stars",
"tubes-trail",
"pixel-cursor",
"pixel-trail",
"pixel-reveal",
"drawing-trail",
"tidal-trail",
"fluid-trail",
"particle-dots",
];
const customPointers = ["blue-orbs-cursor", "the-sims", "magnetic-cursor", "spring-cursor", "inverted-cursor", "spotlight-cursor", "spring-squash"];
const savedTrail = store.get("pointerTrail");
const savedCustom = store.get("pointerCustom");
const trailValue = trailPointers.includes(savedTrail) ? savedTrail : savedCustom === "blue-orbs" ? "blue-orbs-trail" : trailPointers.includes(legacyPointer) ? legacyPointer : "default";
const customValue = customPointers.includes(savedCustom) ? savedCustom : savedCustom === "blue-orbs" ? "blue-orbs-cursor" : customPointers.includes(legacyPointer) ? legacyPointer : "default";
pointerTrailDropdown.value = trailValue;
pointerCustomDropdown.value = customValue;
pointerIdleMotion.checked = store.get("pointerIdleMotion") === "true";
const clickEffectByPointer = {
"rainbow-trail": "rainbow-trail",
"white-orbs": "white-orbs",
"blue-orbs-cursor": "blue-orbs-cursor",
"the-sims": "the-sims",
afterglow: "afterglow",
"magnetic-trail": "magnetic-trail",
"magnetic-cursor": "magnetic-cursor",
"color-trail": "color-trail",
"falling-stars": "falling-stars",
};
pointerClickEffectDropdown.value = store.get("pointerClickEffect") || clickEffectByPointer[customValue] || clickEffectByPointer[trailValue] || "none";
function savePointerSetting(key, value) {
if ((value === "default" || value === "false") && key !== "pointerClickEffect") {
store.remove(key);
} else {
store.set(key, value);
}
store.remove("pointer");
window.applyCursorEffects?.();
}
pointerTrailDropdown.addEventListener("change", function () {
const effect = clickEffectByPointer[this.value] || clickEffectByPointer[store.get("pointerCustom")] || "none";
store.set("pointerClickEffect", effect);
savePointerSetting("pointerTrail", this.value);
});
pointerCustomDropdown.addEventListener("change", function () {
const effect = clickEffectByPointer[this.value] || clickEffectByPointer[store.get("pointerTrail")] || "none";
store.set("pointerClickEffect", effect);
savePointerSetting("pointerCustom", this.value);
});
pointerIdleMotion.addEventListener("change", function () {
savePointerSetting("pointerIdleMotion", this.checked ? "true" : "false");
});
pointerClickEffectDropdown.addEventListener("change", function () {
savePointerSetting("pointerClickEffect", this.value);
});
document.getElementById("engine").addEventListener("change", function () {
changeEngine(this);
});
const engineForm = document.getElementById("engine-form");
engineForm.addEventListener("keydown", event => {
if (event.key !== "Enter") return;
event.preventDefault();
saveCustomEngine();
});
const savedEngineName = store.get("enginename");
if (savedEngineName) document.getElementById("engine").value = savedEngineName;
if (savedEngineName === "Custom") engineForm.value = store.get("engine") || "";
document.getElementById("engine-custom-row").style.display = document.getElementById("engine").value === "Custom" ? "" : "none";
});
// A comprehensive list of tab-cloaking configurations containing titles and favicon assets
// for popular educational, utility, and reference platforms can be found in the full source script.
const cloakOptions = {
Google: { name: "Google", icon: "/assets/media/favicon/google.png" },
Thesaurus: { name: "Synonyms and Antonyms of Words | Thesaurus.com", icon: "/assets/media/favicon/thesaurus.png" },
// ...see full script for remaining educational and utility options
};
