const userPrefsStore = {
  prefix: "marl_",

  save(pref, value) {
    const msg = `Saving user preference <b>(${pref}: ${value})</b>`;
    marlConsole(msg, "info");
    localStorage.setItem(this.prefix + pref, value);
  },
  load(pref) {
    const value = localStorage.getItem(this.prefix + pref);
    if (value !== null) {
      this.set(pref, value);
    } else if (pref === "lang") {
      this.set(pref, value);
    }
  },
  set(pref, value) {
    switch (pref) {
      case "sortAsc":
        value = +value === 1 ? true : false;
        if (value !== Alpine.store("files").sortAsc) {
          Alpine.store("files").sortAsc = value;
        }
        break;

      case "pageSize":
        value = +value;
        if (typeof value == "number" && !isNaN(value) && value > 0 && value !== Alpine.store("files").pageSize) {
          Alpine.store("files").pageSize = value;
        }
        break;

      case "lang":
        if (!value) {
          value = detectLangFromBrowser();
          if (value) {
            this.save("lang", value);
          }
        }
        if (!value || !Alpine.store("ui").appLangs[value]) {
          if (value) {
            const msg = `<b>Unrecognized language</b> in user preferences: ${value}`;
            console.warn(msg);
            marlConsole(msg, "warn");
          }
          value = "en";
          this.save("lang", value);
        }
        Alpine.store("ui").lang = value;
        break;

      case "theme":
        if (!(value === "dark" || value === "light")) {
          value = "light";
          this.save("theme", value);
        }
        Alpine.store("ui").theme = value;
        setTheme(value);
        break;
    }
  },
};

