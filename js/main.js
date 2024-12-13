// stores definitions

const userPrefsStore = {
  prefix: "marl_",

  save(pref, value) {
    localStorage.setItem(this.prefix + pref, value);
  },
  load(pref) {
    const value = localStorage.getItem(this.prefix + pref);
    if (value !== null) {
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
        if (
          typeof value == "number" &&
          !isNaN(value) &&
          value > 0 &&
          value !== Alpine.store("files").pageSize
        ) {
          Alpine.store("files").pageSize = value;
        }
        break;
    }
  },
};

const filesStore = {
  resetState() {
    this.sources = [];
    this.toots = [];
    this.toc = [];
    this.duplicates = false;

    this.sortAsc = true; // -> userPrefs
    this.pageSize = 10; // -> userPrefs
    this.currentPage = 1;

    this.loading = false;
    this.someFilesLoaded = false;

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

      // automatically generated (see loadJsonFile()):
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
        if (t._marl.textContent) {
          const filterValue = f.fullText.toLowerCase();

          if (
            filterValue &&
            t._marl.textContent &&
            t._marl.textContent.indexOf(filterValue) >= 0
          ) {
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
              return (
                t.type === "Hashtag" &&
                t.name.toLowerCase().indexOf(filterValue) > -1
              );
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
              return (
                t.type === "Mention" &&
                t.name.toLowerCase().indexOf(filterValue) > -1
              );
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
        if (
          !(
            typeof t.object === "object" &&
            t.object !== null &&
            t.object.updated
          )
        ) {
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
            return (
              link.href.indexOf(filterValue) > -1 ||
              link.text.indexOf(filterValue) > -1
            );
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
            tag.name
              .toLowerCase()
              .indexOf(this.tagsFilters[filterSource].toLowerCase()) >= 0
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
      if (
        item.name
          .toLowerCase()
          .indexOf(this.tagsFilters.boostsAuthors.toLowerCase()) >= 0
      ) {
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
    if (this.sources.length === 0) {
      return false;
    }

    let r = true;
    for (let i = 0; i < this.sources.length; i++) {
      const source = this.sources[i];
      if (
        !source.loaded.actor ||
        !source.loaded.avatar ||
        !source.loaded.header ||
        !source.loaded.outbox ||
        !source.loaded.likes ||
        !source.loaded.bookmarks
      ) {
        r = false;
      }
    }
    return r;
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
    this.sortToots();
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
    const data = {
      object: {
        attachment: [
          {
            name: name,
            url: name,
            mediaType: Alpine.store("files").sources[source][name].type,
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
  resetState() {
    this.pagingOptionsVisible = false;
    this.openMenu = "";
    this.actorPanel = 0;
    this.menuIsActive = false;
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
    document
      .querySelector("#main-section-inner .mobile-menu .menu-" + name)
      .focus();
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
    setTimeout(() => {
      document.getElementById("panel-" + name).scrollTop = 0;
    }, 250);
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
  setInert() {
    // set the 'inert' state on the side panels (actor, filters, tags)
    // depending on whether they are hidden or not, AND whether the
    // mobile menu is active

    document.querySelectorAll("#main-section-inner > *").forEach((e) => {
      e.removeAttribute("inert");
    });

    if (this.menuIsActive) {
      if (this.openMenu) {
        document
          .querySelectorAll(
            "#main-section-inner > *:not(.mobile-menu, .panel-backdrop, #panel-" +
              this.openMenu
          )
          .forEach((e) => {
            e.setAttribute("inert", true);
          });
      } else {
        document
          .querySelectorAll("#panel-actor, #panel-filters, #panel-tags")
          .forEach((e) => {
            e.setAttribute("inert", true);
          });
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

// utils

function resetStores() {
  Alpine.store("files").resetState();
  Alpine.store("lightbox").resetState();
  Alpine.store("ui").resetState();

  Alpine.store("userPrefs").load("sortAsc");
  Alpine.store("userPrefs").load("pageSize");
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
      console.warn("File already loaded:", file.name);
      continue;
    }

    let index = Alpine.store("files").sources.length;

    Alpine.store("files").sources[index] = {
      id: index,
      fileInfos: {
        name: file.name,
        size: file.size,
        lastModified: file.lastModified,
      },
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

    JSZip.loadAsync(file).then(function (content) {
      Alpine.store("files").sources[index]._raw = content.files;

      loadJsonFile("actor", index);
      loadJsonFile("outbox", index);
      loadJsonFile("likes", index);
      loadJsonFile("bookmarks", index);
    });
  }

  setHueForSources();
}

function loadJsonFile(name, index) {
  const content = Alpine.store("files").sources[index]._raw;

  if (content[name + ".json"] === undefined) {
    if (name === "likes" || name === "bookmarks") {
      // we can still run the app without those files
      console.warn(`File ${name}.json not found in archive.`);
      Alpine.store("files").sources[index].loaded[name] = true;
    } else {
      // this should NOT happen and will prevent the app from running
      console.error(`File ${name}.json not found in archive.`);
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

              if (
                url[0] === "https:" &&
                url[3] === "users" &&
                url[5] === "statuses"
              ) {
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
    if (
      typeof t.object === "object" &&
      t.object !== null &&
      t.object.contentMap
    ) {
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

  if (
    actor.icon &&
    actor.icon.type === "Image" &&
    actor.icon.url &&
    content[actor.icon.url]
  ) {
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

  if (
    actor.image &&
    actor.image.type === "Image" &&
    actor.image.url &&
    content[actor.image.url]
  ) {
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
  if (
    attachmentIsImage(att) ||
    attachmentIsVideo(att) ||
    attachmentIsSound(att)
  ) {
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
    return ["public", "Public"];
  }
  if (
    data.to.some((x) => x.indexOf("/followers") > -1) &&
    !data.to.includes("https://www.w3.org/ns/activitystreams#Public") &&
    data.cc.includes("https://www.w3.org/ns/activitystreams#Public")
  ) {
    return ["unlisted", "Unlisted"];
  }
  if (
    data.to.some((x) => x.indexOf("/followers") > -1) &&
    !data.to.includes("https://www.w3.org/ns/activitystreams#Public") &&
    !data.cc.includes("https://www.w3.org/ns/activitystreams#Public")
  ) {
    return ["followers", "Followers only"];
  }
  if (
    !data.to.some((x) => x.indexOf("/followers") > -1) &&
    !data.to.includes("https://www.w3.org/ns/activitystreams#Public") &&
    !data.cc.includes("https://www.w3.org/ns/activitystreams#Public")
  ) {
    return ["mentioned", "Mentioned people only"];
  }
}

function tootHasTags(toot) {
  return (
    typeof toot.object === "object" &&
    toot.object !== null &&
    toot.object.tag &&
    toot.object.tag.length
  );
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
  return date.toLocaleDateString(undefined, dateOptions);
}

function formatDate(data) {
  let date = new Date(data);
  const dateOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleDateString(undefined, dateOptions);
}

function formatNumber(nb) {
  return nb.toLocaleString();
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
  return (
    Alpine.store("files").filters[name] !==
    Alpine.store("files").filtersDefault[name]
  );
}

function startOver() {
  if (confirm("Discard current data and load a new archive file?")) {
    location.reload();
  }
}

// drag'n'drop over entire page

const drag = {
  el: null,

  init(el) {
    this.dropArea = document.getElementById(el);

    ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
      this.dropArea.addEventListener(
        eventName,
        (e) => this.preventDragDefaults(e),
        false
      );
    });
    ["dragenter", "dragover"].forEach((eventName) => {
      this.dropArea.addEventListener(
        eventName,
        () => this.highlightDrag(),
        false
      );
    });
    ["dragleave", "drop"].forEach((eventName) => {
      this.dropArea.addEventListener(
        eventName,
        () => this.unhighlightDrag(),
        false
      );
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

// initialization

document.addEventListener("alpine:init", () => {
  Alpine.store("files", filesStore);
  Alpine.store("lightbox", lightboxStore);
  Alpine.store("ui", uiStore);
  Alpine.store("userPrefs", userPrefsStore);

  resetStores();

  Alpine.effect(() => {
    const pageSize = Alpine.store("files").pageSize;
    const sortAsc = Alpine.store("files").sortAsc;

    Alpine.store("userPrefs").save("pageSize", pageSize);
    Alpine.store("userPrefs").save("sortAsc", sortAsc ? 1 : 0);
  });
});

drag.init("app");
