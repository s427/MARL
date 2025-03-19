const userPrefsStore={prefix:"marl_",save(t,e){!0===e&&(e=1),!1===e&&(e=0);marlConsole(`Saving user preference <b>(${t}: ${e})</b>`,"info"),localStorage.setItem(this.prefix+t,e)},load(t){const e=localStorage.getItem(this.prefix+t);(null!==e||"lang"===t)&&this.set(t,e)},set(t,e){let s="";switch(t){case"lang":case"theme":case"collapsePanels":case"simplifyPostsDisplay":s="ui";break;case"pageSize":case"sortAsc":s="files"}if(s)switch(t){case"sortAsc":case"collapsePanels":case"simplifyPostsDisplay":(e=1==+e)!==Alpine.store(s)[t]&&(Alpine.store(s)[t]=e);break;case"pageSize":"number"==typeof(e=+e)&&!isNaN(e)&&e>0&&e!==Alpine.store(s)[t]&&(Alpine.store(s)[t]=e);break;case"lang":if(e||(e=detectLangFromBrowser())&&this.save("lang",e),!e||!Alpine.store(s).appLangs[e]){if(e){const t=`<b>Unrecognized language</b> in user preferences: ${e}`;console.warn(t),marlConsole(t,"warn")}e="en",this.save("lang",e)}Alpine.store(s)[t]=e;break;case"theme":"dark"!==e&&"light"!==e&&(e="light",this.save("theme",e)),Alpine.store(s)[t]=e,setTheme(e)}}},filesStore={resetState(){this.loadingQueue=[],this.currentlyLoading={},this.currentlyLoadingId="",this.currentlyLoadingName="",this.serverMode=!1,this.remotes=[],this.marlBasePath="",this.sources=[],this.toots=[],this.toc=[],this.duplicates=!1,this.sortAsc=!0,this.pageSize=10,this.currentPage=1,this.loading=!1,this.loadingFailed=!1,this.languages={},this.boostsAuthors=[],this.filters={},this.filtersDefault={fullText:"",hashtagText:"",mentionText:"",externalLink:"",summary:"",isEdited:!1,isDuplicate:!1,startingAt:!1,noStartingAt:!1,hasExternalLink:!1,hasHashtags:!1,hasMentions:!1,hasPoll:!1,hasSummary:!1,isSensitive:!1,visibilityPublic:!0,visibilityUnlisted:!0,visibilityFollowers:!0,visibilityMentioned:!0,typeOriginal:!0,typeBoost:!0,attachmentAny:!1,attachmentImage:!1,attachmentVideo:!1,attachmentSound:!1,attachmentNoAltText:!1,attachmentWithAltText:!1},this.filtersActive=!1,this.tagsFilters={hashtags:"",mentions:"",boostsAuthors:""},loadPref("sortAsc"),loadPref("pageSize")},setFilter(t){this.checkPagingValue(),scrollTootsToTop(),pagingUpdated(),JSON.stringify(this.filters)===JSON.stringify(this.filtersDefault)?this.filtersActive=!1:this.filtersActive=!0,this.filters.startingAt&&this.filters.noStartingAt&&("startingAt"===t&&(this.filters.noStartingAt=!1),"noStartingAt"===t&&(this.filters.startingAt=!1));const e=this;setTimeout((()=>{e.checkPagingValue()}),50)},filterByTag(t,e,s){e&&(e===this.filters[t]?this.filters[t]="":this.filters[t]=e),"fullText"==t&&(""===this.filters[t]?(this.filters.typeBoost=!0,this.filters.typeOriginal=!0):(this.filters.typeBoost=!0,this.filters.typeOriginal=!1)),this.setFilter(),setTimeout((()=>{document.getElementById(s).focus()}),100)},resetFilters(t){this.filters=JSON.parse(JSON.stringify(this.filtersDefault)),t&&(this.currentPage=1,this.filtersActive=!1,scrollTootsToTop(),pagingUpdated())},get filteredToots(){const t=this.filters,e=this.filtersActive;return this.toots.filter((s=>{if(!e)return!0;if(t.fullText){let e=!1;const i=t.fullText.toLowerCase();if(s._marl.textContent&&s._marl.textContent&&s._marl.textContent.indexOf(i)>=0&&(e=!0),s._marl.hasAttachments&&s.object.attachment.forEach((t=>{const s=t.name;s&&s.indexOf(i)>=0&&(e=!0)})),s._marl.summary&&s._marl.summary.indexOf(i)>=0&&(e=!0),!e)return e}if(t.hashtagText){if("object"!=typeof s.object||null===s.object||!s.object.tag)return!1;{const e=t.hashtagText.toLowerCase();if(!s.object.tag.some((t=>"Hashtag"===t.type&&t.name.toLowerCase().indexOf(e)>-1)))return!1}}if(t.mentionText){if("object"!=typeof s.object||null===s.object||!s.object.tag)return!1;{const e=t.mentionText.toLowerCase();if(!s.object.tag.some((t=>"Mention"===t.type&&t.name.toLowerCase().indexOf(e)>-1)))return!1}}if(t.summary){if(!s._marl.summary)return!1;{const e=t.summary.toLowerCase();if(-1===s._marl.summary.indexOf(e))return!1}}if(t.isEdited&&("object"!=typeof s.object||null===s.object||!s.object.updated))return!1;if(t.isDuplicate&&!s._marl.duplicate)return!1;if(t.startingAt&&(!s._marl.textContent||0!==s._marl.textContent.indexOf("@")))return!1;if(t.noStartingAt&&(!s._marl.textContent||0===s._marl.textContent.indexOf("@")))return!1;if(t.hasExternalLink&&(!s._marl.externalLinks||!s._marl.externalLinks.length))return!1;if(t.hasHashtags){if("object"!=typeof s.object||null===s.object||!s.object.tag)return!1;if(!s.object.tag.some((t=>"Hashtag"===t.type)))return!1}if(t.hasMentions){if("object"!=typeof s.object||null===s.object||!s.object.tag)return!1;if(!s.object.tag.some((t=>"Mention"===t.type)))return!1}if(t.hasPoll){if("object"!=typeof s.object||null===s.object||!s.object.type)return!1;if("Question"!==s.object.type)return!1}if(t.hasSummary){if("object"!=typeof s.object||null===s.object)return!1;if(!s.object.summary)return!1}if(t.isSensitive){if("object"!=typeof s.object||null===s.object)return!1;if(!s.object.sensitive)return!1}if(t.externalLink){let e=!1;if(s._marl.externalLinks&&s._marl.externalLinks.length){const i=t.externalLink.toLowerCase();e=s._marl.externalLinks.some((t=>t.href.indexOf(i)>-1||t.text.indexOf(i)>-1))}if(!e)return!1}if(!t.visibilityPublic&&"public"===s._marl.visibility[0])return!1;if(!t.visibilityUnlisted&&"unlisted"===s._marl.visibility[0])return!1;if(!t.visibilityFollowers&&"followers"===s._marl.visibility[0])return!1;if(!t.visibilityMentioned&&"mentioned"===s._marl.visibility[0])return!1;if(!t.typeOriginal&&"Create"===s.type)return!1;if(!t.typeBoost&&"Announce"===s.type)return!1;if(t.attachmentAny&&!s._marl.hasAttachments)return!1;if(t.attachmentImage){if(!s._marl.hasAttachments)return!1;if(!s.object.attachment.some((t=>attachmentIsImage(t))))return!1}if(t.attachmentVideo){if(!s._marl.hasAttachments)return!1;if(!s.object.attachment.some((t=>attachmentIsVideo(t))))return!1}if(t.attachmentSound){if(!s._marl.hasAttachments)return!1;if(!s.object.attachment.some((t=>attachmentIsSound(t))))return!1}if(t.attachmentNoAltText){if(!s._marl.hasAttachments)return!1;if(!s.object.attachment.some((t=>null===t.name)))return!1}if(t.attachmentWithAltText){if(!s._marl.hasAttachments)return!1;if(!s.object.attachment.some((t=>t.name)))return!1}for(const e in this.languages)if(t.hasOwnProperty("lang_"+e)&&!1===t["lang_"+e]&&(s._marl.langs.includes(e)||0===s._marl.langs.length))return!1;for(const e of this.sources){const i=e.id;if(t.hasOwnProperty("actor_"+i)&&!1===t["actor_"+i]&&s._marl.source===i)return!1}return!0}))},get listHashtags(){return this.listTags("Hashtag")},get listMentions(){return this.listTags("Mention")},listTags(t){let e="";switch(t){case"Mention":e="mentions";break;case"Hashtag":e="hashtags"}let s=this.filteredToots.reduce(((s,i)=>{if(tootHasTags(i))for(const n in i.object.tag){const o=i.object.tag[n];o.type&&o.type===t&&o.name&&o.name.toLowerCase().indexOf(this.tagsFilters[e].toLowerCase())>=0&&(s.some((t=>t.name===o.name))?s.map((t=>{t.name===o.name&&t.nb++})):s.push({name:o.name,href:o.href,nb:1}))}return s}),[]);return s.sort(((t,e)=>t.nb===e.nb?t.name.localeCompare(e.name):e.nb-t.nb)),s},get listBoostsAuthors(){let t=this.boostsAuthors.reduce(((t,e)=>(e.name.toLowerCase().indexOf(this.tagsFilters.boostsAuthors.toLowerCase())>=0&&t.push(e),t)),[]);return t.sort(((t,e)=>{if(t.nb===e.nb){let s=0===t.name.indexOf("? "),i=0===e.name.indexOf("? ");return s&&i?t.name.localeCompare(e.name):s?1:i?-1:t.name.localeCompare(e.name)}return t.nb===e.nb?t.name.localeCompare(e.name):e.nb-t.nb})),t},get sortedLanguages(){let t=[];for(const e in this.languages)t.push([e,this.languages[e]]);return t.sort(((t,e)=>"undefined"===t[0]?1:"undefined"===e[0]?-1:t[1]===e[1]?t[0].localeCompare(e[0]):e[1]-t[1])),t},get appReady(){return!(this.loading||!this.sources.length)},get totalPages(){return Math.ceil(this.filteredToots.length/this.pageSize)},get pagedToots(){return this.filteredToots?this.filteredToots.filter(((t,e)=>{let s=(this.currentPage-1)*this.pageSize,i=this.currentPage*this.pageSize;if(e>=s&&e<i)return!0})):[]},sortToots(){this.toots.sort(((t,e)=>this.sortAsc?t.published.localeCompare(e.published):e.published.localeCompare(t.published)))},toggleTootsOrder(){this.sortAsc=!this.sortAsc,savePref("sortAsc",this.sortAsc),this.sortToots(),scrollTootsToTop(),pagingUpdated()},setPostsPerPage(){this.checkPagingValue(),savePref("pageSize",this.pageSize)},checkPagingValue(){this.currentPage<1?this.currentPage=1:this.currentPage>this.totalPages&&(this.currentPage=this.totalPages)},nextPage(t){this.currentPage*this.pageSize<this.filteredToots.length&&(this.currentPage++,scrollTootsToTop(t),pagingUpdated())},prevPage(t){this.currentPage>1&&(this.currentPage--,scrollTootsToTop(t),pagingUpdated())},firstPage(t){this.currentPage=1,scrollTootsToTop(t),pagingUpdated()},lastPage(t){this.currentPage=this.totalPages,scrollTootsToTop(t),pagingUpdated()}},lightboxStore={resetState(){this.show=!1,this.data=[],this.source=0,this.index=0,this.origin=""},open(t,e,s){this.data=t.object.attachment,this.source=t._marl.source,this.show=!0,this.index=e,this.origin=s,document.getElementById("main-section-inner").setAttribute("inert",!0),setTimeout((()=>{document.getElementById("lightbox").focus()}),50)},openProfileImg(t,e,s){let i="";localMode()&&(i=Alpine.store("files").sources[s][t].type);const n={object:{attachment:[{name:t,url:t,mediaType:i}]},_marl:{source:s}};this.open(n,0,e)},close(){const t=this.origin;this.data=[],this.index=0,this.show=!1,this.origin="",document.getElementById("main-section-inner").removeAttribute("inert"),document.getElementById(t).focus()},showNext(){this.index++,this.index>=this.data.length&&(this.index=0),attachmentIsImage(this.data[this.index])||this.showNext()},showPrev(){this.index--,this.index<0&&(this.index=this.data.length-1),attachmentIsImage(this.data[this.index])||this.showPrev()}},uiStore={log:[],resetState(){this.pagingOptionsVisible=!1,this.openMenu="",this.actorPanel=0,this.menuIsActive=!1,this.lang="en",this.appLangs=appLangs??{en:"English"},this.theme="light",this.errorInLog=!1,this.log=this.log??[],this.collapsePanels=!1,this.simplifyPostsDisplay=!1,loadPref("lang"),loadPref("theme"),loadPref("collapsePanels"),loadPref("simplifyPostsDisplay")},logMsg(t,e){let s={msg:t,type:e=e??"info",time:(new Date).toLocaleTimeString(Alpine.store("ui").lang,{hour12:!1,hour:"2-digit",minute:"2-digit",second:"2-digit"})};this.log.unshift(s),"error"===e&&(this.errorInLog=!0)},toggleTheme(){this.theme="light"===this.theme?"dark":"light",savePref("theme",this.theme),setTheme(this.theme)},setOption(t){savePref(t,this[t]),"collapsePanels"===t&&this.checkMenuState()},togglePagingOptions(){this.pagingOptionsVisible=!this.pagingOptionsVisible,this.pagingOptionsVisible&&setTimeout((()=>{document.getElementById("paging-options").focus()}),100)},get pagingOptionsClass(){return this.pagingOptionsVisible?"open":""},openActorPanel(t){this.actorPanel=t,setTimeout((()=>{document.getElementById("actorpanel-"+t).scrollTop=0}),50)},switchActorPanel(t){let e=this.actorPanel;"up"===t?(e++,e>=Alpine.store("files").sources.length&&(e=0)):(e--,e<0&&(e=Alpine.store("files").sources.length-1)),this.actorPanel=e,document.getElementById("actortab-"+e).focus()},menuClose(){const t=this.openMenu;this.openMenu="",this.setInert(),"tools"!==t||this.menuIsActive?document.querySelector("#main-section-inner .mobile-menu .menu-"+t).focus():document.getElementById("header-open-tools").focus()},menuOpen(t){this.openMenu=t,this.resetPanels(),this.setInert(),setTimeout((()=>{document.getElementById("panel-"+t).focus()}),100)},menuToggle(t){switch(t){case"actor":case"filters":case"tags":case"tools":this.openMenu===t?this.menuClose():this.menuOpen(t)}},resetPanels(){const t=this.openMenu;if(document.querySelectorAll(`#panel-${t} details[open]`).forEach((t=>{t.removeAttribute("open")})),"actor"===t){const t="actorpanel-"+this.actorPanel;setTimeout((()=>{document.getElementById(t).scrollTop=0}),250)}else setTimeout((()=>{document.getElementById("panel-"+t).scrollTop=0}),250)},checkMenuState(){const t=document.getElementById("mobile-menu");"none"===window.getComputedStyle(t,null).display?this.menuIsActive=!1:this.menuIsActive=!0,this.setInert()},setInertMain(){document.querySelectorAll("#main-section-inner > *:not(.mobile-menu, .panel-backdrop, #panel-"+this.openMenu).forEach((t=>{t.setAttribute("inert",!0)}))},setInertPanels(){document.querySelectorAll("#panel-actor, #panel-filters, #panel-tags, #panel-tools").forEach((t=>{t.setAttribute("inert",!0)}))},setInertTools(){document.querySelectorAll("#panel-tools").forEach((t=>{t.setAttribute("inert",!0)}))},setInert(){document.querySelectorAll("#main-section-inner > *").forEach((t=>{t.removeAttribute("inert")})),this.menuIsActive?this.openMenu?this.setInertMain():this.setInertPanels():"tools"===this.openMenu?this.setInertMain():this.setInertTools()},get appClasses(){let t=[];return this.collapsePanels&&t.push("collapse-panels"),this.simplifyPostsDisplay&&t.push("simplify-posts-display"),t},get appInsideClasses(){let t=[];return this.openMenu?t.push("menu-open menu-open-"+this.openMenu):t.push("menu-closed"),t}};