const filesStore = {
  resetState() {
    this.loadingQueue = [];
    this.currentlyLoading = {};
    this.currentlyLoadingId = "";
    this.currentlyLoadingName = "";

    this.serverMode = false;
    this.remotes = [];
    this.marlBasePath = "";

    this.sources = [];
    this.toots = [];
    this.toc = [];
    this.duplicates = false;

    this.sortAsc = true; // -> userPrefs
    this.pageSize = 10; // -> userPrefs
    this.currentPage = 1;

    this.loading = false;
    this.loadingFailed = false;

    this.languages = {};
    this.boostsAuthors = [];

    this.filters = {};
    this.filtersDefault = {
      fullText: "",
      hashtagText: "",
      mentionText: "",
      externalLink: "",
      summary: "",
      isEdited: false,
      isDuplicate: false,
      noStartingAt: false,
      hasExternalLink: false,
      hasHashtags: false,
      hasMentions: false,
      hasSummary: false,
      isSensitive: false,
      visibilityPublic: true,
      visibilityUnlisted: true,
      visibilityFollowers: true,
      visibilityMentioned: true,
      typeOriginal: true,
      typeBoost: true,
      attachmentAny: false,
      attachmentImage: false,
      attachmentVideo: false,
      attachmentSound: false,
      attachmentNoAltText: false,
      attachmentWithAltText: false,

      // automatically generated (see unpackJsonFile()):
      // lang_en: true,
      // lang_fr: true,
      // lang_de: true,
      // etc
      // actor_0: true,
      // actor_1: true,
      // actor_2: true,
      // etc
    };
    this.filtersActive = false;

    this.tagsFilters = {
      hashtags: "",
      mentions: "",
      boostsAuthors: "",
    };

    Alpine.store("userPrefs").load("sortAsc");
    Alpine.store("userPrefs").load("pageSize");
  },

  setFilter() {
    this.checkPagingValue();
    scrollTootsToTop();
    pagingUpdated();
    if (JSON.stringify(this.filters) === JSON.stringify(this.filtersDefault)) {
      this.filtersActive = false;
    } else {
      this.filtersActive = true;
    }

    const self = this;
    setTimeout(() => {
      self.checkPagingValue();
    }, 50);
  },
  filterByTag(filter, value, id) {
    if (value) {
      if (value === this.filters[filter]) {
        this.filters[filter] = "";
      } else {
        this.filters[filter] = value;
      }
    }

    // "boosted users" group
    // in this case let's also (un)check the 'boost type' filters
    if (filter == "fullText") {
      if (this.filters[filter] === "") {
        this.filters.typeBoost = true;
        this.filters.typeOriginal = true;
      } else {
        this.filters.typeBoost = true;
        this.filters.typeOriginal = false;
      }
    }

    this.setFilter();

    // keyboard focus may be lost when tags list changes
    setTimeout(() => {
      document.getElementById(id).focus();
    }, 100);
  },
  resetFilters(userAction) {
    this.filters = JSON.parse(JSON.stringify(this.filtersDefault));
    if (userAction) {
      this.currentPage = 1;
      this.filtersActive = false;
      scrollTootsToTop();
      pagingUpdated();
    }
  },

  get filteredToots() {
    const f = this.filters;
    const fa = this.filtersActive;
    return this.toots.filter((t) => {
      if (!fa) {
        return true;
      }

      if (f.fullText) {
        let show = false;
        const filterValue = f.fullText.toLowerCase();

        if (t._marl.textContent) {
          if (t._marl.textContent && t._marl.textContent.indexOf(filterValue) >= 0) {
            show = true;
          }
        }

        if (t._marl.hasAttachments) {
          t.object.attachment.forEach((att) => {
            const alt = att.name;
            if (alt && alt.indexOf(filterValue) >= 0) {
              show = true;
            }
          });
        }

        if (!show) {
          return show;
        }
      }

      if (f.hashtagText) {
        if (typeof t.object === "object" && t.object !== null && t.object.tag) {
          const filterValue = f.hashtagText.toLowerCase();
          if (
            !t.object.tag.some((t) => {
              return t.type === "Hashtag" && t.name.toLowerCase().indexOf(filterValue) > -1;
            })
          ) {
            return false;
          }
        } else {
          return false;
        }
      }

      if (f.mentionText) {
        if (typeof t.object === "object" && t.object !== null && t.object.tag) {
          const filterValue = f.mentionText.toLowerCase();
          if (
            !t.object.tag.some((t) => {
              return t.type === "Mention" && t.name.toLowerCase().indexOf(filterValue) > -1;
            })
          ) {
            return false;
          }
        } else {
          return false;
        }
      }

      if (f.summary) {
        if (t._marl.summary) {
          const filterValue = f.summary.toLowerCase();
          if (t._marl.summary.indexOf(filterValue) === -1) {
            return false;
          }
        } else {
          return false;
        }
      }

      if (f.isEdited) {
        if (!(typeof t.object === "object" && t.object !== null && t.object.updated)) {
          return false;
        }
      }

      if (f.isDuplicate) {
        if (!t._marl.duplicate) {
          return false;
        }
      }

      if (f.noStartingAt) {
        if (!t._marl.textContent || t._marl.textContent.indexOf("@") === 0) {
          return false;
        }
      }

      if (f.hasExternalLink) {
        if (!t._marl.externalLinks || !t._marl.externalLinks.length) {
          return false;
        }
      }

      if (f.hasHashtags) {
        if (typeof t.object === "object" && t.object !== null && t.object.tag) {
          if (
            !t.object.tag.some((t) => {
              return t.type === "Hashtag";
            })
          ) {
            return false;
          }
        } else {
          return false;
        }
      }

      if (f.hasMentions) {
        if (typeof t.object === "object" && t.object !== null && t.object.tag) {
          if (
            !t.object.tag.some((t) => {
              return t.type === "Mention";
            })
          ) {
            return false;
          }
        } else {
          return false;
        }
      }

      if (f.hasSummary) {
        if (typeof t.object === "object" && t.object !== null) {
          if (!t.object.summary) {
            return false;
          }
        } else {
          return false;
        }
      }

      if (f.isSensitive) {
        if (typeof t.object === "object" && t.object !== null) {
          if (!t.object.sensitive) {
            return false;
          }
        } else {
          return false;
        }
      }

      if (f.externalLink) {
        let show = false;
        if (t._marl.externalLinks && t._marl.externalLinks.length) {
          const filterValue = f.externalLink.toLowerCase();
          show = t._marl.externalLinks.some((link) => {
            return link.href.indexOf(filterValue) > -1 || link.text.indexOf(filterValue) > -1;
          });
        }
        if (!show) {
          return false;
        }
      }

      if (!f.visibilityPublic && t._marl.visibility[0] === "public") {
        return false;
      }
      if (!f.visibilityUnlisted && t._marl.visibility[0] === "unlisted") {
        return false;
      }
      if (!f.visibilityFollowers && t._marl.visibility[0] === "followers") {
        return false;
      }
      if (!f.visibilityMentioned && t._marl.visibility[0] === "mentioned") {
        return false;
      }

      if (!f.typeOriginal && t.type === "Create") {
        return false;
      }
      if (!f.typeBoost && t.type === "Announce") {
        return false;
      }

      if (f.attachmentAny) {
        if (!t._marl.hasAttachments) {
          return false;
        }
      }
      if (f.attachmentImage) {
        if (t._marl.hasAttachments) {
          if (
            !t.object.attachment.some((att) => {
              return attachmentIsImage(att);
            })
          ) {
            return false;
          }
        } else {
          return false;
        }
      }
      if (f.attachmentVideo) {
        if (t._marl.hasAttachments) {
          if (
            !t.object.attachment.some((att) => {
              return attachmentIsVideo(att);
            })
          ) {
            return false;
          }
        } else {
          return false;
        }
      }
      if (f.attachmentSound) {
        if (t._marl.hasAttachments) {
          if (
            !t.object.attachment.some((att) => {
              return attachmentIsSound(att);
            })
          ) {
            return false;
          }
        } else {
          return false;
        }
      }

      if (f.attachmentNoAltText) {
        if (t._marl.hasAttachments) {
          if (
            !t.object.attachment.some((att) => {
              return att.name === null;
            })
          ) {
            return false;
          }
        } else {
          return false;
        }
      }

      if (f.attachmentWithAltText) {
        if (t._marl.hasAttachments) {
          if (
            !t.object.attachment.some((att) => {
              return att.name;
            })
          ) {
            return false;
          }
        } else {
          return false;
        }
      }

      for (const lang in this.languages) {
        if (f.hasOwnProperty("lang_" + lang) && f["lang_" + lang] === false) {
          if (t._marl.langs.includes(lang) || t._marl.langs.length === 0) {
            return false;
          }
        }
      }

      for (const source of this.sources) {
        const id = source.id;
        if (f.hasOwnProperty("actor_" + id) && f["actor_" + id] === false) {
          if (t._marl.source === id) {
            return false;
          }
        }
      }

      return true;
    });
  },

  get listHashtags() {
    return this.listTags("Hashtag");
  },
  get listMentions() {
    return this.listTags("Mention");
  },
  listTags(type) {
    let filterSource = "";
    switch (type) {
      case "Mention":
        filterSource = "mentions";
        break;
      case "Hashtag":
        filterSource = "hashtags";
        break;
    }
    let h = this.filteredToots.reduce((accu, toot) => {
      if (tootHasTags(toot)) {
        for (const key in toot.object.tag) {
          const tag = toot.object.tag[key];
          if (
            tag.type &&
            tag.type === type &&
            tag.name &&
            tag.name.toLowerCase().indexOf(this.tagsFilters[filterSource].toLowerCase()) >= 0
          ) {
            if (
              accu.some((item) => {
                return item.name === tag.name;
              })
            ) {
              accu.map((item) => {
                if (item.name === tag.name) {
                  item.nb++;
                }
              });
            } else {
              accu.push({
                name: tag.name,
                href: tag.href,
                nb: 1,
              });
            }
          }
        }
      }
      return accu;
    }, []);

    h.sort((a, b) => {
      if (a.nb === b.nb) {
        return a.name.localeCompare(b.name);
      } else {
        return b.nb - a.nb;
      }
    });

    return h;
  },
  get listBoostsAuthors() {
    let r = this.boostsAuthors.reduce((accu, item) => {
      if (item.name.toLowerCase().indexOf(this.tagsFilters.boostsAuthors.toLowerCase()) >= 0) {
        accu.push(item);
      }
      return accu;
    }, []);
    r.sort((a, b) => {
      if (a.nb === b.nb) {
        let aHasNoName = a.name.indexOf("? ") === 0;
        let bHasNoName = b.name.indexOf("? ") === 0;
        if (aHasNoName && bHasNoName) {
          return a.name.localeCompare(b.name);
        } else if (aHasNoName) {
          return 1;
        } else if (bHasNoName) {
          return -1;
        } else {
          return a.name.localeCompare(b.name);
        }
      } else {
        if (a.nb === b.nb) {
          return a.name.localeCompare(b.name);
        } else {
          return b.nb - a.nb;
        }
      }
    });
    return r;
  },

  get sortedLanguages() {
    let langs = [];
    for (const lang in this.languages) {
      langs.push([lang, this.languages[lang]]);
    }
    langs.sort((a, b) => {
      if (a[0] === "undefined") {
        return 1;
      }
      if (b[0] === "undefined") {
        return -1;
      }
      if (a[1] === b[1]) {
        return a[0].localeCompare(b[0]);
      }
      return b[1] - a[1];
    });
    return langs;
  },

  get appReady() {
    if (this.loading || !this.sources.length) {
      return false;
    }

    return true;
  },

  get totalPages() {
    return Math.ceil(this.filteredToots.length / this.pageSize);
  },
  get pagedToots() {
    if (this.filteredToots) {
      return this.filteredToots.filter((_, index) => {
        let start = (this.currentPage - 1) * this.pageSize;
        let end = this.currentPage * this.pageSize;
        if (index >= start && index < end) return true;
      });
    } else {
      return [];
    }
  },

  sortToots() {
    this.toots.sort((a, b) => {
      if (this.sortAsc) {
        return a.published.localeCompare(b.published);
      } else {
        return b.published.localeCompare(a.published);
      }
    });
  },
  toggleTootsOrder() {
    this.sortAsc = !this.sortAsc;
    Alpine.store("userPrefs").save("sortAsc", this.sortAsc ? 1 : 0);
    this.sortToots();
    scrollTootsToTop();
    pagingUpdated();
  },

  setPostsPerPage() {
    this.checkPagingValue();
    Alpine.store("userPrefs").save("pageSize", this.pageSize);
  },
  checkPagingValue() {
    if (this.currentPage < 1) {
      this.currentPage = 1;
    } else if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
  },
  nextPage(setFocusTo) {
    if (this.currentPage * this.pageSize < this.filteredToots.length) {
      this.currentPage++;
      scrollTootsToTop(setFocusTo);
      pagingUpdated();
    }
  },
  prevPage(setFocusTo) {
    if (this.currentPage > 1) {
      this.currentPage--;
      scrollTootsToTop(setFocusTo);
      pagingUpdated();
    }
  },
  firstPage(setFocusTo) {
    this.currentPage = 1;
    scrollTootsToTop(setFocusTo);
    pagingUpdated();
  },
  lastPage(setFocusTo) {
    this.currentPage = this.totalPages;
    scrollTootsToTop(setFocusTo);
    pagingUpdated();
  },
};

