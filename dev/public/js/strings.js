const appLangs = [
  ["en", "English"],
  ["fr", "Français"],
];

const appStrings = {
  en: {
    welcome: {
      title: "Welcome to {appName}",
      p1: `MARL allows you to explore the content of your Mastodon archive file in a
        user-friendly interface. Everything takes place in the browser: your archive stays
        strictly on your computer; none of its data is sent to any server.`,
      p2: `You can request your Mastodon archive by logging into your account on the web,
        then visiting "Preferences > Import and export > Request your archive".<br />
        <strong>Please note:</strong> only ZIP files are supported (not GZ).`,
      p3: `<strong>Start by opening your archive file with MARL.</strong><br />
        You can drag and drop it anywhere on this page, or
        {labelStart}click here to select it{labelEnd}.`,
      projectPage: `Project page (github)`,
    },
    misc: {
      loading: "Loading",
      closePanelBtn: "Close panel",
    },
    menu: {
      profile: "Profile",
      filters: "Filters",
      filtersActive: "some filters are active",
      tags: "Tags",
      newFile: "New File",
      newFileConfirm: "Discard current data and load a new archive file?",
    },
    lightbox: {
      next: "Next image",
      prev: "Previous image",
      close: "Close image",
    },
    actor: {
      accountInfo: "Account info",
      accounts: "Accounts",
      noAvatarImage: "No avatar image",
      noHeaderImage: "No header image",
      headerImage: "Header",
      memberSince: "Member since",
      countPosts: "posts",
      countInArchive: "in archive",
      countDiffWhy: "Why are those two numbers different?",
      countDiffExplanation: `Posts that are not directly hosted on your instance are kept
        in a cache by your instance for a given time, after what they are deleted from that
        cache. Posts that are not in your instance cache any more are not included in your
        archive. This affects boosts, likes, and bookmarks.`,
      rawData: "Raw data {fileName}",
      favorites: "Favorites",
      favoritesEmpty: "no favorites",
      bookmarks: "Bookmarks",
      bookmarksEmpty: "no bookmarks",
    },
    filters: {
      panelTitle: "Filter posts",
      panelNotice: `The list of posts will be automatically updated based on the active
        filters below.`,
      fullText: "Full text",
      hashtagText: "Hashtags",
      mentionText: "Mentions",
      externalLink: "External links",
      summary: "Summary (CW)",
      isEdited: "Has been edited",
      isDuplicate: "Non-exact duplicates",

      mustContain: "Must contain",
      hasHashtags: "Hashtag(s)",
      hasMentions: "Mention(s)",
      hasExternalLink: "External link(s)",
      hasSummary: "Summary (CW)",

      type: "Type",
      typeOriginal: "Original posts (incl. replies)",
      typeBoost: "Boosts",
      noStartingAt: 'Does not start with "@"',
      isSensitive: "Marked as sensitive",

      mustHaveAttachement: "Must have attachment",
      attachmentAny: "Any type",
      attachmentImage: "Image(s)",
      attachmentVideo: "Video(s)",
      attachmentSound: "Sound(s)",
      attachmentNoAltText: "Without alt text",
      attachmentWithAltText: "With alt text",

      visibility: "Visibility",
      visibilityPublic: "Public",
      visibilityUnlisted: "Unlisted",
      visibilityFollowers: "Followers only",
      visibilityMentioned: "Mentioned people only",

      language: "Language",
      author: "Author",

      resetFilters: "Reset filters",
    },
    header: {
      countLabel: "posts",
      oldestFirst: "oldest first",
      latestFirst: "latest first",
      reverse: "Reverse",
      loadNewFile: "Load new file",
    },
    paging: {
      first: "First",
      prev: "Prev",
      next: "Next",
      last: "Last",
      pagingOptions: "Paging options",
      page: "Page",
      postsPerPage: "posts per page",
      reverseOrder: "Reverse order",
    },
    posts: {
      panelTitle: "Posts",
      noResults: "No results for the specified filters",
      noPostsError: "No posts found in archive (?!)",
    },
    post: {
      by: "by",
      lastUpdated: "Last updated",
      linkToPost: "link",
      attachmentNoAlt: "No description provided",
      attachmentInArchive: "In archive:",
      people: "People",
      hashtags: "Hashtags",
      extLinks: "External links",
      rawData: "Raw data",
    },
    tags: {
      panelTitle: "Tags",
      hashtags: "Hashtags",
      mentions: "Mentions",
      boosts: "Boosted users",
      hashtagsFilter: "Filter hashtags",
      mentionsFilter: "Filter mentions",
      boostsFilter: "Filter boosted users",
    },
  },

  fr: {
    welcome: {
      title: "Bienvenue dans {appName}",
      p1: `MARL vous permet d'explorer le contenu de votre archive Mastodon dans une
        interface simple d'utilisation. Tout se passe dans votre navigateur : votre archive
        reste sur votre appareil; aucune donnée n'est envoyée à aucun serveur.`,
      p2: `Vous pouvez demander votre archive Mastodon en vous identifiant avec votre compte
        sur le web, puis en visitant "Préférences >Import et export >Demandez vos archives".<br />
        <strong>Important :</strong> seuls les fichiers ZIP sont acceptés (pas les fichiers GZ).`,
      p3: `<strong>Commencez par ouvrir votre archive avec MARL.</strong><br />
        Vous pouvez la glisser-déposer n'importe où sur cette page, ou
        {labelStart}cliquer ici pour la sélectionner{labelEnd}.`,
      projectPage: `Page du project (github)`,
    },
    misc: {
      loading: "Loading",
      closePanelBtn: "Close panel",
    },
    menu: {
      profile: "Profile",
      filters: "Filters",
      filtersActive: "some filters are active",
      tags: "Tags",
      newFile: "New File",
      newFileConfirm: "Discard current data and load a new archive file?",
    },
    lightbox: {
      next: "Next image",
      prev: "Previous image",
      close: "Close image",
    },
    actor: {
      accountInfo: "Account info",
      accounts: "Accounts",
      noAvatarImage: "No avatar image",
      noHeaderImage: "No header image",
      headerImage: "Header",
      memberSince: "Member since",
      countPosts: "posts",
      countInArchive: "in archive",
      countDiffWhy: "Why are those two numbers different?",
      countDiffExplanation: `Posts that are not directly hosted on your instance are kept
        in a cache by your instance for a given time, after what they are deleted from that
        cache. Posts that are not in your instance cache any more are not included in your
        archive. This affects boosts, likes, and bookmarks.`,
      rawData: "Raw data {fileName}",
      favorites: "Favorites",
      favoritesEmpty: "no favorites",
      bookmarks: "Bookmarks",
      bookmarksEmpty: "no bookmarks",
    },
    filters: {
      panelTitle: "Filter posts",
      panelNotice: `The list of posts will be automatically updated based on the active
        filters below.`,
      fullText: "Full text",
      hashtagText: "Hashtags",
      mentionText: "Mentions",
      externalLink: "External links",
      summary: "Summary (CW)",
      isEdited: "Has been edited",
      isDuplicate: "Non-exact duplicates",

      mustContain: "Must contain",
      hasHashtags: "Hashtag(s)",
      hasMentions: "Mention(s)",
      hasExternalLink: "External link(s)",
      hasSummary: "Summary (CW)",

      type: "Type",
      typeOriginal: "Original posts (incl. replies)",
      typeBoost: "Boosts",
      noStartingAt: 'Does not start with "@"',
      isSensitive: "Marked as sensitive",

      mustHaveAttachement: "Must have attachment",
      attachmentAny: "Any type",
      attachmentImage: "Image(s)",
      attachmentVideo: "Video(s)",
      attachmentSound: "Sound(s)",
      attachmentNoAltText: "Without alt text",
      attachmentWithAltText: "With alt text",

      visibility: "Visibility",
      visibilityPublic: "Public",
      visibilityUnlisted: "Unlisted",
      visibilityFollowers: "Followers only",
      visibilityMentioned: "Mentioned people only",

      language: "Language",
      author: "Author",

      resetFilters: "Reset filters",
    },
    header: {
      countLabel: "posts",
      oldestFirst: "oldest first",
      latestFirst: "latest first",
      reverse: "Reverse",
      loadNewFile: "Load new file",
    },
    paging: {
      first: "First",
      prev: "Prev",
      next: "Next",
      last: "Last",
      pagingOptions: "Paging options",
      page: "Page",
      postsPerPage: "posts per page",
      reverseOrder: "Reverse order",
    },
    posts: {
      panelTitle: "Posts",
      noResults: "No results for the specified filters",
      noPostsError: "No posts found in archive (?!)",
    },
    post: {
      by: "by",
      lastUpdated: "Last updated",
      linkToPost: "link",
      attachmentNoAlt: "No description provided",
      attachmentInArchive: "In archive:",
      people: "People",
      hashtags: "Hashtags",
      extLinks: "External links",
      rawData: "Raw data",
    },
    tags: {
      panelTitle: "Tags",
      hashtags: "Hashtags",
      mentions: "Mentions",
      boosts: "Boosted users",
      hashtagsFilter: "Filter hashtags",
      mentionsFilter: "Filter mentions",
      boostsFilter: "Filter boosted users",
    },
  },
};
