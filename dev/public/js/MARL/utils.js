function customPrefsAvailable() {
  return (
    typeof customPrefs !== "undefined" &&
    typeof customPrefs === "object" &&
    !Array.isArray(customPrefs) &&
    customPrefs !== null
  );
}

function customPrefAvailable(pref) {
  if (customPrefsAvailable() && pref && customPrefs[pref]) {
    return true;
  }
  return false;
}

function loadCustomPrefs() {
  if (customPrefsAvailable()) {
    marlConsole(`Loading custom preferences. <b>${JSON.stringify(customPrefs)}</b>`);
    for (const pref in customPrefs) {
      if (Object.prototype.hasOwnProperty.call(customPrefs, pref)) {
        const val = customPrefs[pref];
        Alpine.store("ui").changeDefault(pref, val);
      }
    }
  }
}

function resetStores() {
  Alpine.store("files").resetState();
  Alpine.store("lightbox").resetState();
  Alpine.store("ui").resetState();
}

function zipFileAlreadyLoaded(file) {
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
    marlConsole(msg, "warn");
    return true;
  } else {
    return false;
  }
}

function serverMode() {
  return Alpine.store("files").serverMode;
}

function localMode() {
  return !Alpine.store("files").serverMode;
}

function checkMobileLayout() {
  // called on init and window.resize
  const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);

  if (vw < 1200) {
    Alpine.store("ui").mobileLayout = true;
  } else {
    Alpine.store("ui").mobileLayout = false;
  }
}

function mobileLayout() {
  return Alpine.store("ui").mobileLayout;
}

function desktopLayout() {
  return !Alpine.store("ui").mobileLayout;
}

function combinedPanelsMode() {
  return Alpine.store("ui").combinePanels && desktopLayout();
}

function appReady() {
  return Alpine.store("files").appReady;
}

function marlBasePath() {
  let r = Alpine.store("files").marlBasePath;

  if (r === "") {
    r = location.href;
    if (r.indexOf("index.html") > -1) {
      r = r.slice(0, r.indexOf("index.html"));
    }
    if (r.slice(-1) !== "/") {
      r = r + "/";
    }
    Alpine.store("files").marlBasePath = r;
  }

  return r;
}

function savePref(pref, value) {
  Alpine.store("userPrefs").save(pref, value);
}

function loadPref(pref) {
  Alpine.store("userPrefs").load(pref);
}