const lightboxStore = {
  resetState() {
    this.show = false;
    this.data = [];
    this.source = 0;
    this.index = 0;
    this.origin = "";
  },

  open(toot, index, origin) {
    this.data = toot.object.attachment;
    this.source = toot._marl.source;
    this.show = true;
    this.index = index;
    this.origin = origin;

    document.getElementById("main-section-inner").setAttribute("inert", true);
    setTimeout(() => {
      document.getElementById("lightbox").focus();
    }, 50);
  },
  openProfileImg(name, origin, source) {
    let mediaType = "";
    if (localMode()) {
      mediaType = Alpine.store("files").sources[source][name].type;
    }
    const data = {
      object: {
        attachment: [
          {
            name: name,
            url: name,
            mediaType: mediaType,
          },
        ],
      },
      _marl: {
        source: source,
      },
    };
    this.open(data, 0, origin);
  },

  close() {
    const origin = this.origin;
    this.data = [];
    this.index = 0;
    this.show = false;
    this.origin = "";
    document.getElementById("main-section-inner").removeAttribute("inert");
    document.getElementById(origin).focus();
  },
  showNext() {
    this.index++;
    if (this.index >= this.data.length) {
      this.index = 0;
    }
    if (!attachmentIsImage(this.data[this.index])) {
      this.showNext();
    }
  },
  showPrev() {
    this.index--;
    if (this.index < 0) {
      this.index = this.data.length - 1;
    }
    if (!attachmentIsImage(this.data[this.index])) {
      this.showPrev();
    }
  },
};

