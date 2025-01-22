function loadZipFiles(files) {
  if (Alpine.store("files").loading) {
    return;
  }

  const firstLoad = Alpine.store("files").sources.length === 0;
  if (firstLoad) {
    resetStores();
  }
  Alpine.store("files").loading = true;

  // build queue
  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    if (zipFileAlreadyLoaded(file)) {
      continue;
    }

    marlConsole(`Loading file: <b>${file.name}</b>`, "info");
    Alpine.store("files").loadingQueue.push(file);
  }

  startQueue();
}

function startQueue() {
  if (Alpine.store("files").loadingQueue.length) {
    unzipFirstFile();
  } else {
    endQueue();
  }
}

function unzipFirstFile() {
  const file = Alpine.store("files").loadingQueue[0];
  const fileId = file.name + file.size;

  if (Alpine.store("files").currentlyLoading[fileId] && Alpine.store("files").currentlyLoading[fileId].working) {
    return false; // ### useful?
  }

  Alpine.store("files").currentlyLoading[fileId] = {
    error: false,
    working: true,
    // JSON data:
    actor: false,
    outbox: false,
    likes: false,
    bookmarks: false,
    // actor images:
    avatar: false,
    header: false,
  };
  Alpine.store("files").currentlyLoadingId = fileId;
  Alpine.store("files").currentlyLoadingName = file.name;

  unzipStart(file);
}

function unzipStart(file) {
  JSZip.loadAsync(file).then(
    (content) => {
      let root = checkZipStructure(content, file.name);
      if (root === false) {
        abortLoading(Alpine.store("files").currentlyLoadingId, "critical file is missing in archive");
        return;
      } else if (root === true) {
        root = "";
      } else {
        root += "/";
      }

      const index = Alpine.store("files").sources.length;

      Alpine.store("files").sources[index] = {
        id: index,
        fileInfos: {
          id: file.name + file.size,
          name: file.name,
          size: file.size,
          lastModified: file.lastModified,
          archiveRoot: root,
        },
        nbToots: 0,

        actor: {},
        outbox: {},
        likes: [],
        bookmarks: [],
        avatar: {},
        header: {},
      };

      Alpine.store("files").sources[index]._raw = content.files;

      unpackJsonFile("actor", index);
      unpackJsonFile("outbox", index);
      unpackJsonFile("likes", index);
      unpackJsonFile("bookmarks", index);
    },
    (error) => {
      // JSZip error - likely unexpected file format or corrupted file
      const msg = `Error loading <b>${file.name}</b>: ${error.message}`;
      console.error(msg);
      marlConsole(msg, "error");
      abortLoading(Alpine.store("files").currentlyLoadingId, msg);
    }
  );
}

function checkZipStructure(content, filename) {
  let r = true;
  let msgs = [];
  if (content.files["actor.json"] === undefined) {
    const msg = `<b>${filename}</b>: File "actor.json" not found in archive root.`;
    msgs.push({ txt: msg, cls: "warn" });
    r = false;
  }
  if (content.files["outbox.json"] === undefined) {
    const msg = `<b>${filename}</b>: File "outbox.json" not found in archive root.`;
    msgs.push({ txt: msg, cls: "warn" });
    r = false;
  }

  if (!r) {
    let pathActor, pathOutbox;

    const testActor = content.file(/actor.json$/);
    if (testActor.length) {
      pathActor = testActor[0].name.split("/");
      pathActor.pop();
      pathActor = pathActor.join("/");
    }

    const testOutbox = content.file(/outbox.json$/);
    if (testOutbox.length) {
      pathOutbox = testOutbox[0].name.split("/");
      pathOutbox.pop();
      pathOutbox = pathOutbox.join("/");
    }

    if (pathActor && pathOutbox) {
      if (pathActor === pathOutbox) {
        r = pathActor;
        const msg = `<b>${filename}</b>: "outbox.json" and "actor.json" both found in the same subfolder (<b>${pathActor}</b>). We'll assume everything else is in that folder too.`;
        msgs.push({ txt: msg, cls: "warn" });
      } else {
        const msg = `<b>${filename}</b>: incoherent structure ("actor.json" and "outbox.json" are not in the same location). Unable to load this archive.`;
        msgs.push({ txt: msg, cls: "error" });
      }
    } else {
      const msg = `<b>${filename}</b>: missing critical files ("actor.json" and/or "outbox.json"). Unable to load this archive.`;
      msgs.push({ txt: msg, cls: "error" });
    }
  }

  if (msgs.length) {
    msgs.forEach((msg) => {
      console.warn(msg.txt);
      marlConsole(msg.txt, msg.cls);
    });
  }

  return r;
}