function preprocessToots(t, index) {
  // build the '_marl' prop for each toot
  let marl = {
    langs: [],
    date: "", // int, eg. 20250430
    time: "", // int, eg. 935
    source: index,
    replies: [],
    inReplyTo: null,
  };

  const date = new Date(t.published);
  marl.date = +date.toISOString().slice(0, 10).replace(/-/g, "");

  if (!Alpine.store("files").date.first || date < Alpine.store("files").date.first) {
    Alpine.store("files").date.first = date;
  }
  if (!Alpine.store("files").date.last || date > Alpine.store("files").date.last) {
    Alpine.store("files").date.last = date;
  }

  let hour = "" + date.getHours();
  if (hour < 10) {
    hour = "0" + hour;
  }
  let min = "" + date.getMinutes();
  if (min < 10) {
    min = "0" + min;
  }
  marl.time = +(hour + min);

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
        Alpine.store("files").activeFilters.isDuplicate = true;
      }
    });
    if (identical) {
      return false;
    }
  } else {
    Alpine.store("files").toc.push(t.id);
  }

  if (t.type === "Announce") {
    Alpine.store("files").activeFilters.typeBoost = true;
  }

  if (t.type === "Create") {
    Alpine.store("files").activeFilters.typeOriginal = true;
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

      if (marl.externalLinks.length) {
        Alpine.store("files").activeFilters.hasExternalLink = true;
      }
    }

    if (t.object.likes && t.object.likes.totalItems > 0) {
      Alpine.store("files").activeFilters.hasLikes = true;
    }

    if (t.object.shares && t.object.shares.totalItems > 0) {
      Alpine.store("files").activeFilters.hasShares = true;
    }

    if (t.object.sensitive) {
      Alpine.store("files").activeFilters.isSensitive = true;
    }

    if (t.object.updated) {
      Alpine.store("files").activeFilters.isEdited = true;
    }

    if (t.object.summary) {
      marl.summary = t.object.summary.toLowerCase();
      Alpine.store("files").activeFilters.hasSummary = true;
    }

    if (t.object.attachment && t.object.attachment.length) {
      marl.hasAttachments = true;
      Alpine.store("files").activeFilters.attachmentNoAltText = true;
      Alpine.store("files").activeFilters.attachmentWithAltText = true;

      for (let i = 0; i < t.object.attachment.length; i++) {
        let att = t.object.attachment[i];
        let url = att.url;
        // ?! some instances seem to add their own name in front of the path,
        // resulting in an invalid path with relation to the archive
        // structure (e.g. "/framapiaf/media_attachments/...", but in the
        // archive there is only a folder "/media_attachments")
        // => So we remove everything that comes before "media_attachments/",
        // hoping it doesn't break something else... :/
        const prefix = url.indexOf("media_attachments/");
        if (prefix > 0) {
          t.object.attachment[i].url0 = url;
          t.object.attachment[i].url = url.slice(prefix);
        }

        if (attachmentIsImage(att)) {
          Alpine.store("files").activeFilters.attachmentImage = true;
        }
        if (attachmentIsVideo(att)) {
          Alpine.store("files").activeFilters.attachmentVideo = true;
        }
        if (attachmentIsSound(att)) {
          Alpine.store("files").activeFilters.attachmentSound = true;
        }
      }
    }

    if (t.object.inReplyTo) {
      marl.inReplyTo = t.object.inReplyTo;
    }

    if (tootHasTags(t)) {
      // we normalize usernames (always "@username@domain.tld") in case we deal with
      // multiple archives from different instances referencing the same user.
      // (users local to the source instance will only be refered to as "@username")
      for (let i = 0; i < t.object.tag.length; i++) {
        const tag = t.object.tag[i];
        if (tag.type === "Mention" && (tag.name.match(/@/g) || []).length === 1) {
          const host = tag.href.split("/");
          if (host[2]) {
            t.object.tag[i].name += "@" + host[2];
          }
        }
      }
    }

    if (t.object.type === "Question") {
      Alpine.store("files").activeFilters.hasPoll = true;
      if (t.object.oneOf) {
        marl.pollType = "oneOf";
      } else if (t.object.anyOf) {
        marl.pollType = "anyOf";
      }

      marl.totalVotes = 0;
      for (const item of t.object[marl.pollType]) {
        marl.totalVotes += item.replies.totalItems;
      }
    }
  } else if (t.object) {
    marl.textContent = t.object.toLowerCase();
  }

  marl.visibility = tootVisibility(t);
  switch (marl.visibility[0]) {
    case "public":
      Alpine.store("files").activeFilters.visibilityPublic = true;
      break;
    case "unlisted":
      Alpine.store("files").activeFilters.visibilityUnlisted = true;
      break;
    case "followers":
      Alpine.store("files").activeFilters.visibilityFollowers = true;
      break;
    case "mentioned":
      Alpine.store("files").activeFilters.visibilityMentioned = true;
      break;
  }

  const id = t.id.split("/");
  marl.id = id[id.length - 2];

  t._marl = marl;
  return t;
}

function buildTootsInfos() {
  let langs = {};
  let boosts = [];
  let hasReplies = false;
  const toots = Alpine.store("files").toots;

  if (toots.length > 0) {
    let infos = toots.reduce(
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

        if (typeof toot.object === "object" && toot.object !== null && toot.object.inReplyTo) {
          if (!accu.replies[toot.object.inReplyTo]) {
            accu.replies[toot.object.inReplyTo] = [];
          }
          accu.replies[toot.object.inReplyTo].push(toot.object.id);
          hasReplies = true;
        }

        return accu;
      },
      { langs: {}, boosts: {}, replies: {} }
    ); // reduce

    langs = infos.langs;

    if (hasReplies) {
      Alpine.store("files").activeFilters.isInConversation = true;

      for (let i = 0; i < toots.length; i++) {
        const t = toots[i];
        // does the post have replies
        if (typeof t.object === "object" && t.object !== null && t.object.id) {
          if (infos.replies[t.object.id]) {
            Alpine.store("files").toots[i]._marl.replies = infos.replies[t.object.id];
          }
        }

        // is the post a reply; and is the parent available (in the archive)
        if (t._marl.inReplyTo) {
          const parentId = t._marl.inReplyTo;
          const parents = toots.filter((t) => t.object.id === parentId);
          if (parents.length === 0) {
            Alpine.store("files").toots[i]._marl.inReplyTo = null;
          }
        }
      }
    }

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

  if (
    [
      Alpine.store("files").activeFilters.attachmentImage,
      Alpine.store("files").activeFilters.attachmentVideo,
      Alpine.store("files").activeFilters.attachmentSound,
    ].filter(Boolean).length > 1
  ) {
    Alpine.store("files").activeFilters.attachmentAny = true;
  }

  Alpine.store("files").resetFilters(false);
}

