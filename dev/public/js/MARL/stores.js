const userPrefsStore = {
  prefix: "marl_",

  save(pref, value) {
    if (value === true) {
      value = 1;
    }
    if (value === false) {
      value = 0;
    }
    localStorage.setItem(this.prefix + pref, value);
    if (pref !== "activePanel") {
      const msg = `Saving user preference <b>(${pref}: ${value})</b>`;
      marlConsole(msg, "info");
    }
  },
  load(pref) {
    const value = localStorage.getItem(this.prefix + pref);
    if (value !== null) {
      this.set(pref, value);
    } else {
      // let's load those prefs even if there's no stored value
      switch (pref) {
        case "lang":
        case "theme":
          this.set(pref, value);
          break;
      }
    }
  },
  set(pref, value) {
    switch (pref) {
      // boolean values
      case "sortAsc":
      case "combinePanels":
      case "simplifyPostsDisplay":
        value = +value === 1 ? true : false;
        if (value !== Alpine.store("ui")[pref]) {
          Alpine.store("ui")[pref] = value;
        }
        break;

      // numerical values
      case "pageSize":
        value = +value;
        if (typeof value == "number" && !isNaN(value) && value > 0 && value !== Alpine.store("ui")[pref]) {
          Alpine.store("ui")[pref] = value;
        }
        break;

      case "activePanel":
        if (value && combinedPanelsMode()) {
          Alpine.store("ui")[pref] = value;
        }
        break;

      case "defaultPanel":
        if (value) {
          Alpine.store("ui")[pref] = value;
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
        Alpine.store("ui")[pref] = value;
        break;

      case "theme":
        if (!value) {
          value = detectThemePreference();
        }
        if (!validTheme(value)) {
          if (customPrefAvailable("theme") && validTheme(customPrefs.theme)) {
            value = customPrefs.theme;
          } else {
            value = detectThemePreference();
          }
          this.save("theme", value);
        }
        Alpine.store("ui")[pref] = value;
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

    this.remotes = [];
    this.marlBasePath = "";

    this.sources = [];
    this.toots = [];
    this.toc = [];

    this.currentPage = 1;

    this.loading = false;
    this.loadingFailed = false;

    this.languages = {};
    this.boostsAuthors = [];
    this.conversation = [];
    this.conversationSource = null;

    this.date = {
      first: null,
      last: null,
    };

    this.filters = {};
    this.filtersDefault = {
      fullText: "",
      hashtagText: "",
      mentionText: "",
      externalLink: "",
      summary: "",
      isDuplicate: false,

      hasExternalLink: false,
      hasHashtags: false,
      hasMentions: false,
      hasPoll: false,
      hasSummary: false,
      startingAt: false,
      noStartingAt: false,
      isSensitive: false,
      isEdited: false,
      isInConversation: false,

      hasLikes: "0",
      hasShares: "0",

      afterDate: "",
      beforeDate: "",
      afterTime: "",
      beforeTime: "",

      typeOriginal: true,
      typeBoost: true,

      attachmentAny: false,
      attachmentImage: false,
      attachmentVideo: false,
      attachmentSound: false,
      attachmentNoAltText: false,
      attachmentWithAltText: false,

      visibilityPublic: true,
      visibilityUnlisted: true,
      visibilityFollowers: true,
      visibilityMentioned: true,

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
    this.activeFilters = {
      // which filters should be shown or not
      // only explicit "false" values are taken into account
      // in other word, an absent value is truthy

      isEdited: false,
      isDuplicate: false,
      // startingAt: false,
      // noStartingAt: false,
      hasExternalLink: false,
      // hasHashtags: false,
      // hasMentions: false,
      hasPoll: false,
      hasSummary: false,
      isSensitive: false,
      isInConversation: false,
      hasLikes: false,
      hasShares: false,
      typeOriginal: false,
      typeBoost: false,
      attachmentAny: false,
      attachmentImage: false,
      attachmentVideo: false,
      attachmentSound: false,
      attachmentNoAltText: false,
      attachmentWithAltText: false,
      visibilityPublic: false,
      visibilityUnlisted: false,
      visibilityFollowers: false,
      visibilityMentioned: false,
    };

    this.tagsFilters = {
      hashtags: "",
      mentions: "",
      boostsAuthors: "",
    };
  },

  serverMode: false,

  setFilter(filterName) {
    this.checkPagingValue();
    scrollTootsToTop();
    pagingUpdated();
    this.checkFiltersActive();

    // mutually exclusive filters
    if (this.filters.startingAt && this.filters.noStartingAt) {
      if (filterName === "startingAt") {
        this.filters.noStartingAt = false;
      }
      if (filterName === "noStartingAt") {
        this.filters.startingAt = false;
      }
    }

    const self = this;
    setTimeout(() => {
      self.checkPagingValue();
    }, 50);
  },
  checkFiltersActive() {
    if (JSON.stringify(this.filters) === JSON.stringify(this.filtersDefault)) {
      this.filtersActive = false;
    } else {
      this.filtersActive = true;
    }
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
      this.checkFiltersActive();
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

      // text search

      if (f.fullText) {
        let show = false;
        const filterValue = f.fullText.toLowerCase();

        if (t._marl.textContent) {
          if (t._marl.textContent && t._marl.textContent.indexOf(filterValue) >= 0) {
            show = true;
          }
        }

        if (t.id.indexOf(filterValue) >= 0) {
          show = true;
        }
        if (
          typeof t.object === "object" &&
          t.object !== null &&
          t.object.inReplyTo &&
          t.object.inReplyTo.indexOf(filterValue) >= 0
        ) {
          show = true;
        }

        if (t._marl.hasAttachments) {
          t.object.attachment.forEach((att) => {
            const alt = att.name;
            if (alt && alt.indexOf(filterValue) >= 0) {
              show = true;
            }
          });
        }

        if (t._marl.summary) {
          if (t._marl.summary.indexOf(filterValue) >= 0) {
            show = true;
          }
        }

        if (t._marl.pollType) {
          const pollData = t.object[t._marl.pollType];
          if (pollData.filter((option) => option.name.toLowerCase().indexOf(filterValue) >= 0).length) {
            show = true;
          }
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

      if (f.isDuplicate) {
        if (!t._marl.duplicate) {
          return false;
        }
      }

      // must contain

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

      if (f.hasPoll) {
        if (typeof t.object === "object" && t.object !== null && t.object.type) {
          if (t.object.type !== "Question") {
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

      if (f.hasExternalLink) {
        if (!t._marl.externalLinks || !t._marl.externalLinks.length) {
          return false;
        }
      }

      if (f.startingAt) {
        if (!t._marl.textContent || t._marl.textContent.indexOf("@") !== 0) {
          return false;
        }
      }

      if (f.noStartingAt) {
        if (t._marl.textContent && t._marl.textContent.indexOf("@") === 0) {
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

      if (f.isEdited) {
        if (!(typeof t.object === "object" && t.object !== null && t.object.updated)) {
          return false;
        }
      }

      if (f.isInConversation) {
        if (!t._marl.replies.length && !t._marl.inReplyTo) {
          return false;
        }
      }

      // activities

      if (f.hasLikes && f.hasLikes > 0) {
        if (typeof t.object === "object" && t.object !== null && t.object.likes) {
          if (t.object.likes.totalItems < f.hasLikes) {
            return false;
          }
        } else {
          return false;
        }
      }

      if (f.hasShares && f.hasShares > 0) {
        if (typeof t.object === "object" && t.object !== null && t.object.shares) {
          if (t.object.shares.totalItems < f.hasShares) {
            return false;
          }
        } else {
          return false;
        }
      }

      // date & time
      if (f.afterDate) {
        const date = f.afterDate.replace(/-/g, "");
        if (t._marl.date < +date) {
          return false;
        }
      }

      if (f.beforeDate) {
        const date = f.beforeDate.replace(/-/g, "");
        if (t._marl.date > +date) {
          return false;
        }
      }

      if (f.afterTime) {
        const time = f.afterTime.replace(":", "");
        if (t._marl.time < +time) {
          return false;
        }
      }

      if (f.beforeTime) {
        const time = f.beforeTime.replace(":", "");
        if (t._marl.time > +time) {
          return false;
        }
      }

      // type

      if (!f.typeOriginal && t.type === "Create") {
        return false;
      }

      if (!f.typeBoost && t.type === "Announce") {
        return false;
      }

      // attachment

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

      // visibility

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

      // language

      for (const lang in this.languages) {
        if (f.hasOwnProperty("lang_" + lang) && f["lang_" + lang] === false) {
          if (t._marl.langs.includes(lang) || t._marl.langs.length === 0) {
            return false;
          }
        }
      }

      // author

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
    let storeFilter = "";

    switch (type) {
      case "Mention":
        filterSource = "mentions";
        storeFilter = "mentionText";
        break;
      case "Hashtag":
        filterSource = "hashtags";
        storeFilter = "hashtagText";
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
                active: Alpine.store("files").filters[storeFilter] === tag.name,
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
        item.active = item.url === Alpine.store("files").filters.fullText.toLowerCase();
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

  filteredLikesBookmarks(type, sourceId) {
    const f = this.sources[sourceId][type].filter.toLowerCase();
    const d = this.sources[sourceId][type].data;

    if (!d || !d.length) {
      return [];
    }

    if (f) {
      return d.filter((item) => item.url.toLowerCase().indexOf(f) >= 0);
    } else {
      return d;
    }
  },

  loadConversation(t) {
    this.conversation = [];
    this.conversationSource = "conversation-" + t._marl.id;

    const start = this.searchConversationStart(t);
    this.loadReplies(start);

    if (this.conversation.length) {
      setTimeout(() => {
        this.focusConversation();
      }, 10);
    }
  },
  searchConversationStart(t) {
    if (typeof t.object === "object" && t.object !== null && t.object.inReplyTo) {
      const posts = this.getPostsById(t.object.inReplyTo);
      if (posts.length) {
        return this.searchConversationStart(posts[0]);
      } else {
        return t;
      }
    } else {
      return t;
    }
  },
  loadReplies(t, level = 0) {
    t._marl.conversationLevel = level;
    this.conversation.push(t);

    if (t._marl.replies.length) {
      t._marl.replies.forEach((id) => {
        const posts = this.getPostsById(id);
        posts.forEach((t) => {
          this.loadReplies(t, level);
          level++;
        });
      });
    }
  },
  getPostsById(id) {
    return this.toots.filter((t) => {
      return t.id.indexOf(id) === 0;
    });
  },
  focusConversation() {
    const elm = document.getElementById("panel-conversation");
    if (elm) {
      Alpine.store("ui").setInert();
      elm.focus();
    }
  },
  closeConversation() {
    this.conversation = [];
    Alpine.store("ui").setInert();
    const elm = document.getElementById(this.conversationSource);
    if (elm) {
      elm.focus();
    }
    this.conversationSource = null;
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
    return Math.ceil(this.filteredToots.length / Alpine.store("ui").pageSize);
  },
  get pagedToots() {
    const pageSize = Alpine.store("ui").pageSize;
    if (this.filteredToots) {
      return this.filteredToots.filter((_, index) => {
        let start = (this.currentPage - 1) * pageSize;
        let end = this.currentPage * pageSize;
        if (index >= start && index < end) return true;
      });
    } else {
      return [];
    }
  },

  sortToots() {
    const sortAsc = Alpine.store("ui").sortAsc;
    this.toots.sort((a, b) => {
      if (sortAsc) {
        return a.published.localeCompare(b.published);
      } else {
        return b.published.localeCompare(a.published);
      }
    });
    scrollTootsToTop();
    pagingUpdated();
  },

  checkPagingValue() {
    if (this.currentPage < 1) {
      this.currentPage = 1;
    } else if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
  },
  nextPage(setFocusTo) {
    if (this.currentPage * Alpine.store("ui").pageSize < this.filteredToots.length) {
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
    this.resetState();
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
  defaultOptions: {
    lang: "en",
    theme: "light",
    sortAsc: true,
    pageSize: 10,
    combinePanels: false,
    defaultPanel: "auto",
    simplifyPostsDisplay: false,
  },

  resetState() {
    this.pagingOptionsVisible = false;
    this.actorPanel = 0;
    this.mobileLayout = false;
    this.appLangs = appLangs ?? { en: "English" };
    this.errorInLog = false;
    this.log = this.log ?? [];
    this.activePanel = "";
    this.postsScrolled = false;

    this.lang = this.defaultOptions.lang;
    this.theme = this.defaultOptions.theme;
    this.sortAsc = this.defaultOptions.sortAsc;
    this.pageSize = this.defaultOptions.pageSize;
    this.combinePanels = this.defaultOptions.combinePanels;
    this.defaultPanel = this.defaultOptions.defaultPanel;
    this.simplifyPostsDisplay = this.defaultOptions.simplifyPostsDisplay;

    checkMobileLayout();

    loadPref("lang");
    loadPref("theme");
    loadPref("sortAsc");
    loadPref("pageSize");
    loadPref("combinePanels");
    loadPref("activePanel");
    loadPref("defaultPanel");
    loadPref("simplifyPostsDisplay");

    setTheme(this.theme);

    if (combinedPanelsMode()) {
      if (this.defaultPanel === "auto") {
        this.panelOpen(this.activePanel ? this.activePanel : "actor", false);
      } else {
        this.panelOpen(this.defaultPanel, false);
      }
    }
  },
  changeDefault(pref, val) {
    switch (pref) {
      case "sortAsc":
      case "combinePanels":
      case "simplifyPostsDisplay":
        val = val ? true : false;
        break;

      case "pageSize":
        val = +val;
        if (typeof val !== "number" || isNaN(val) || val === 0) {
          return;
        }
        break;

      case "defaultPanel":
        if (!validPanel(val)) {
          return;
        }
        break;

      case "theme":
        if (!validTheme(val)) {
          return;
        }
        setTheme(val);
        break;

      case "lang":
        if (!validLang(val)) {
          return;
        }
        break;
      default:
        return;
    }

    this.defaultOptions[pref] = val;
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

  setOption(pref) {
    savePref(pref, this[pref]);

    if (pref === "sortAsc") {
      Alpine.store("files").sortToots();
    }

    if (pref === "pageSize") {
      Alpine.store("files").checkPagingValue();
    }

    if (pref === "combinePanels") {
      this.setInert();
    }
  },

  toggleTheme() {
    this.theme = this.theme === "light" ? "dark" : "light";
    savePref("theme", this.theme);
    setTheme(this.theme);
  },

  openActorTab(id) {
    this.actorPanel = id;

    setTimeout(() => {
      document.getElementById("actorpanel-" + id).scrollTop = 0;
    }, 50);
  },
  switchActorTab(dir) {
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

  panelClose() {
    if (combinedPanelsMode()) {
      return;
    }

    const name = this.activePanel;
    this.activePanel = "";
    this.setInert();

    // bring focus back to where it was before the panel was opened
    if (name === "tools" && !this.mobileLayout) {
      document.getElementById("header-open-tools").focus();
    } else {
      document.querySelector("#main-section-inner .mobile-menu .menu-" + name).focus();
    }
  },
  panelOpen(name, setFocus) {
    this.activePanel = name;
    this.resetPanels();
    this.setInert();

    if (setFocus) {
      setTimeout(() => {
        document.getElementById("panel-" + name).focus();
      }, 100);
    }
  },
  panelToggle(name) {
    switch (name) {
      case "actor":
      case "filters":
      case "tags":
      case "tools":
        if (this.activePanel === name) {
          if (!combinedPanelsMode()) {
            this.panelClose();
          }
        } else {
          this.panelOpen(name, true);
          savePref("activePanel", name);
        }
        break;
    }
  },
  resetPanels() {
    const name = this.activePanel;
    if (name === "auto") {
      return;
    }

    document.querySelectorAll(`#panel-${name} details[open]`).forEach((e) => {
      e.removeAttribute("open");
    });

    let panelId = "panel-" + name;
    if (name === "actor") {
      panelId = "actorpanel-" + this.actorPanel;
    }

    setTimeout(() => {
      const elm = document.getElementById(panelId);
      if (elm) {
        elm.scrollTop = 0;
      }
    }, 250);
  },

  setInertMain() {
    const elms = document.querySelectorAll(
      "#main-section-inner > *:not(.mobile-menu, .panel-backdrop, #panel-" + this.activePanel
    );
    if (!elms.length) {
      return;
    }
    elms.forEach((e) => {
      e.setAttribute("inert", true);
    });
  },
  setInertPanels() {
    const panels = document.querySelectorAll(
      "#panel-actor, #panel-filters, #panel-tags, #panel-tools, #panel-conversation"
    );
    if (!panels.length) {
      return;
    }
    panels.forEach((e) => {
      e.setAttribute("inert", true);
    });

    if (combinedPanelsMode() && this.activePanel) {
      const panel = document.getElementById("panel-" + this.activePanel);
      if (panel) {
        panel.removeAttribute("inert");
      }
    }
  },
  setInertTools() {
    const panel = document.getElementById("panel-tools");
    if (!panel) {
      return;
    }
    panel.setAttribute("inert", true);
  },
  setInert() {
    // set the 'inert' state on the side panels or the main part of the app
    // depending on whether they are hidden or not, AND whether the mobile
    // menu is active

    const elms = document.querySelectorAll("#main-section-inner > *");
    if (!elms.length) {
      return;
    }

    if (Alpine.store("files").conversation.length) {
      elms.forEach((e) => {
        if (e.id === "panel-conversation") {
          return;
        }
        e.setAttribute("inert", true);
      });
      return;
    } else {
      const elm = document.getElementById("panel-conversation");
      if (elm) {
        elm.setAttribute("inert", true);
      }
    }

    elms.forEach((e) => {
      e.removeAttribute("inert");
    });

    if (combinedPanelsMode()) {
      this.setInertPanels();
    } else {
      if (this.mobileLayout) {
        if (this.activePanel) {
          this.setInertMain();
        } else {
          this.setInertPanels();
        }
      } else {
        if (this.activePanel === "tools") {
          this.setInertMain();
        } else {
          this.setInertTools();
        }
      }
    }
  },

  checkPostsScrolling() {
    const elm = document.getElementById("toots");
    if (!elm) {
      return;
    }
    if (elm.scrollTop > 5) {
      this.postsScrolled = true;
    } else {
      this.postsScrolled = false;
    }
  },

  get appClasses() {
    let classes = [];
    if (combinedPanelsMode()) {
      classes.push("combine-panels");
    }
    if (this.simplifyPostsDisplay) {
      classes.push("simplify-posts-display");
    }
    if (this.postsScrolled) {
      classes.push("posts-scrolled");
    }

    return classes;
  },
  get appInsideClasses() {
    let classes = [];
    if (this.activePanel) {
      classes.push("menu-open menu-open-" + this.activePanel);
    } else {
      classes.push("menu-closed");
    }
    return classes;
  },
};
