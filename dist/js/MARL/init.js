drag.init("app");

document.addEventListener("alpine:init", () => {
  // create and init stores
  Alpine.store("files", filesStore);
  Alpine.store("lightbox", lightboxStore);
  Alpine.store("ui", uiStore);
  Alpine.store("userPrefs", userPrefsStore);

  const salutations = [
    "Hi!",
    "Hiya!",
    "Hello there!",
    "Good day!",
    "Hullo!",
    "Buongiorno!",
    "Guten Tag!",
    "Bonjour!",
    "Oh hey!",
  ];
  Alpine.store("ui").logMsg(`MARL loaded. ${salutations[Math.floor(Math.random() * salutations.length)]} 😊`);

  resetStores();
});

// i18n

let appStrings = {};

for (const lang in appLangs) {
  const script = document.createElement("script");
  script.src = `js/i18n/${lang}.js`;
  document.head.appendChild(script);
}

document.addEventListener("alpine-i18n:ready", function () {
  AlpineI18n.create("en", appStrings);
  AlpineI18n.fallbackLocale = "en";
  setLang();
});
