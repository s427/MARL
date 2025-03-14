// Note: Alpine plug-ins must be inserted BEFORE alpinejs
loadScript("alpine-i18n");
loadScript("alpine");

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
  marlConsole(`MARL loaded. ${salutations[Math.floor(Math.random() * salutations.length)]} 😊`);

  resetStores();
  setMarlMode();
});

// i18n

document.addEventListener("alpine-i18n:ready", function () {
  AlpineI18n.create("en", appStrings);
  AlpineI18n.fallbackLocale = "en";
  setLang();
});