function unpackJsonFile(name, index) {
  const content = Alpine.store("files").sources[index]._raw;
  const fileInfos = Alpine.store("files").sources[index].fileInfos;
  const path = fileInfos.archiveRoot + name + ".json";

  if (content[path] === undefined && (name === "likes" || name === "bookmarks")) {
    // we can still run the app without those files
    const msg = `<b>${fileInfos.name}</b>: File ${name}.json not found in archive.`;
    console.warn(msg);
    marlConsole(msg, "warn");
    Alpine.store("files").currentlyLoading[Alpine.store("files").currentlyLoadingId][name] = true;
    return;
  }

  content[path].async("text").then(function (txt) {
    let data = JSON.parse(txt);
    loadJsonData(name, data, index);
  });
}

function loadJsonData(name, data, index) {
  if (name === "actor") {
    Alpine.store("files").sources[index].actor = data;
    loadActorImages(index);
    Alpine.store("files").currentlyLoading[Alpine.store("files").currentlyLoadingId].actor = true;
  } // actor.json

  if (name === "outbox") {
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
    Alpine.store("files").currentlyLoading[Alpine.store("files").currentlyLoadingId].outbox = true;
  } // outbox.json

  if (name === "likes" || name === "bookmarks") {
    Alpine.store("files").sources[index][name] = data.orderedItems;
    Alpine.store("files").currentlyLoading[Alpine.store("files").currentlyLoadingId][name] = true;
  } // likes.json || bookmarks.json

  unzipEnd();
}

function loadActorImages(index) {
  const actor = Alpine.store("files").sources[index].actor;
  const root = Alpine.store("files").sources[index].fileInfos.archiveRoot;
  const content = Alpine.store("files").sources[index]._raw;

  if (actor.icon && actor.icon.type === "Image" && actor.icon.url && content[root + actor.icon.url]) {
    const image = actor.icon;
    content[root + image.url].async("base64").then(function (content) {
      Alpine.store("files").sources[index].avatar = {
        type: image.mediaType,
        content: content,
        noImg: false,
      };
      Alpine.store("files").currentlyLoading[Alpine.store("files").currentlyLoadingId].avatar = true;
      unzipEnd();
    });
  } else {
    Alpine.store("files").sources[index].avatar = { noImg: true };
    Alpine.store("files").currentlyLoading[Alpine.store("files").currentlyLoadingId].avatar = true;
  }

  if (actor.image && actor.image.type === "Image" && actor.image.url && content[root + actor.image.url]) {
    const image = actor.image;
    content[root + image.url].async("base64").then(function (content) {
      Alpine.store("files").sources[index].header = {
        type: image.mediaType,
        content: content,
        noImg: false,
      };
      Alpine.store("files").currentlyLoading[Alpine.store("files").currentlyLoadingId].header = true;
      unzipEnd();
    });
  } else {
    Alpine.store("files").sources[index].header = { noImg: true };
    Alpine.store("files").currentlyLoading[Alpine.store("files").currentlyLoadingId].header = true;
  }

  unzipEnd();
}

function abortLoading(msg) {
  const fileId = Alpine.store("files").currentlyLoadingId;
  Alpine.store("files").currentlyLoading[fileId].error = msg;
  unzipEnd();
}

function unpackingFinished() {
  const fileId = Alpine.store("files").currentlyLoadingId;
  const status = Alpine.store("files").currentlyLoading[fileId];
  if (
    status.error ||
    (status.actor && status.outbox && status.likes && status.bookmarks && status.avatar && status.header)
  ) {
    return true;
  }

  return false;
}

function unzipEnd() {
  const fileId = Alpine.store("files").currentlyLoadingId;
  if (!unpackingFinished()) {
    return;
  }

  Alpine.store("files").currentlyLoading[fileId].working = false;
  Alpine.store("files").loadingQueue.shift();
  Alpine.store("files").currentlyLoadingId = "";
  Alpine.store("files").currentlyLoadingName = "";

  startQueue();
}

function endQueue() {
  Alpine.store("files").loading = false;
}
