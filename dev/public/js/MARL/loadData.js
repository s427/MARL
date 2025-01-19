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
  // console.log("unzipFirstFile", fileId);

  if (Alpine.store("files").currentlyLoading[fileId] && Alpine.store("files").currentlyLoading[fileId].working) {
    return false; // ### then what?
  }

  // store which file is currently being unpacked
  // as long as 'working' is true, we do not unzip another file
  // ### actually useful?
  // ### redundant with "loaded" below?
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
  // console.log("unzipStart 1", file);
  JSZip.loadAsync(file).then(
    (content) => {
      if (!zipStructureIsOk(content, file)) {
        abortLoading(Alpine.store("files").currentlyLoadingId, "critical file is missing in archive");
        return;
      }

      // console.log("unzipStart 2", content);
      const index = Alpine.store("files").sources.length;

      Alpine.store("files").sources[index] = {
        id: index,
        fileInfos: {
          id: file.name + file.size,
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

        // loaded: {
        //   actor: false,
        //   avatar: false,
        //   header: false,
        //   outbox: false,
        //   likes: false,
        //   bookmarks: false,
        // }, // ### redundant with currentlyLoading (above)?
      };

      Alpine.store("files").sources[index]._raw = content.files;

      // ### check file structure before going further (?)
      // this should actually be done before inserting anything in "sources"

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

function zipStructureIsOk(content, file) {
  // console.log("zipStructureIsOk?", content);
  let r = true;
  if (content.files["actor.json"] === undefined) {
    const msg = `<b>Critical error - ${file.name}</b>: File "actor.json" not found in archive. Archive cannot be loaded.`;
    console.error(msg);
    marlConsole(msg, "error");
    r = false;
  }
  if (content.files["outbox.json"] === undefined) {
    const msg = `<b>Critical error - ${file.name}</b>: File "outbox.json" not found in archive. Archive cannot be loaded.`;
    console.error(msg);
    marlConsole(msg, "error");
    r = false;
  }
  return r;
}

function unpackJsonFile(name, index) {
  const content = Alpine.store("files").sources[index]._raw;
  const fileInfos = Alpine.store("files").sources[index].fileInfos;

  if (content[name + ".json"] === undefined && (name === "likes" || name === "bookmarks")) {
    // we can still run the app without those files
    const msg = `<b>${fileInfos.name}</b>: File ${name}.json not found in archive.`;
    console.warn(msg);
    marlConsole(msg, "warn");
    // Alpine.store("files").sources[index].loaded[name] = true;
    Alpine.store("files").currentlyLoading[Alpine.store("files").currentlyLoadingId][name] = true;
    return;
  }

  content[name + ".json"].async("text").then(function (txt) {
    let data = JSON.parse(txt);
    loadJsonData(name, data, index);
  });
}

function loadJsonData(name, data, index) {
  if (name === "actor") {
    Alpine.store("files").sources[index].actor = data;
    loadActorImages(index);
    // Alpine.store("files").sources[index].loaded.actor = true;
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
    // Alpine.store("files").sources[index].loaded.outbox = true;
    Alpine.store("files").currentlyLoading[Alpine.store("files").currentlyLoadingId].outbox = true;
  } // outbox.json

  if (name === "likes" || name === "bookmarks") {
    Alpine.store("files").sources[index][name] = data.orderedItems;
    // Alpine.store("files").sources[index].loaded[name] = true;
    Alpine.store("files").currentlyLoading[Alpine.store("files").currentlyLoadingId][name] = true;
  } // likes.json || bookmarks.json

  unzipEnd();
}

function loadActorImages(index) {
  const actor = Alpine.store("files").sources[index].actor;
  const content = Alpine.store("files").sources[index]._raw;

  if (actor.icon && actor.icon.type === "Image" && actor.icon.url && content[actor.icon.url]) {
    const image = actor.icon;
    content[image.url].async("base64").then(function (content) {
      Alpine.store("files").sources[index].avatar = {
        type: image.mediaType,
        content: content,
        noImg: false,
      };
      // Alpine.store("files").sources[index].loaded.avatar = true;
      Alpine.store("files").currentlyLoading[Alpine.store("files").currentlyLoadingId].avatar = true;
      unzipEnd();
    });
  } else {
    Alpine.store("files").sources[index].avatar = { noImg: true };
    // Alpine.store("files").sources[index].loaded.avatar = true;
    Alpine.store("files").currentlyLoading[Alpine.store("files").currentlyLoadingId].avatar = true;
  }

  if (actor.image && actor.image.type === "Image" && actor.image.url && content[actor.image.url]) {
    const image = actor.image;
    content[image.url].async("base64").then(function (content) {
      Alpine.store("files").sources[index].header = {
        type: image.mediaType,
        content: content,
        noImg: false,
      };
      // Alpine.store("files").sources[index].loaded.header = true;
      Alpine.store("files").currentlyLoading[Alpine.store("files").currentlyLoadingId].header = true;
      unzipEnd();
    });
  } else {
    Alpine.store("files").sources[index].header = { noImg: true };
    // Alpine.store("files").sources[index].loaded.header = true;
    Alpine.store("files").currentlyLoading[Alpine.store("files").currentlyLoadingId].header = true;
  }

  unzipEnd();
}

function abortLoading(msg) {
  const fileId = Alpine.store("files").currentlyLoadingId;
  // console.warn("abortLoading", fileId, msg);
  // Alpine.store("files").loading = false;
  Alpine.store("files").currentlyLoading[fileId].error = msg;
  // proceed to next file
  unzipEnd();
}

function unpackingFinished() {
  const fileId = Alpine.store("files").currentlyLoadingId;
  const status = Alpine.store("files").currentlyLoading[fileId];
  if (
    status.error ||
    (status.actor && status.outbox && status.likes && status.bookmarks && status.avatar && status.header)
  ) {
    // console.log("unpacking done!");
    return true;
  }

  // console.log("unpacking is NOT finished", JSON.parse(JSON.stringify(status)));
  return false;
}

function unzipEnd() {
  const fileId = Alpine.store("files").currentlyLoadingId;
  // console.log("unzipEnd", fileId);
  if (!unpackingFinished()) {
    return;
  }

  // ### do some clean up and restart for the next file
  Alpine.store("files").currentlyLoading[fileId].working = false;
  Alpine.store("files").loadingQueue.shift();
  Alpine.store("files").currentlyLoadingId = "";
  Alpine.store("files").currentlyLoadingName = "";

  startQueue();
}

function endQueue() {
  // console.log("Tout OK, charger l'app");
  Alpine.store("files").loading = false;
}
