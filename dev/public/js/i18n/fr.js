appStrings["fr"] = {
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
  },
  misc: {
    loading: "Chargement",
    criticalFailure: "Erreur fatale",
    closePanelBtn: "Fermer le panneau",
  },
  menu: {
    profile: "Profil",
    filters: "Filtres",
    filtersActive: "certains filtres sont actifs",
    tags: "Tags",
    tools: "Outils",
  },
  lightbox: {
    next: "Image suivante",
    prev: "Image précédente",
    close: "Fermer l'image",
  },
  actor: {
    accountInfo: "Infos du compte",
    accounts: "Comptes",
    noAvatarImage: "Pas d'avatar",
    noHeaderImage: "pas d'image d'en-tête",
    headerImage: "En-tête",
    memberSince: "Membre depuis",
    countPosts: "posts",
    countInArchive: "dans l'archive",
    countDiffWhy: "Pourquoi ces deux nombres sont-ils différents ?",
    countDiffExplanation: `Les posts qui ne sont pas hébergés directement sur votre instance
        sont gardés en cache par celle-ci pour une durée limitée, après quoi ils sont supprimés
        de ce cache. Les posts qui ne sont plus présents dans le cache de votre instance ne sont
        pas inclus dans votre archive. Cela concerne les partages, les favoris et les marque-pages.`,
    rawData: "Données brutes {fileName}",
    likes: "Favoris",
    likesEmpty: "aucun favori",
    bookmarks: "Marque-pages",
    bookmarksEmpty: "aucun marque-page",
  },
  filters: {
    panelTitle: "Filtrer les posts",
    panelNotice: `La liste des posts sera automatiquement mise à jour en fonction des filtres
        activés ci-dessous.`,
    fullText: "Partout",
    hashtagText: "Hashtags",
    mentionText: "Mentions",
    externalLink: "Liens externes",
    summary: "Avertissement de contenu",
    isEdited: "A été modifié",
    isDuplicate: "Doublons imparfaits",

    mustContain: "Doit contenir",
    hasHashtags: "Hashtag(s)",
    hasMentions: "Mention(s)",
    hasExternalLink: "Lien(s) externe(s)",
    hasSummary: "Avertissement de contenu",

    type: "Type",
    typeOriginal: "Posts originaux (y.c. réponses)",
    typeBoost: "Partages",
    startingAt: 'Commence par "@"',
    noStartingAt: 'Ne commence pas par "@"',
    isSensitive: "Marqué comme sensible",

    mustHaveAttachement: "Doit avoir un fichier joint",
    attachmentAny: "N'importe quel type",
    attachmentImage: "Image(s)",
    attachmentVideo: "Vidéo(s)",
    attachmentSound: "Son(s)",
    attachmentNoAltText: "Sans description alternative",
    attachmentWithAltText: "Avec description alternative",

    visibility: "Confidentialité",
    visibilityPublic: "Public",
    visibilityUnlisted: "Public discret",
    visibilityFollowers: "Abonnés",
    visibilityMentioned: "Personnes spécifiques",

    language: "Langue",
    author: "Auteur",

    resetFilters: "Réinitialiser les filtres",
  },
  header: {
    countLabel: "posts",
    oldestFirst: "les plus anciens d'abord",
    latestFirst: "les plus récents d'abord",
    reverse: "Inverser",
    loadNewFile: "Charger un nouveau fichier",
  },
  paging: {
    first: "Première",
    prev: "Précédente",
    next: "Suivante",
    last: "Dernière",
    pagingOptions: "Options de pagination",
    page: "Page",
    postsPerPage: "posts par page",
    reverseOrder: "Inverser l'ordre",
  },
  posts: {
    panelTitle: "Posts",
    noResults: "Pas de résultats pour les filtres spécifiés",
    noPostsError: "Aucun post trouvé dans l'archive",
  },
  post: {
    by: "par",
    lastUpdated: "Dernière modification",
    linkToPost: "lien",
    attachmentNoAlt: "Aucune description fournie",
    attachmentInArchive: "Dans l'archive :",
    attachmentNotFound: "⚠️ Média introuvable à l'emplacement indiqué",
    people: "Personnes",
    hashtags: "Hashtags",
    extLinks: "Liens externes",
    rawData: "Données brutes",
  },
  tags: {
    panelTitle: "Tags",
    hashtags: "Hashtags",
    mentions: "Mentions",
    boosts: "Utilisateurs partagés",
    hashtagsFilter: "Filtrer les hashtags",
    mentionsFilter: "Filtrer les mentions",
    boostsFilter: "Filter utilisateurs partagés",
  },
  tools: {
    panelTitle: "Outils",
    appSettings: "Réglages de l'app",
    selectLanguage: "Choisir la langue",
    useDarkTheme: "Utiliser le thème sombre",
    useLightTheme: "Utiliser le thème clair",
    collapsePanels: "Combiner les panneaux",
    collapsePanelsDesc:
      "(Sur les écrans larges) Cacher les panneaux et afficher une barre d'outil verticale à la place",
    simplifyPostsDisplay: "Simplifier l'affichage des posts",
    simplifyPostsDisplayDesc: "Cacher certains éléments techniques ou non-essentiels",
    loadedFiles: "Fichiers chargés",
    loadedRemotes: "Archives chargées",
    addAnother: "Ajouter une autre archive",
    addAnotherTip:
      "Astuce: Vous pouvez ouvrir plusieurs archives en même temps.<br>Vous pouvez aussi glisser-déposer vos fichiers d'archive n'importe où dans cette fenêtre.",
    startOver: "Recommencer",
    startOverConfirm: "Repartir de zéro et charger un nouveau fichier ?",
    appLog: "Journal",
    projectPage: `Page du project (github)`,
  },
};
