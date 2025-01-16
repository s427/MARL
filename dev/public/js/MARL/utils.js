function resetStores() {
  Alpine.store("files").resetState();
  Alpine.store("lightbox").resetState();
  Alpine.store("ui").resetState();
}

function unZip(files) {
  const firstLoad = Alpine.store("files").sources.length === 0;
  if (firstLoad) {
    resetStores();
  }
  Alpine.store("files").loading = true;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    if (
      Alpine.store("files").sources.some((source) => {
        return (
          source.fileInfos.name === file.name &&
          source.fileInfos.size === file.size &&
          source.fileInfos.lastModified === file.lastModified
        );
      })
    ) {
      const msg = `File already loaded: <b>${file.name}</b>`;
      console.warn(msg);
      Alpine.store("ui").logMsg(msg, "warn");
      continue;
    }

    Alpine.store("ui").logMsg(`Loading file: <b>${file.name}</b>`, "info");

    JSZip.loadAsync(file).then(
      (content) => {
        const index = Alpine.store("files").sources.length;
        const fileInfos = {
          name: file.name,
          size: file.size,
          lastModified: file.lastModified,
        };

        Alpine.store("files").sources[index] = {
          id: index,
          fileInfos: fileInfos,
          nbToots: 0,

          actor: {},
          outbox: {},
          likes: [],
          bookmarks: [],
          avatar: {},
          header: {},

          loaded: {
            actor: false,
            avatar: false,
            header: false,
            outbox: false,
            likes: false,
            bookmarks: false,
          },
        };

        Alpine.store("files").sources[index]._raw = content.files;

        loadJsonFile("actor", index, fileInfos);
        loadJsonFile("outbox", index, fileInfos);
        loadJsonFile("likes", index, fileInfos);
        loadJsonFile("bookmarks", index, fileInfos);
      },
      (error) => {
        const msg = `Error loading <b>${file.name}</b>: ${error.message}`;
        console.error(msg);
        Alpine.store("ui").logMsg(msg, "error");
        abortLoading();
      }
    );
  }
}

function abortLoading() {
  Alpine.store("files").loading = false;
}

function loadJsonFile(name, index, fileInfos) {
  const content = Alpine.store("files").sources[index]._raw;

  if (content[name + ".json"] === undefined) {
    if (name === "likes" || name === "bookmarks") {
      // we can still run the app without those files
      const msg = `<b>${fileInfos.name}</b>: File ${name}.json not found in archive.`;
      console.warn(msg);
      Alpine.store("ui").logMsg(msg, "warn");
      Alpine.store("files").sources[index].loaded[name] = true;
    } else {
      // this should NOT happen and will prevent the app from running
      const msg = `<b>Critical error - ${fileInfos.name}</b>: File ${name}.json not found in archive.`;
      console.error(msg);
      Alpine.store("ui").logMsg(msg, "error");
    }
    return;
  }

  content[name + ".json"].async("text").then(function (txt) {
    if (name === "actor") {
      Alpine.store("files").sources[index].actor = JSON.parse(txt);
      loadActorImages(index);
      Alpine.store("files").sources[index].loaded.actor = true;
    } // actor.json

    if (name === "outbox") {
      let data = JSON.parse(txt);

      let toots = data.orderedItems.reduce((accu, t) => {
        let t2 = preprocessToots(t, index);
        if (t2) {
          accu.push(t2);
        }
        return accu;
      }, []);

      Alpine.store("files").toots = Alpine.store("files").toots.concat(toots);
      Alpine.store("files").sources[index].nbToots = toots.length;
      delete data.orderedItems;
      Alpine.store("files").sources[index].outbox = data;
      Alpine.store("files").sources[index].loaded.outbox = true;
    } // outbox.json

    if (name === "likes" || name === "bookmarks") {
      const tmp = JSON.parse(txt);
      Alpine.store("files").sources[index][name] = tmp.orderedItems;
      Alpine.store("files").sources[index].loaded[name] = true;
    } // likes.json || bookmarks.json
  });
}

