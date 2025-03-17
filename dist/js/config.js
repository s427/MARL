/*

This file is used to determine whether MARL operates in LOCAL or SERVER mode.
For more information, please read the "server-mode.md" documentation file.

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

const servers = [
  "http://devs/MARL/example-data/archive2",
  "http://devs/MARL/example-data/archive1",
  // "../example-data/archive3",
];
