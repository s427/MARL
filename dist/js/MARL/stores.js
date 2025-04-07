const userPrefsStore = {
    prefix: "marl_",
    save(e, t) {
      if ((!0 === t && (t = 1), !1 === t && (t = 0), localStorage.setItem(this.prefix + e, t), "activePanel" !== e)) {
        marlConsole(`Saving user preference <b>(${e}: ${t})</b>`, "info");
      }
    },
    load(e) {
      const t = localStorage.getItem(this.prefix + e);
      (null !== t || "lang" === e) && this.set(e, t);
    },
    set(e, t) {
      switch (e) {
        case "sortAsc":
        case "combinePanels":
        case "simplifyPostsDisplay":
          (t = 1 == +t) !== Alpine.store("ui")[e] && (Alpine.store("ui")[e] = t),
            "combinePanels" === e && t && (Alpine.store("ui").activePanel = Alpine.store("ui").defaultPanel);
          break;
        case "pageSize":
          "number" == typeof (t = +t) &&
            !isNaN(t) &&
            t > 0 &&
            t !== Alpine.store("ui")[e] &&
            (Alpine.store("ui")[e] = t);
          break;
        case "activePanel":
          t && Alpine.store("ui").combinePanels && (Alpine.store("ui")[e] = t);
          break;
        case "defaultPanel":
          t &&
            ((Alpine.store("ui")[e] = t),
            "auto" !== t && Alpine.store("ui").combinePanels && Alpine.store("ui").panelOpen(t, !1));
          break;
        case "lang":
          if ((t || ((t = detectLangFromBrowser()) && this.save("lang", t)), !t || !Alpine.store("ui").appLangs[t])) {
            if (t) {
              const e = `<b>Unrecognized language</b> in user preferences: ${t}`;
              console.warn(e), marlConsole(e, "warn");
            }
            (t = "en"), this.save("lang", t);
          }
          Alpine.store("ui")[e] = t;
          break;
        case "theme":
          validTheme(t) ||
            ((t = customPrefAvailable("theme") && validTheme(customPrefs.theme) ? customPrefs.theme : "light"),
            this.save("theme", t)),
            (Alpine.store("ui")[e] = t),
            setTheme(t);
      }
    },
  },
  filesStore = {
    resetState() {
      (this.loadingQueue = []),
        (this.currentlyLoading = {}),
        (this.currentlyLoadingId = ""),
        (this.currentlyLoadingName = ""),
        (this.remotes = []),
        (this.marlBasePath = ""),
        (this.sources = []),
        (this.toots = []),
        (this.toc = []),
        (this.currentPage = 1),
        (this.loading = !1),
        (this.loadingFailed = !1),
        (this.languages = {}),
        (this.boostsAuthors = []),
        (this.date = { first: null, last: null }),
        (this.filters = {}),
        (this.filtersDefault = {
          fullText: "",
          hashtagText: "",
          mentionText: "",
          externalLink: "",
          summary: "",
          isDuplicate: !1,
          hasExternalLink: !1,
          hasHashtags: !1,
          hasMentions: !1,
          hasPoll: !1,
          hasSummary: !1,
          startingAt: !1,
          noStartingAt: !1,
          isSensitive: !1,
          isEdited: !1,
          hasLikes: "0",
          hasShares: "0",
          afterDate: "",
          beforeDate: "",
          afterTime: "",
          beforeTime: "",
          typeOriginal: !0,
          typeBoost: !0,
          attachmentAny: !1,
          attachmentImage: !1,
          attachmentVideo: !1,
          attachmentSound: !1,
          attachmentNoAltText: !1,
          attachmentWithAltText: !1,
          visibilityPublic: !0,
          visibilityUnlisted: !0,
          visibilityFollowers: !0,
          visibilityMentioned: !0,
        }),
        (this.filtersActive = !1),
        (this.activeFilters = {
          isEdited: !1,
          isDuplicate: !1,
          hasExternalLink: !1,
          hasPoll: !1,
          hasSummary: !1,
          isSensitive: !1,
          hasLikes: !1,
          hasShares: !1,
          typeOriginal: !1,
          typeBoost: !1,
          attachmentAny: !1,
          attachmentImage: !1,
          attachmentVideo: !1,
          attachmentSound: !1,
          attachmentNoAltText: !1,
          attachmentWithAltText: !1,
          visibilityPublic: !1,
          visibilityUnlisted: !1,
          visibilityFollowers: !1,
          visibilityMentioned: !1,
        }),
        (this.tagsFilters = { hashtags: "", mentions: "", boostsAuthors: "" });
    },
    serverMode: !1,
    setFilter(e) {
      this.checkPagingValue(),
        scrollTootsToTop(),
        pagingUpdated(),
        this.checkFiltersActive(),
        this.filters.startingAt &&
          this.filters.noStartingAt &&
          ("startingAt" === e && (this.filters.noStartingAt = !1),
          "noStartingAt" === e && (this.filters.startingAt = !1));
      const t = this;
      setTimeout(() => {
        t.checkPagingValue();
      }, 50);
    },
    checkFiltersActive() {
      JSON.stringify(this.filters) === JSON.stringify(this.filtersDefault)
        ? (this.filtersActive = !1)
        : (this.filtersActive = !0);
    },
    filterByTag(e, t, i) {
      t && (t === this.filters[e] ? (this.filters[e] = "") : (this.filters[e] = t)),
        "fullText" == e &&
          ("" === this.filters[e]
            ? ((this.filters.typeBoost = !0), (this.filters.typeOriginal = !0))
            : ((this.filters.typeBoost = !0), (this.filters.typeOriginal = !1))),
        this.setFilter(),
        setTimeout(() => {
          document.getElementById(i).focus();
        }, 100);
    },
    resetFilters(e) {
      (this.filters = JSON.parse(JSON.stringify(this.filtersDefault))),
        e && ((this.currentPage = 1), this.checkFiltersActive(), scrollTootsToTop(), pagingUpdated());
    },
    get filteredToots() {
      const e = this.filters,
        t = this.filtersActive;
      return this.toots.filter((i) => {
        if (!t) return !0;
        if (e.fullText) {
          let t = !1;
          const s = e.fullText.toLowerCase();
          if (
            (i._marl.textContent && i._marl.textContent && i._marl.textContent.indexOf(s) >= 0 && (t = !0),
            i._marl.hasAttachments &&
              i.object.attachment.forEach((e) => {
                const i = e.name;
                i && i.indexOf(s) >= 0 && (t = !0);
              }),
            i._marl.summary && i._marl.summary.indexOf(s) >= 0 && (t = !0),
            i._marl.pollType)
          ) {
            i.object[i._marl.pollType].filter((e) => e.name.toLowerCase().indexOf(s) >= 0).length && (t = !0);
          }
          if (!t) return t;
        }
        if (e.hashtagText) {
          if ("object" != typeof i.object || null === i.object || !i.object.tag) return !1;
          {
            const t = e.hashtagText.toLowerCase();
            if (!i.object.tag.some((e) => "Hashtag" === e.type && e.name.toLowerCase().indexOf(t) > -1)) return !1;
          }
        }
        if (e.mentionText) {
          if ("object" != typeof i.object || null === i.object || !i.object.tag) return !1;
          {
            const t = e.mentionText.toLowerCase();
            if (!i.object.tag.some((e) => "Mention" === e.type && e.name.toLowerCase().indexOf(t) > -1)) return !1;
          }
        }
        if (e.summary) {
          if (!i._marl.summary) return !1;
          {
            const t = e.summary.toLowerCase();
            if (-1 === i._marl.summary.indexOf(t)) return !1;
          }
        }
        if (e.externalLink) {
          let t = !1;
          if (i._marl.externalLinks && i._marl.externalLinks.length) {
            const s = e.externalLink.toLowerCase();
            t = i._marl.externalLinks.some((e) => e.href.indexOf(s) > -1 || e.text.indexOf(s) > -1);
          }
          if (!t) return !1;
        }
        if (e.isDuplicate && !i._marl.duplicate) return !1;
        if (e.hasHashtags) {
          if ("object" != typeof i.object || null === i.object || !i.object.tag) return !1;
          if (!i.object.tag.some((e) => "Hashtag" === e.type)) return !1;
        }
        if (e.hasMentions) {
          if ("object" != typeof i.object || null === i.object || !i.object.tag) return !1;
          if (!i.object.tag.some((e) => "Mention" === e.type)) return !1;
        }
        if (e.hasPoll) {
          if ("object" != typeof i.object || null === i.object || !i.object.type) return !1;
          if ("Question" !== i.object.type) return !1;
        }
        if (e.hasSummary) {
          if ("object" != typeof i.object || null === i.object) return !1;
          if (!i.object.summary) return !1;
        }
        if (e.hasExternalLink && (!i._marl.externalLinks || !i._marl.externalLinks.length)) return !1;
        if (e.startingAt && (!i._marl.textContent || 0 !== i._marl.textContent.indexOf("@"))) return !1;
        if (e.noStartingAt && i._marl.textContent && 0 === i._marl.textContent.indexOf("@")) return !1;
        if (e.isSensitive) {
          if ("object" != typeof i.object || null === i.object) return !1;
          if (!i.object.sensitive) return !1;
        }
        if (e.isEdited && ("object" != typeof i.object || null === i.object || !i.object.updated)) return !1;
        if (e.hasLikes && e.hasLikes > 0) {
          if ("object" != typeof i.object || null === i.object || !i.object.likes) return !1;
          if (i.object.likes.totalItems < e.hasLikes) return !1;
        }
        if (e.hasShares && e.hasShares > 0) {
          if ("object" != typeof i.object || null === i.object || !i.object.shares) return !1;
          if (i.object.shares.totalItems < e.hasShares) return !1;
        }
        if (e.afterDate) {
          const t = e.afterDate.replace(/-/g, "");
          if (i._marl.date < +t) return !1;
        }
        if (e.beforeDate) {
          const t = e.beforeDate.replace(/-/g, "");
          if (i._marl.date > +t) return !1;
        }
        if (e.afterTime) {
          const t = e.afterTime.replace(":", "");
          if (i._marl.time < +t) return !1;
        }
        if (e.beforeTime) {
          const t = e.beforeTime.replace(":", "");
          if (i._marl.time > +t) return !1;
        }
        if (!e.typeOriginal && "Create" === i.type) return !1;
        if (!e.typeBoost && "Announce" === i.type) return !1;
        if (e.attachmentAny && !i._marl.hasAttachments) return !1;
        if (e.attachmentImage) {
          if (!i._marl.hasAttachments) return !1;
          if (!i.object.attachment.some((e) => attachmentIsImage(e))) return !1;
        }
        if (e.attachmentVideo) {
          if (!i._marl.hasAttachments) return !1;
          if (!i.object.attachment.some((e) => attachmentIsVideo(e))) return !1;
        }
        if (e.attachmentSound) {
          if (!i._marl.hasAttachments) return !1;
          if (!i.object.attachment.some((e) => attachmentIsSound(e))) return !1;
        }
        if (e.attachmentNoAltText) {
          if (!i._marl.hasAttachments) return !1;
          if (!i.object.attachment.some((e) => null === e.name)) return !1;
        }
        if (e.attachmentWithAltText) {
          if (!i._marl.hasAttachments) return !1;
          if (!i.object.attachment.some((e) => e.name)) return !1;
        }
        if (!e.visibilityPublic && "public" === i._marl.visibility[0]) return !1;
        if (!e.visibilityUnlisted && "unlisted" === i._marl.visibility[0]) return !1;
        if (!e.visibilityFollowers && "followers" === i._marl.visibility[0]) return !1;
        if (!e.visibilityMentioned && "mentioned" === i._marl.visibility[0]) return !1;
        for (const t in this.languages)
          if (
            e.hasOwnProperty("lang_" + t) &&
            !1 === e["lang_" + t] &&
            (i._marl.langs.includes(t) || 0 === i._marl.langs.length)
          )
            return !1;
        for (const t of this.sources) {
          const s = t.id;
          if (e.hasOwnProperty("actor_" + s) && !1 === e["actor_" + s] && i._marl.source === s) return !1;
        }
        return !0;
      });
    },
    get listHashtags() {
      return this.listTags("Hashtag");
    },
    get listMentions() {
      return this.listTags("Mention");
    },
    listTags(e) {
      let t = "";
      switch (e) {
        case "Mention":
          t = "mentions";
          break;
        case "Hashtag":
          t = "hashtags";
      }
      let i = this.filteredToots.reduce((i, s) => {
        if (tootHasTags(s))
          for (const a in s.object.tag) {
            const n = s.object.tag[a];
            n.type &&
              n.type === e &&
              n.name &&
              n.name.toLowerCase().indexOf(this.tagsFilters[t].toLowerCase()) >= 0 &&
              (i.some((e) => e.name === n.name)
                ? i.map((e) => {
                    e.name === n.name && e.nb++;
                  })
                : i.push({ name: n.name, href: n.href, nb: 1 }));
          }
        return i;
      }, []);
      return i.sort((e, t) => (e.nb === t.nb ? e.name.localeCompare(t.name) : t.nb - e.nb)), i;
    },
    get listBoostsAuthors() {
      let e = this.boostsAuthors.reduce(
        (e, t) => (t.name.toLowerCase().indexOf(this.tagsFilters.boostsAuthors.toLowerCase()) >= 0 && e.push(t), e),
        []
      );
      return (
        e.sort((e, t) => {
          if (e.nb === t.nb) {
            let i = 0 === e.name.indexOf("? "),
              s = 0 === t.name.indexOf("? ");
            return i && s ? e.name.localeCompare(t.name) : i ? 1 : s ? -1 : e.name.localeCompare(t.name);
          }
          return e.nb === t.nb ? e.name.localeCompare(t.name) : t.nb - e.nb;
        }),
        e
      );
    },
    get sortedLanguages() {
      let e = [];
      for (const t in this.languages) e.push([t, this.languages[t]]);
      return (
        e.sort((e, t) =>
          "undefined" === e[0] ? 1 : "undefined" === t[0] ? -1 : e[1] === t[1] ? e[0].localeCompare(t[0]) : t[1] - e[1]
        ),
        e
      );
    },
    get appReady() {
      return !(this.loading || !this.sources.length);
    },
    get totalPages() {
      return Math.ceil(this.filteredToots.length / Alpine.store("ui").pageSize);
    },
    get pagedToots() {
      const e = Alpine.store("ui").pageSize;
      return this.filteredToots
        ? this.filteredToots.filter((t, i) => {
            let s = (this.currentPage - 1) * e,
              a = this.currentPage * e;
            if (i >= s && i < a) return !0;
          })
        : [];
    },
    sortToots() {
      const e = Alpine.store("ui").sortAsc;
      this.toots.sort((t, i) => (e ? t.published.localeCompare(i.published) : i.published.localeCompare(t.published))),
        scrollTootsToTop(),
        pagingUpdated();
    },
    checkPagingValue() {
      this.currentPage < 1
        ? (this.currentPage = 1)
        : this.currentPage > this.totalPages && (this.currentPage = this.totalPages);
    },
    nextPage(e) {
      this.currentPage * Alpine.store("ui").pageSize < this.filteredToots.length &&
        (this.currentPage++, scrollTootsToTop(e), pagingUpdated());
    },
    prevPage(e) {
      this.currentPage > 1 && (this.currentPage--, scrollTootsToTop(e), pagingUpdated());
    },
    firstPage(e) {
      (this.currentPage = 1), scrollTootsToTop(e), pagingUpdated();
    },
    lastPage(e) {
      (this.currentPage = this.totalPages), scrollTootsToTop(e), pagingUpdated();
    },
  },
  lightboxStore = {
    resetState() {
      (this.show = !1), (this.data = []), (this.source = 0), (this.index = 0), (this.origin = "");
    },
    open(e, t, i) {
      (this.data = e.object.attachment),
        (this.source = e._marl.source),
        (this.show = !0),
        (this.index = t),
        (this.origin = i),
        document.getElementById("main-section-inner").setAttribute("inert", !0),
        setTimeout(() => {
          document.getElementById("lightbox").focus();
        }, 50);
    },
    openProfileImg(e, t, i) {
      let s = "";
      localMode() && (s = Alpine.store("files").sources[i][e].type);
      const a = { object: { attachment: [{ name: e, url: e, mediaType: s }] }, _marl: { source: i } };
      this.open(a, 0, t);
    },
    close() {
      const e = this.origin;
      (this.data = []),
        (this.index = 0),
        (this.show = !1),
        (this.origin = ""),
        document.getElementById("main-section-inner").removeAttribute("inert"),
        document.getElementById(e).focus();
    },
    showNext() {
      this.index++,
        this.index >= this.data.length && (this.index = 0),
        attachmentIsImage(this.data[this.index]) || this.showNext();
    },
    showPrev() {
      this.index--,
        this.index < 0 && (this.index = this.data.length - 1),
        attachmentIsImage(this.data[this.index]) || this.showPrev();
    },
  },
  uiStore = {
    log: [],
    defaultOptions: {
      lang: "en",
      theme: "light",
      sortAsc: !0,
      pageSize: 10,
      combinePanels: !1,
      defaultPanel: "auto",
      simplifyPostsDisplay: !1,
    },
    resetState() {
      (this.pagingOptionsVisible = !1),
        (this.actorPanel = 0),
        (this.mobileLayout = !1),
        (this.appLangs = appLangs ?? { en: "English" }),
        (this.errorInLog = !1),
        (this.log = this.log ?? []),
        (this.lang = this.defaultOptions.lang),
        (this.theme = this.defaultOptions.theme),
        (this.sortAsc = this.defaultOptions.sortAsc),
        (this.pageSize = this.defaultOptions.pageSize),
        (this.combinePanels = this.defaultOptions.combinePanels),
        (this.activePanel = this.defaultOptions.activePanel),
        (this.defaultPanel = this.defaultOptions.defaultPanel),
        (this.simplifyPostsDisplay = this.defaultOptions.simplifyPostsDisplay),
        loadPref("lang"),
        loadPref("theme"),
        loadPref("sortAsc"),
        loadPref("pageSize"),
        loadPref("combinePanels"),
        loadPref("activePanel"),
        loadPref("defaultPanel"),
        loadPref("simplifyPostsDisplay");
    },
    changeDefault(e, t) {
      switch (e) {
        case "sortAsc":
        case "combinePanels":
        case "simplifyPostsDisplay":
          t = !!t;
          break;
        case "pageSize":
          if ("number" != typeof (t = +t) || isNaN(t) || 0 === t) return;
          break;
        case "defaultPanel":
          if (!validPanel(t)) return;
          this.defaultOptions.activePanel = t;
          break;
        case "theme":
          if (!validTheme(t)) return;
          setTheme(t);
          break;
        case "lang":
          if (!validLang(t)) return;
          break;
        default:
          return;
      }
      this.defaultOptions[e] = t;
    },
    logMsg(e, t) {
      let i = {
        msg: e,
        type: (t = t ?? "info"),
        time: new Date().toLocaleTimeString(Alpine.store("ui").lang, {
          hour12: !1,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      };
      this.log.unshift(i), "error" === t && (this.errorInLog = !0);
    },
    toggleTheme() {
      (this.theme = "light" === this.theme ? "dark" : "light"), savePref("theme", this.theme), setTheme(this.theme);
    },
    setOption(e) {
      const t = this[e];
      savePref(e, t),
        "combinePanels" === e && this.checkMobileLayout(),
        "sortAsc" === e && Alpine.store("files").sortToots(),
        "pageSize" === e && Alpine.store("files").checkPagingValue();
    },
    togglePagingOptions() {
      (this.pagingOptionsVisible = !this.pagingOptionsVisible),
        this.pagingOptionsVisible &&
          setTimeout(() => {
            document.getElementById("paging-options").focus();
          }, 100);
    },
    get pagingOptionsClass() {
      return this.pagingOptionsVisible ? "open" : "";
    },
    openActorPanel(e) {
      (this.actorPanel = e),
        setTimeout(() => {
          document.getElementById("actorpanel-" + e).scrollTop = 0;
        }, 50);
    },
    switchActorPanel(e) {
      let t = this.actorPanel;
      "up" === e
        ? (t++, t >= Alpine.store("files").sources.length && (t = 0))
        : (t--, t < 0 && (t = Alpine.store("files").sources.length - 1)),
        (this.actorPanel = t),
        document.getElementById("actortab-" + t).focus();
    },
    panelClose() {
      if (this.combinePanels) return;
      const e = this.activePanel;
      (this.activePanel = ""),
        this.setInert(),
        "tools" !== e || this.mobileLayout
          ? document.querySelector("#main-section-inner .mobile-menu .menu-" + e).focus()
          : document.getElementById("header-open-tools").focus();
    },
    panelOpen(e, t) {
      (this.activePanel = e),
        this.resetPanels(),
        this.setInert(),
        t &&
          setTimeout(() => {
            document.getElementById("panel-" + e).focus();
          }, 100);
    },
    panelToggle(e) {
      switch (e) {
        case "actor":
        case "filters":
        case "tags":
        case "tools":
          this.activePanel === e
            ? this.combinePanels || this.panelClose()
            : (this.panelOpen(e, !0), savePref("activePanel", e));
      }
    },
    resetPanels() {
      const e = this.activePanel;
      if (
        (document.querySelectorAll(`#panel-${e} details[open]`).forEach((e) => {
          e.removeAttribute("open");
        }),
        "actor" === e)
      ) {
        const e = "actorpanel-" + this.actorPanel;
        setTimeout(() => {
          document.getElementById(e).scrollTop = 0;
        }, 250);
      } else
        setTimeout(() => {
          document.getElementById("panel-" + e).scrollTop = 0;
        }, 250);
    },
    checkMobileLayout() {
      const e = document.getElementById("mobile-menu"),
        t = "none" !== window.getComputedStyle(e, null).display;
      (this.mobileLayout = !!t), this.setInert();
    },
    setInertMain() {
      document
        .querySelectorAll("#main-section-inner > *:not(.mobile-menu, .panel-backdrop, #panel-" + this.activePanel)
        .forEach((e) => {
          e.setAttribute("inert", !0);
        });
    },
    setInertPanels() {
      this.combinePanels ||
        document.querySelectorAll("#panel-actor, #panel-filters, #panel-tags, #panel-tools").forEach((e) => {
          e.setAttribute("inert", !0);
        });
    },
    setInertTools() {
      document.querySelectorAll("#panel-tools").forEach((e) => {
        e.setAttribute("inert", !0);
      });
    },
    setInert() {
      document.querySelectorAll("#main-section-inner > *").forEach((e) => {
        e.removeAttribute("inert");
      }),
        this.combinePanels
          ? this.setInertPanels()
          : this.mobileLayout
          ? this.activePanel
            ? this.setInertMain()
            : this.setInertPanels()
          : "tools" === this.activePanel
          ? this.setInertMain()
          : this.setInertTools();
    },
    get appClasses() {
      let e = [];
      return (
        this.combinePanels && e.push("combine-panels"), this.simplifyPostsDisplay && e.push("simplify-posts-display"), e
      );
    },
    get appInsideClasses() {
      let e = [];
      return this.activePanel ? e.push("menu-open menu-open-" + this.activePanel) : e.push("menu-closed"), e;
    },
  };