function buildTootsInfos() {
  let langs = {};
  let boosts = [];

  if (Alpine.store("files").toots.length > 0) {
    let infos = Alpine.store("files").toots.reduce(
      (accu, toot) => {
        for (let lang in toot._marl.langs) {
          const l = toot._marl.langs[lang];
          if (!accu.langs[l]) {
            accu.langs[l] = 1;
          } else {
            accu.langs[l]++;
          }
        }

        if (toot.type === "Announce") {
          // since Mastodon doesn't allow (yet?) cross-origin requests to
          // retrieve post data (for boosts), we try to at least extract the
          // user names for all the boosts contained in the archive

          // [ISSUE] "object" value is a string most of the times, but
          // sometimes it's a complex object similar to type "Create"
          if (typeof toot.object === "object" && toot.object !== null) {
            // let's ignore this case for now...
            // [TODO], but not clear how it should be handled
          } else if (toot.object) {
            // if it's not an object and it has a value, then it's simply a
            // url (string) pointing to the original (boosted) post.
            // [ISSUE] URL format not always consistent... (esp. in the case
            // of non-Mastodon instances) - e.g:
            // https://craftopi.art/objects/[...]
            // https://firefish.city/notes/[...]
            // https://bsky.brid.gy/convert/ap/at://did:plc:[...]/app.bsky.feed.post/[...]
            // -> the user name is not always present in URL
            const url = toot.object.split("/");
            let name;
            let user;
            let domain;
            if (url.length > 2) {
              domain = url[2];

              if (url[0] === "https:" && url[3] === "users" && url[5] === "statuses") {
                // Mastodon URL format -> user name
                name = url[4];
                user = `https://${url[2]}/users/${url[4]}/`;
              } else {
                // other URL format -> domain name
                name = `? ${url[2]}`;
                user = `https://${url[2]}/`;
              }

              if (!accu.boosts[name]) {
                accu.boosts[name] = {
                  nb: 1,
                  name: name,
                  url: user,
                  domain: domain,
                };
              } else {
                accu.boosts[name].nb++;
              }
            }
          }
        }
        return accu;
      },
      { langs: {}, boosts: {} }
    );

    langs = infos.langs;

    boosts = [];
    for (var key in infos.boosts) {
      boosts.push(infos.boosts[key]);
    }
  }

  Alpine.store("files").languages = langs;
  Alpine.store("files").boostsAuthors = boosts;
}

function buildDynamicFilters() {
  for (const lang in Alpine.store("files").languages) {
    Alpine.store("files").filtersDefault["lang_" + lang] = true;
  }

  for (const source of Alpine.store("files").sources) {
    Alpine.store("files").filtersDefault["actor_" + source.id] = true;
  }

  Alpine.store("files").resetFilters(false);
}

function preprocessToots(t, index) {
  // build the '_marl' prop for each toot
  let marl = {
    langs: [],
    source: index,
  };

  // check for duplicates (in case of multiple archive files)
  if (Alpine.store("files").toc.includes(t.id)) {
    const alts = Alpine.store("files").toots.filter((t2) => t2.id === t.id);

    let identical = false;
    const flat1 = JSON.stringify(t);

    alts.forEach((alt) => {
      let alt2 = JSON.parse(JSON.stringify(alt));
      delete alt2._marl;
      const flat2 = JSON.stringify(alt2);

      if (flat1 === flat2) {
        identical = true;
      } else {
        alt._marl.duplicate = true;
        marl.duplicate = true;
        Alpine.store("files").duplicates = true;
      }
    });
    if (identical) {
      return false;
    }
  } else {
    Alpine.store("files").toc.push(t.id);
  }

  if (t.type === "Create") {
    if (typeof t.object === "object" && t.object !== null && t.object.contentMap) {
      let langs = [];
      for (let lang in t.object.contentMap) {
        langs.push(lang);
      }
      marl.langs = langs;
    } else {
      marl.langs = ["undefined"];
    }
  }

  if (typeof t.object === "object" && t.object !== null) {
    if (t.object.content) {
      const content = t.object.content.toLowerCase();
      marl.textContent = stripHTML(content);
      marl.externalLinks = extractExternalLinks(content);
    }
    if (t.object.summary) {
      marl.summary = t.object.summary.toLowerCase();
    }

    if (t.object.attachment && t.object.attachment.length) {
      marl.hasAttachments = true;
    }
  } else if (t.object) {
    marl.textContent = t.object.toLowerCase();
  }

  marl.visibility = tootVisibility(t);

  const id = t.id.split("/");
  marl.id = id[id.length - 2];

  t._marl = marl;
  return t;
}

