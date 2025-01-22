const appLangs = {
  en: "English",
  fr: "Français",
};

for (const lang in appLangs) {
  const script = document.createElement("script");
  script.src = `js/i18n/${lang}.js`;
  document.head.appendChild(script);
}
