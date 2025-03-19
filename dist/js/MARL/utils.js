function resetStores(){Alpine.store("files").resetState(),Alpine.store("lightbox").resetState(),Alpine.store("ui").resetState()}function zipFileAlreadyLoaded(e){if(Alpine.store("files").sources.some((t=>t.fileInfos.name===e.name&&t.fileInfos.size===e.size&&t.fileInfos.lastModified===e.lastModified))){const t=`File already loaded: <b>${e.name}</b>`;return console.warn(t),marlConsole(t,"warn"),!0}return!1}function serverMode(){return Alpine.store("files").serverMode}function localMode(){return!Alpine.store("files").serverMode}function marlBasePath(){let e=Alpine.store("files").marlBasePath;return""===e&&(e=location.href,e.indexOf("index.html")>-1&&(e=e.slice(0,e.indexOf("index.html"))),"/"!==e.slice(-1)&&(e+="/"),Alpine.store("files").marlBasePath=e),e}function savePref(e,t){Alpine.store("userPrefs").save(e,t)}function loadPref(e){Alpine.store("userPrefs").load(e)}function preprocessToots(e,t){let o={langs:[],source:t};if(Alpine.store("files").toc.includes(e.id)){const t=Alpine.store("files").toots.filter((t=>t.id===e.id));let n=!1;const s=JSON.stringify(e);if(t.forEach((e=>{let t=JSON.parse(JSON.stringify(e));delete t._marl;const i=JSON.stringify(t);s===i?n=!0:(e._marl.duplicate=!0,o.duplicate=!0,Alpine.store("files").duplicates=!0)})),n)return!1}else Alpine.store("files").toc.push(e.id);if("Create"===e.type)if("object"==typeof e.object&&null!==e.object&&e.object.contentMap){let t=[];for(let o in e.object.contentMap)t.push(o);o.langs=t}else o.langs=["undefined"];if("object"==typeof e.object&&null!==e.object){if(e.object.content){const t=e.object.content.toLowerCase();o.textContent=stripHTML(t),o.externalLinks=extractExternalLinks(t)}if(e.object.summary&&(o.summary=e.object.summary.toLowerCase()),e.object.attachment&&e.object.attachment.length){o.hasAttachments=!0;for(let t=0;t<e.object.attachment.length;t++){let o=e.object.attachment[t].url;const n=o.indexOf("media_attachments/");n>0&&(e.object.attachment[t].url0=o,e.object.attachment[t].url=o.slice(n))}}if("Question"===e.object.type){e.object.oneOf?o.pollType="oneOf":e.object.anyOf&&(o.pollType="anyOf"),o.totalVotes=0;for(const t of e.object[o.pollType])o.totalVotes+=t.replies.totalItems}}else e.object&&(o.textContent=e.object.toLowerCase());o.visibility=tootVisibility(e);const n=e.id.split("/");return o.id=n[n.length-2],e._marl=o,e}function checkAppReady(e){e&&(buildTootsInfos(),buildDynamicFilters(),cleanUpRaw(),setHueForSources(),document.getElementById("main-section").focus(),Alpine.store("ui").checkMenuState(),Alpine.store("files").sortToots(),Alpine.store("files").loading=!1)}function buildTootsInfos(){let e={},t=[];if(Alpine.store("files").toots.length>0){let n=Alpine.store("files").toots.reduce(((e,t)=>{for(let o in t._marl.langs){const n=t._marl.langs[o];e.langs[n]?e.langs[n]++:e.langs[n]=1}if("Announce"===t.type)if("object"==typeof t.object&&null!==t.object);else if(t.object){const o=t.object.split("/");let n,s,i;o.length>2&&(i=o[2],"https:"===o[0]&&"users"===o[3]&&"statuses"===o[5]?(n=o[4],s=`https://${o[2]}/users/${o[4]}/`):(n=`? ${o[2]}`,s=`https://${o[2]}/`),e.boosts[n]?e.boosts[n].nb++:e.boosts[n]={nb:1,name:n,url:s,domain:i})}return e}),{langs:{},boosts:{}});for(var o in e=n.langs,t=[],n.boosts)t.push(n.boosts[o])}Alpine.store("files").languages=e,Alpine.store("files").boostsAuthors=t}function buildDynamicFilters(){for(const e in Alpine.store("files").languages)Alpine.store("files").filtersDefault["lang_"+e]=!0;for(const e of Alpine.store("files").sources)Alpine.store("files").filtersDefault["actor_"+e.id]=!0;Alpine.store("files").resetFilters(!1)}function cleanUpRaw(){if(!serverMode())for(let e=0;e<Alpine.store("files").sources.length;e++){const t=Alpine.store("files").sources[e]._raw;if(t.cleanedUp)continue;const o=Alpine.store("files").sources[e].actor;o.image&&o.image.url&&delete t[o.image.url],o.icon&&o.icon.url&&delete t[o.icon.url],delete t["actor.json"],delete t["outbox.json"],delete t["likes.json"],delete t["bookmarks.json"],t.cleanedUp=!0,Alpine.store("files").sources[e]._raw=t}}function setHueForSources(){const e=Alpine.store("files").sources.length,t=Math.round(360*Math.random()),o=Math.round(360/e);for(let n=0;n<e;n++)Alpine.store("files").sources[n].hue=t+o*n}function loadAttachedMedia(e,t){if(!serverMode()&&(attachmentIsImage(e)||attachmentIsVideo(e)||attachmentIsSound(e))){const o=Alpine.store("files").sources[t]._raw,n=Alpine.store("files").sources[t].fileInfos.archiveRoot;let s=e.url;if(!o[n+s])return void(Alpine.store("files").sources[t][e.url]={type:e.mediaType,content:null});o[n+s].async("base64").then((o=>{Alpine.store("files").sources[t][e.url]={type:e.mediaType,content:o}}))}}function pagingUpdated(){document.querySelectorAll("#toots details[open]").forEach((e=>{e.removeAttribute("open")}))}function scrollTootsToTop(e){setTimeout((()=>{document.getElementById("toots").scrollTop=0,e&&document.getElementById(e).focus()}),50)}function contentType(e){let t="";switch(e){case"Create":t="Post";break;case"Announce":t="Boost"}return t}function tootVisibility(e){return e.to.includes("https://www.w3.org/ns/activitystreams#Public")?["public",AlpineI18n.t("filters.visibilityPublic")]:e.to.some((e=>e.indexOf("/followers")>-1))&&!e.to.includes("https://www.w3.org/ns/activitystreams#Public")&&e.cc.includes("https://www.w3.org/ns/activitystreams#Public")?["unlisted",AlpineI18n.t("filters.visibilityUnlisted")]:!e.to.some((e=>e.indexOf("/followers")>-1))||e.to.includes("https://www.w3.org/ns/activitystreams#Public")||e.cc.includes("https://www.w3.org/ns/activitystreams#Public")?e.to.some((e=>e.indexOf("/followers")>-1))||e.to.includes("https://www.w3.org/ns/activitystreams#Public")||e.cc.includes("https://www.w3.org/ns/activitystreams#Public")?void 0:["mentioned",AlpineI18n.t("filters.visibilityMentioned")]:["followers",AlpineI18n.t("filters.visibilityFollowers")]}function tootHasTags(e){return"object"==typeof e.object&&null!==e.object&&e.object.tag&&e.object.tag.length}function formatJson(e){let t=e;return t._marl&&(t=JSON.parse(JSON.stringify(e)),delete t._marl),JSON.stringify(t,null,4)}function formatAuthor(e,t){return t?e.split("/").pop():`<a href="${e}" target="_blank">${e.split("/").pop()}</a>`}function formatDateTime(e){return new Date(e).toLocaleDateString(Alpine.store("ui").lang,{weekday:"long",year:"numeric",month:"long",day:"numeric",hour:"numeric",minute:"2-digit",second:"2-digit"})}function formatFileDateTime(e){return new Date(e).toLocaleDateString(Alpine.store("ui").lang,{year:"numeric",month:"2-digit",day:"2-digit",hour12:!1,hour:"2-digit",minute:"2-digit",second:"2-digit"})}function formatFileSize(e){var t=0==e?0:Math.floor(Math.log(e)/Math.log(1024));return 1*+(e/Math.pow(1024,t)).toFixed(2)+" "+["B","kB","MB","GB","TB"][t]}function formatDate(e){return new Date(e).toLocaleDateString(Alpine.store("ui").lang,{weekday:"long",year:"numeric",month:"long",day:"numeric"})}function formatNumber(e){return void 0===e?"":e.toLocaleString()}function formatLikesBookmarks(e){const t=e.split("/");t.splice(0,2);let o=`<span class="url-instance">${t[0]}</span>`;return"users"===t[1]&&"statuses"===t[3]?o+=`<span class="url-actor">${t[2]}</span><span class="url-post-id">${t[4]}</span>`:(t.splice(0,1),o+=`<span class="url-post-id">${t.join("/")}</span>`),o}function stripHTML(e){return(new DOMParser).parseFromString(e,"text/html").body.textContent||""}function extractExternalLinks(e){const t=(new DOMParser).parseFromString(e,"text/html").querySelectorAll("a[href]:not(.mention)");let o=[];return t.forEach((e=>{o.push({href:e.href,text:e.textContent})})),o}function attachmentIsImage(e){return"image/jpeg"===e.mediaType||"image/png"===e.mediaType}function attachmentIsVideo(e){return"video/mp4"===e.mediaType}function attachmentIsSound(e){return"audio/mpeg"===e.mediaType}function attachmentWrapperClass(e){let t=[];return attachmentIsImage(e)?t.push("att-img"):attachmentIsSound(e)?t.push("att-sound"):attachmentIsVideo(e)&&t.push("att-video"),e.name||t.push("no-alt-text"),t}function pollQuestionPc(e,t){const o=e.object[e._marl.pollType];return pc=o[t].replies.totalItems/e.object.votersCount*100,pc||0}function isFilterActive(e){return Alpine.store("files").filters[e]!==Alpine.store("files").filtersDefault[e]}function startOver(){const e=AlpineI18n.t("tools.startOverConfirm");confirm(e)&&location.reload()}function detectLangFromBrowser(){const e=navigator.languages;if(e&&e.length)for(let t=0;t<e.length;t++){let o=e[t].split("-")[0];if(Alpine.store("ui").appLangs[o]){return marlConsole(`Setting language based on browser preference: <b>'${o}' (${Alpine.store("ui").appLangs[o]})</b>`,"info"),o}}return!1}function setLang(){const e=Alpine.store("ui").lang;AlpineI18n.locale=e,savePref("lang",e),document.getElementsByTagName("html")[0].setAttribute("lang",e);marlConsole(`App language set to <b>'${e}' (${Alpine.store("ui").appLangs[e]})</b>`)}function setTheme(e){document.getElementsByTagName("html")[0].setAttribute("class",e),"dark"===e?document.querySelector('meta[name="color-scheme"]').setAttribute("content","dark"):document.querySelector('meta[name="color-scheme"]').setAttribute("content","light")}function marlConsole(e,t="info"){Alpine.store("ui").logMsg(e,t)}const drag={el:null,init(e){this.dropArea=document.getElementById(e),["dragenter","dragover","dragleave","drop"].forEach((e=>{this.dropArea.addEventListener(e,(e=>this.preventDragDefaults(e)),!1)})),["dragenter","dragover"].forEach((e=>{this.dropArea.addEventListener(e,(()=>this.highlightDrag()),!1)})),["dragleave","drop"].forEach((e=>{this.dropArea.addEventListener(e,(()=>this.unhighlightDrag()),!1)})),this.dropArea.addEventListener("drop",(e=>this.handleDrop(e)),!1)},preventDragDefaults(e){e.preventDefault(),e.stopPropagation()},highlightDrag(){this.dropArea.classList.add("highlight-drag")},unhighlightDrag(){this.dropArea.classList.remove("highlight-drag")},handleDrop(e){const t=e.dataTransfer.files;loadZipFiles(t)}};