function loadActorImages(index) {
  const actor = Alpine.store("files").sources[index].actor;
  const content = Alpine.store("files").sources[index]._raw;

  if (actor.icon && actor.icon.type === "Image" && actor.icon.url && content[actor.icon.url]) {
    const image = actor.icon;
    content[image.url].async("base64").then(function (content) {
      Alpine.store("files").sources[index].avatar = {
        type: image.mediaType,
        content: content,
        noImg: false,
      };
      Alpine.store("files").sources[index].loaded.avatar = true;
    });
  } else {
    Alpine.store("files").sources[index].avatar = { noImg: true };
    Alpine.store("files").sources[index].loaded.avatar = true;
  }

  if (actor.image && actor.image.type === "Image" && actor.image.url && content[actor.image.url]) {
    const image = actor.image;
    content[image.url].async("base64").then(function (content) {
      Alpine.store("files").sources[index].header = {
        type: image.mediaType,
        content: content,
        noImg: false,
      };
      Alpine.store("files").sources[index].loaded.header = true;
    });
  } else {
    Alpine.store("files").sources[index].header = { noImg: true };
    Alpine.store("files").sources[index].loaded.header = true;
  }
}

function setHueForSources() {
  const nbSources = Alpine.store("files").sources.length;
  const hueStart = Math.round(Math.random() * 360); // MARL accent: 59.17
  const hueSpacing = Math.round(360 / nbSources);

  for (let i = 0; i < nbSources; i++) {
    Alpine.store("files").sources[i].hue = hueStart + hueSpacing * i;
  }
}

function checkAppReady(ok) {
  if (ok) {
    buildTootsInfos();
    buildDynamicFilters();
    cleanUpRaw();
    setHueForSources();
    document.getElementById("main-section").focus();
    Alpine.store("ui").checkMenuState();
    Alpine.store("files").sortToots();
    Alpine.store("files").loading = false;
    Alpine.store("files").someFilesLoaded = true;
  }
}

function cleanUpRaw() {
  for (let i = 0; i < Alpine.store("files").sources.length; i++) {
    const content = Alpine.store("files").sources[i]._raw;
    if (content.cleanedUp) {
      continue;
    }

    const actor = Alpine.store("files").sources[i].actor;
    if (actor.image && actor.image.url) {
      delete content[actor.image.url];
    }
    if (actor.icon && actor.icon.url) {
      delete content[actor.icon.url];
    }
    delete content["actor.json"];
    delete content["outbox.json"];
    delete content["likes.json"];
    delete content["bookmarks.json"];
    content.cleanedUp = true;

    Alpine.store("files").sources[i]._raw = content;
  }
}

