// @ts-check
import { defineConfig } from "astro/config";

import relativeLinks from "astro-relative-links";

import compress from "astro-compress";

// https://astro.build/config
export default defineConfig({
  integrations: [
    relativeLinks(),
    compress({
      Exclude: ["alpinejs-i18n.min.js", "alpinejs.min.js", "jszip.min.js", "config.js", "config.default.js"],
    }),
  ],
  outDir: "../dist",
});