function buildLikesBookmarks() {
  const types = ["likes", "bookmarks"];

  for (const source of Alpine.store("files").sources) {
    for (const type of types) {
      if (source[type].data.length) {
        const list = source[type].data;
        let list2 = [];
        for (let i = 0; i < list.length; i++) {
          const url = list[i];
          list2.push({
            url: url,
            inArchive: Alpine.store("files").toots.some((t) => t.id.indexOf(url) === 0),
          });
        }

        Alpine.store("files").sources[source.id][type].data = list2;
      }
    }
  }
}

function checkAppReady(ok) {
  if (ok) {
    document.getElementById("main-section").focus();
    Alpine.store("ui").setInert();
    Alpine.store("files").sortToots();
  }
}

function cleanUpRaw() {
  if (serverMode()) {
    return;
  }

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

function setHueForSources() {
  const nbSources = Alpine.store("files").sources.length;
  const hueStart = Math.round(Math.random() * 360); // MARL accent: 59.17
  const hueSpacing = Math.round(360 / nbSources);

  for (let i = 0; i < nbSources; i++) {
    Alpine.store("files").sources[i].hue = hueStart + hueSpacing * i;
  }
}

function loadAttachedMedia(att, index) {
  if (serverMode()) {
    return;
  }
  if (attachmentIsImage(att) || attachmentIsVideo(att) || attachmentIsSound(att)) {
    const data = Alpine.store("files").sources[index]._raw;
    const root = Alpine.store("files").sources[index].fileInfos.archiveRoot;
    let url = att.url;
    if (!data[root + url]) {
      // media not found in archive
      // we still want to show the metadata for the attachement
      Alpine.store("files").sources[index][att.url] = {
        type: att.mediaType,
        content: null,
      };
      return;
    } else {
      data[root + url].async("base64").then((content) => {
        Alpine.store("files").sources[index][att.url] = {
          type: att.mediaType,
          content: content,
        };
      });
    }
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
  if (r._marl && !(customPrefAvailable("showMarlJson") && customPrefs.showMarlJson)) {
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
  if (typeof nb === "undefined") {
    return "";
  }
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

function pollQuestionPc(toot, i) {
  const pollData = toot.object[toot._marl.pollType];
  pc = (pollData[i].replies.totalItems / toot.object.votersCount) * 100;
  return pc ? pc : 0;
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
  if (customPrefAvailable("lang") && validLang(customPrefs.lang)) {
    return customPrefs.lang;
  }

  const langs = navigator.languages;
  if (langs && langs.length) {
    for (let i = 0; i < langs.length; i++) {
      let lang = langs[i].split("-")[0];
      if (validLang(lang)) {
        const msg = `Setting language based on browser preference: <b>'${lang}' (${
          Alpine.store("ui").appLangs[lang]
        })</b>`;
        marlConsole(msg, "info");
        return lang;
      }
    }
  }
  return false;
}

function setLang() {
  const lang = Alpine.store("ui").lang;
  AlpineI18n.locale = lang;
  savePref("lang", lang);
  document.getElementsByTagName("html")[0].setAttribute("lang", lang);

  const msg = `App language set to <b>'${lang}' (${Alpine.store("ui").appLangs[lang]})</b>`;
  marlConsole(msg);
}

function detectThemePreference() {
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  } else {
    return "light";
  }
}

function setTheme(theme) {
  if (!theme) {
    theme = detectThemePreference();
  }

  document.getElementsByTagName("html")[0].setAttribute("class", theme);
  if (theme === "dark") {
    document.querySelector('meta[name="color-scheme"]').setAttribute("content", "dark");
  } else {
    document.querySelector('meta[name="color-scheme"]').setAttribute("content", "light");
  }
}

function marlConsole(msg, cls = "info") {
  // classes: "info", "warn", "error"
  Alpine.store("ui").logMsg(msg, cls);
}

function validPanel(name) {
  const panels = ["actor", "filters", "tags", "tools"];
  return panels.includes(name);
}

function validTheme(name) {
  const themes = ["light", "dark"];
  return themes.includes(name);
}

function validLang(name) {
  if (appLangs[name]) {
    return true;
  } else {
    return false;
  }
}

function postsScrolled() {
  Alpine.store("ui").checkPostsScrolling();
  setTimeout(() => {
    Alpine.store("ui").checkPostsScrolling();
  }, 200);
}

function searchFullText(val) {
  Alpine.store("files").resetFilters(true);
  Alpine.store("files").filters.fullText = val;
  Alpine.store("files").setFilter();
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
    loadZipFiles(files);
  },
};