function loadAttachedMedia(att, index) {
  if (attachmentIsImage(att) || attachmentIsVideo(att) || attachmentIsSound(att)) {
    const data = Alpine.store("files").sources[index]._raw;
    let url = att.url;
    // ?! some instances seem to add their own name in front of the path,
    // resulting in an invalid path with relation to the archive
    // structure (e.g. "/framapiaf/media_attachments/...", but in the
    // archive there is only a folder "/media_attachments")
    // => So we remove everything that comes before "media_attachments/",
    // hoping it doesn't break something else... :/
    const prefix = url.indexOf("media_attachments/");
    if (prefix > 0) {
      url = url.slice(prefix);
    }
    if (!data[url]) {
      return;
    }
    data[url].async("base64").then((content) => {
      Alpine.store("files").sources[index][att.url] = {
        type: att.mediaType,
        content: content,
      };
    });
  }
}

function pagingUpdated() {
  document.querySelectorAll(`#toots details[open]`).forEach((e) => {
    e.removeAttribute("open");
  });
}

function scrollTootsToTop(setFocusTo) {
  setTimeout(() => {
    document.getElementById("toots").scrollTop = 0;
    if (setFocusTo) {
      // for keyboard users: we transfer the focus to the corresponding button
      // in the upper paging module; or, in the cases where said button is
      // disabled, we set the focus on the list of posts.
      document.getElementById(setFocusTo).focus();
    }
  }, 50);
}

function contentType(data) {
  let r = "";
  switch (data) {
    case "Create":
      r = "Post";
      break;
    case "Announce":
      r = "Boost";
      break;
  }
  return r;
}

function tootVisibility(data) {
  if (data.to.includes("https://www.w3.org/ns/activitystreams#Public")) {
    return ["public", AlpineI18n.t("filters.visibilityPublic")];
  }
  if (
    data.to.some((x) => x.indexOf("/followers") > -1) &&
    !data.to.includes("https://www.w3.org/ns/activitystreams#Public") &&
    data.cc.includes("https://www.w3.org/ns/activitystreams#Public")
  ) {
    return ["unlisted", AlpineI18n.t("filters.visibilityUnlisted")];
  }
  if (
    data.to.some((x) => x.indexOf("/followers") > -1) &&
    !data.to.includes("https://www.w3.org/ns/activitystreams#Public") &&
    !data.cc.includes("https://www.w3.org/ns/activitystreams#Public")
  ) {
    return ["followers", AlpineI18n.t("filters.visibilityFollowers")];
  }
  if (
    !data.to.some((x) => x.indexOf("/followers") > -1) &&
    !data.to.includes("https://www.w3.org/ns/activitystreams#Public") &&
    !data.cc.includes("https://www.w3.org/ns/activitystreams#Public")
  ) {
    return ["mentioned", AlpineI18n.t("filters.visibilityMentioned")];
  }
}

function tootHasTags(toot) {
  return typeof toot.object === "object" && toot.object !== null && toot.object.tag && toot.object.tag.length;
}

function formatJson(data) {
  let r = data;
  if (r._marl) {
    // not a part of the source data; let's hide it to avoid confusion
    r = JSON.parse(JSON.stringify(data));
    delete r._marl;
  }
  return JSON.stringify(r, null, 4);
}

function formatAuthor(author, plainText) {
  if (plainText) {
    return author.split("/").pop();
  } else {
    return `<a href="${author}" target="_blank">${author.split("/").pop()}</a>`;
  }
}

function formatDateTime(data) {
  let date = new Date(data);
  const dateOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  };
  return date.toLocaleDateString(Alpine.store("ui").lang, dateOptions);
}

function formatFileDateTime(data) {
  let date = new Date(data);
  const dateOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  };
  return date.toLocaleDateString(Alpine.store("ui").lang, dateOptions);
}

function formatFileSize(size) {
  var i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
  return +(size / Math.pow(1024, i)).toFixed(2) * 1 + " " + ["B", "kB", "MB", "GB", "TB"][i]; // ### i18n
}

function formatDate(data) {
  let date = new Date(data);
  const dateOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleDateString(Alpine.store("ui").lang, dateOptions);
}

function formatNumber(nb) {
  return nb.toLocaleString();
}

