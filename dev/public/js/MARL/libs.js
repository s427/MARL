const isFileProtocol = window.location.protocol === "file:";

const scripts = {
  jszip: {
    src: "js/libs/jszip.min.js",
    integrity: "sha512-XMVd28F1oH/O71fzwBnV7HucLxVwtxf26XV8P4wPk26EDxuGZ91N8bsOttmnomcCD3CS5ZMRL50H0GgOHvegtg==",
    crossorigin: "anonymous",
    defer: false,
  },
  "alpine-i18n": {
    src: "js/libs/alpinejs-i18n.min.js",
    integrity: "sha256-o204NcFyHPFzboSC51fufMqFe2KJdQfSCl8AlvSZO/E=",
    crossorigin: "anonymous",
    defer: true,
  },
  alpine: {
    src: "js/libs/alpinejs.min.js",
    integrity: "sha512-FUaEyIgi9bspXaH6hUadCwBLxKwdH7CW24riiOqA5p8hTNR/RCLv9UpAILKwqs2AN5WtKB52CqbiePBei3qjKg==",
    crossorigin: "anonymous",
    defer: true,
  },
};

function loadScript(scriptName) {
  const s = scripts[scriptName];

  const script = document.createElement("script");
  script.src = s.src;
  if (!isFileProtocol) {
    script.integrity = s.integrity;
    script.crossOrigin = s.crossorigin;
  }
  if (s.defer) {
    script.defer = true;
  }
  document.head.appendChild(script);
}
