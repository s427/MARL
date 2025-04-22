/*

This file is used to determine whether MARL operates in LOCAL or SERVER mode.
For more information, please read the "server-mode.md" documentation file.

Important: please rename this file "config.js" if you want to use it.

1. local mode
=============

If the "servers" constant (below) is absent or empty, (or if this file is removed or renamed) MARL will work in LOCAL mode.
Default value:

  const servers = [];

2. server mode
==============

Use the "servers" constant below to indicate the path(s) where MARL can find your archive(s).

If a path is specified, MARL will automatically switch to server mode.

Relative paths are authorized. They should be relative to MARL (index.html), not to this config file.

Example:

  const servers = [
    "../data/archive1/",
    "../data/archive2/",
    "https://my-other-server.net/some-other-path/",
  ];

Each archive file must be already unpacked on the server. The "actor.json" and "outbox.json" files should be stored directly under the specified path.

You may specify as many archives as you want. You can store them wherever you want. In case the archive is stored on a different server from MARL itself, make sure that the server has CORS enabled.

*/

const servers = [];

/*

You can use the following object to change the default options for the app (those are the options found in the tools panel).
Note: Users will still be able to change those options for themselves.

const customPrefs = {};

You can use the following properties. All properties are optional:

- lang: the language for the UI
  possible values: "en" (default), "fr"
  note: if no option is set, the app will attempt to use the same language as the user's browser (if available for the app)

- theme: the theme for the app
  possible values: "light" (default), "dark"
  note: if no option is set, the app will follow the user preference (set in their browser or OS)

- sortAsc: the order of the posts (chronological or not); true means "oldest posts first"
  possible values: true (default), false

- pageSize: the number of posts per page
  possibles values: any number above 0; default is 10; be mindful that large values may slow down the app significantly

- combinePanels: (on large screens) combine the panels into one sidebar
  possible values: true, false (default)

- defaultPanel: if "combinePanels" is active (true), which panel is displayed upon loading the app
  possible values: "actor", "filters", "tags", "tools"
  note: if "combinePanels" is active and if this option is not set, no panel will be initially displayed

- simplifyPostsDisplay: hide some technical or redundant elements in posts display
  possible values: true, false (default)

The folloging options are specific to server mode and not present in the tools panel:

- showActorJson: whether or not to display the full JSON data in the actor panel
  possible values: true, false (default)

- showPostsJson: whether or not to display the full JSON data related to each post
  possible values: true, false (default)
  note: JSON data for posts is always hidden in "simplify post display" mode

Example:

const customPrefs = {
  pageSize: 5,
  combinePanels: true,
  defaultPanel: "actor",
  simplifyPostsDisplay: true,
};

*/