function formatLikesBookmarks(url) {
  const u = url.split("/");
  u.splice(0, 2);

  // 0 [domain]
  // 1 "users"
  // 2 [username]
  // 3 "statuses"
  // 4 [post id]

  let text = `<span class="url-instance">${u[0]}</span>`;
  if (u[1] === "users" && u[3] === "statuses") {
    text += `<span class="url-actor">${u[2]}</span><span class="url-post-id">${u[4]}</span>`;
  } else {
    u.splice(0, 1);
    text += `<span class="url-post-id">${u.join("/")}</span>`;
  }
  return text;
}

function stripHTML(str) {
  let doc = new DOMParser().parseFromString(str, "text/html");
  return doc.body.textContent || "";
}

function extractExternalLinks(str) {
  const doc = new DOMParser().parseFromString(str, "text/html");
  const nodes = doc.querySelectorAll("a[href]:not(.mention)");
  let links = [];
  nodes.forEach((link) => {
    links.push({
      href: link.href,
      text: link.textContent,
    });
  });
  return links;
}

function attachmentIsImage(att) {
  return att.mediaType === "image/jpeg" || att.mediaType === "image/png";
}

function attachmentIsVideo(att) {
  return att.mediaType === "video/mp4";
}

function attachmentIsSound(att) {
  return att.mediaType === "audio/mpeg";
}

function attachmentWrapperClass(att) {
  let r = [];
  if (attachmentIsImage(att)) {
    r.push("att-img");
  } else if (attachmentIsSound(att)) {
    r.push("att-sound");
  } else if (attachmentIsVideo(att)) {
    r.push("att-video");
  }

  if (!att.name) {
    r.push("no-alt-text");
  }

  return r;
}

function isFilterActive(name) {
  return Alpine.store("files").filters[name] !== Alpine.store("files").filtersDefault[name];
}

function startOver() {
  const txt = AlpineI18n.t("tools.startOverConfirm");
  if (confirm(txt)) {
    location.reload();
  }
}

function detectLangFromBrowser() {
  const langs = navigator.languages;
  if (langs && langs.length) {
    for (let i = 0; i < langs.length; i++) {
      let lang = langs[i].split("-")[0];
      if (Alpine.store("ui").appLangs[lang]) {
        const msg = `Setting language based on browser preference: <b>'${lang}' (${
          Alpine.store("ui").appLangs[lang]
        })</b>`;
        Alpine.store("ui").logMsg(msg, "info");
        return lang;
      }
    }
  }
  return false;
}

function setLang() {
  const lang = Alpine.store("ui").lang;
  AlpineI18n.locale = lang;
  Alpine.store("userPrefs").save("lang", lang);
  document.getElementsByTagName("html")[0].setAttribute("lang", lang);

  const msg = `App language set to <b>'${lang}' (${Alpine.store("ui").appLangs[lang]})</b>`;
  Alpine.store("ui").logMsg(msg);
}

function setTheme(theme) {
  document.getElementsByTagName("html")[0].setAttribute("class", theme);
}

// drag'n'drop over entire page

const drag = {
  el: null,

  init(el) {
    this.dropArea = document.getElementById(el);

    ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
      this.dropArea.addEventListener(eventName, (e) => this.preventDragDefaults(e), false);
    });
    ["dragenter", "dragover"].forEach((eventName) => {
      this.dropArea.addEventListener(eventName, () => this.highlightDrag(), false);
    });
    ["dragleave", "drop"].forEach((eventName) => {
      this.dropArea.addEventListener(eventName, () => this.unhighlightDrag(), false);
    });
    this.dropArea.addEventListener("drop", (e) => this.handleDrop(e), false);
  },

  preventDragDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  },
  highlightDrag() {
    this.dropArea.classList.add("highlight-drag");
  },
  unhighlightDrag() {
    this.dropArea.classList.remove("highlight-drag");
  },
  handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    unZip(files);
  },
};