const uiStore = {
  log: [],
  resetState() {
    this.pagingOptionsVisible = false;
    this.openMenu = "";
    this.actorPanel = 0;
    this.menuIsActive = false;
    this.lang = "en";
    this.appLangs = appLangs ?? { en: "English" };
    this.theme = "light";
    this.errorInLog = false;
    this.log = this.log ?? [];

    Alpine.store("userPrefs").load("lang");
    Alpine.store("userPrefs").load("theme");
  },

  logMsg(msg, type) {
    // expected types: info, warn, error
    type = type ?? "info";
    const dateOptions = {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    };
    const time = new Date().toLocaleTimeString(Alpine.store("ui").lang, dateOptions);
    let m = {
      msg: msg,
      type: type,
      time: time,
    };
    this.log.unshift(m);
    if (type === "error") {
      this.errorInLog = true;
    }
  },

  toggleTheme() {
    this.theme = this.theme === "light" ? "dark" : "light";
    Alpine.store("userPrefs").save("theme", this.theme);
    setTheme(this.theme);
  },

  togglePagingOptions() {
    this.pagingOptionsVisible = !this.pagingOptionsVisible;

    if (this.pagingOptionsVisible) {
      setTimeout(() => {
        document.getElementById("paging-options").focus();
      }, 100);
    }
  },
  get pagingOptionsClass() {
    return this.pagingOptionsVisible ? "open" : "";
  },

  openActorPanel(id) {
    this.actorPanel = id;

    setTimeout(() => {
      document.getElementById("actorpanel-" + id).scrollTop = 0;
    }, 50);
  },
  switchActorPanel(dir) {
    let id = this.actorPanel;
    if (dir === "up") {
      id++;
      if (id >= Alpine.store("files").sources.length) {
        id = 0;
      }
    } else {
      id--;
      if (id < 0) {
        id = Alpine.store("files").sources.length - 1;
      }
    }
    this.actorPanel = id;
    document.getElementById("actortab-" + id).focus();
  },

  menuClose() {
    const name = this.openMenu;
    this.openMenu = "";
    this.setInert();

    // bring focus back to where it was before the panel was opened
    if (name === "tools" && !this.menuIsActive) {
      document.getElementById("header-open-tools").focus();
    } else {
      document.querySelector("#main-section-inner .mobile-menu .menu-" + name).focus();
    }
  },
  menuOpen(name) {
    this.openMenu = name;
    this.resetPanels();
    this.setInert();

    setTimeout(() => {
      document.getElementById("panel-" + name).focus();
    }, 100);
  },
  menuToggle(name) {
    switch (name) {
      case "actor":
      case "filters":
      case "tags":
      case "tools":
        if (this.openMenu === name) {
          this.menuClose();
        } else {
          this.menuOpen(name);
        }
        break;
    }
  },
  resetPanels() {
    const name = this.openMenu;
    document.querySelectorAll(`#panel-${name} details[open]`).forEach((e) => {
      e.removeAttribute("open");
    });

    if (name === "actor") {
      const panel = "actorpanel-" + this.actorPanel;
      setTimeout(() => {
        document.getElementById(panel).scrollTop = 0;
      }, 250);
    } else {
      setTimeout(() => {
        document.getElementById("panel-" + name).scrollTop = 0;
      }, 250);
    }
  },
  checkMenuState() {
    const menu = document.getElementById("mobile-menu");
    if (window.getComputedStyle(menu, null).display === "none") {
      this.menuIsActive = false;
    } else {
      this.menuIsActive = true;
    }

    this.setInert();
  },

  setInertMain() {
    document
      .querySelectorAll("#main-section-inner > *:not(.mobile-menu, .panel-backdrop, #panel-" + this.openMenu)
      .forEach((e) => {
        e.setAttribute("inert", true);
      });
  },
  setInertPanels() {
    document.querySelectorAll("#panel-actor, #panel-filters, #panel-tags, #panel-tools").forEach((e) => {
      e.setAttribute("inert", true);
    });
  },
  setInertTools() {
    document.querySelectorAll("#panel-tools").forEach((e) => {
      e.setAttribute("inert", true);
    });
  },
  setInert() {
    // set the 'inert' state on the side panels or the main part of the app
    // depending on whether they are hidden or not, AND whether the mobile
    // menu is active

    document.querySelectorAll("#main-section-inner > *").forEach((e) => {
      e.removeAttribute("inert");
    });

    if (this.menuIsActive) {
      if (this.openMenu) {
        this.setInertMain();
      } else {
        this.setInertPanels();
      }
    } else {
      if (this.openMenu === "tools") {
        this.setInertMain();
      } else {
        this.setInertTools();
      }
    }
  },

  get appClasses() {
    let classes = [];
    if (this.openMenu) {
      classes.push("menu-open menu-open-" + this.openMenu);
    } else {
      classes.push("menu-closed");
    }
    return classes;
  },
};
