import { Env } from "../types";
import { loadConfig, AppConfig } from "../utils/config";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildExpireOptions(config: AppConfig): string {
  const labels: Record<string, string> = {
    "5min": "5 minutes",
    "10min": "10 minutes",
    "1hour": "1 hour",
    "1day": "1 day",
    "1week": "1 week",
    "1month": "1 month",
    "1year": "1 year",
    "never": "Never",
  };
  return Object.keys(config.expireOptions)
    .map(
      (key) =>
        `<option value="${key}"${key === config.expireDefault ? ' selected="selected"' : ""}>${labels[key] || key}</option>`
    )
    .join("\n");
}

function buildFormatterOptions(config: AppConfig): string {
  const formatters: Record<string, string> = {
    plaintext: "Plain Text",
    syntaxhighlighting: "Source Code",
    markdown: "Markdown",
  };
  return Object.entries(formatters)
    .map(
      ([key, label]) =>
        `<option value="${key}"${key === config.defaultFormatter ? ' selected="selected"' : ""}>${label}</option>`
    )
    .join("\n");
}

export function renderTemplate(config: AppConfig, requestUrl: URL): string {
  const version = "2.0.4";
  const httpsLink = `https://${requestUrl.host}${requestUrl.pathname}`;
  const cspHeader = config.cspHeader || "default-src 'none'; base-uri 'self'; form-action 'none'; manifest-src 'self'; connect-src * blob:; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; font-src 'self'; frame-ancestors 'none'; frame-src blob:; img-src 'self' data: blob:; media-src blob:; object-src blob:; sandbox allow-same-origin allow-scripts allow-forms allow-modals allow-downloads";

  return `<!DOCTYPE html>
<html lang="en" class="h-100">
<head>
<meta charset="utf-8" />
<meta http-equiv="Content-Security-Policy" content="${escapeHtml(cspHeader.replace(/frame-ancestors [^;]+; ?/, "").replace(/; sandbox[^"]*/, ""))}">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex" />
<meta name="google" content="notranslate">
<title>${escapeHtml(config.siteName)}</title>
<link type="text/css" rel="stylesheet" href="css/bootstrap5/bootstrap-5.3.8.css" />
<link type="text/css" rel="stylesheet" href="css/bootstrap5/zerobin.css?${version}" />
<link type="text/css" rel="stylesheet" href="css/prettify/prettify.css?${version}" />
${config.syntaxTheme ? `<link type="text/css" rel="stylesheet" href="css/prettify/${escapeHtml(config.syntaxTheme)}.css?${version}" />` : ""}
<noscript><link type="text/css" rel="stylesheet" href="css/noscript.css" /></noscript>
<link rel="preload" href="js/zlib-1.3.2.js" as="fetch" type="application/javascript" crossorigin />
<script src="js/jquery-3.7.1.js" defer></script>
${config.qrCode ? '<script src="js/kjua-0.10.0.js" defer></script>' : ""}
<script src="js/zlib.js" defer></script>
<script src="js/base-x-5.0.1.js" defer></script>
<script src="js/bootstrap-5.3.8.js" defer></script>
<script src="js/dark-mode-switch.js" defer></script>
<script src="js/prettify.js" defer></script>
<script src="js/showdown-2.1.0.js" defer></script>
<script src="js/purify-3.4.1.js" defer></script>
<script src="js/legacy.js" defer></script>
<script src="js/zerobin.js" defer></script>
<link rel="apple-touch-icon" href="img/apple-touch-icon.png" sizes="180x180" />
<link rel="icon" type="image/png" href="img/favicon-32x32.png" sizes="32x32" />
<link rel="icon" type="image/png" href="img/favicon-16x16.png" sizes="16x16" />
<link rel="mask-icon" href="img/safari-pinned-tab.svg" color="#ffcc00" />
<link rel="shortcut icon" href="img/favicon.ico">
<meta name="theme-color" content="#ffe57e" />
<meta name="twitter:card" content="summary" />
<meta name="twitter:title" content="Encrypted note on ${escapeHtml(config.siteName)}" />
<meta name="twitter:description" content="Visit this link to see the note. Giving the URL to anyone allows them to access the note, too." />
<meta name="twitter:image" content="${escapeHtml(config.basePath)}img/apple-touch-icon.png" />
<meta property="og:title" content="${escapeHtml(config.siteName)}" />
<meta property="og:site_name" content="${escapeHtml(config.siteName)}" />
<meta property="og:description" content="Visit this link to see the note. Giving the URL to anyone allows them to access the note, too." />
<meta property="og:image" content="${escapeHtml(config.basePath)}img/apple-touch-icon.png" />
<meta property="og:image:type" content="image/png" />
<meta property="og:image:width" content="180" />
<meta property="og:image:height" content="180" />
</head>
<body role="document" data-compression="${escapeHtml(config.compression)}" class="d-flex flex-column h-100">
<div id="passwordmodal" tabindex="-1" class="modal fade" role="dialog" aria-hidden="true">
<div class="modal-dialog" role="document"><div class="modal-content"><div class="modal-body">
<form id="passwordform" role="form"><div class="mb-3">
<label for="passworddecrypt"><svg width="16" height="16" fill="currentColor" aria-hidden="true"><use href="img/bootstrap-icons.svg#eye" /></svg> Please enter the password for this document:</label>
<div class="input-group">
<input id="passworddecrypt" type="password" class="form-control input-password" placeholder="Enter password" required="required" />
<button class="btn btn-outline-secondary toggle-password" type="button" title="Show password" aria-label="Show password"><svg width="16" height="16" fill="currentColor" aria-hidden="true"><use href="img/bootstrap-icons.svg#eye" /></svg></button>
</div></div>
<button type="submit" class="btn btn-success btn-block"><svg width="16" height="16" fill="currentColor" aria-hidden="true"><use href="img/bootstrap-icons.svg#power" /></svg> Decrypt</button>
</form></div></div></div></div>
<div id="loadconfirmmodal" tabindex="-1" class="modal fade" role="dialog" aria-hidden="true">
<div class="modal-dialog" role="document"><div class="modal-content">
<div class="modal-header"><h5 class="modal-title">This secret message can only be displayed once. Would you like to see it now?</h5>
<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button></div>
<div class="modal-body text-center">
<button id="loadconfirm-open-now" type="button" class="btn btn-success" data-bs-dismiss="modal"><svg width="16" height="16" fill="currentColor" aria-hidden="true"><use href="img/bootstrap-icons.svg#cloud-download" /></svg> Yes, see it</button>
</div></div></div></div>
${config.qrCode ? `<div id="qrcodemodal" tabindex="-1" class="modal fade" role="dialog" aria-hidden="true">
<div class="modal-dialog" role="document"><div class="modal-content">
<div class="modal-header"><h5 class="modal-title">QR code</h5>
<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button></div>
<div class="modal-body"><div class="mx-auto" id="qrcode-display"></div></div>
</div></div></div>` : ""}
${config.emailSharing ? `<div id="emailconfirmmodal" tabindex="-1" class="modal fade" role="dialog" aria-hidden="true">
<div class="modal-dialog" role="document"><div class="modal-content">
<div class="modal-header"><h5 class="modal-title">Recipient may become aware of your timezone, convert time to UTC?</h5>
<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button></div>
<div class="modal-body row">
<div class="col-xs-12 col-md-6"><button id="emailconfirm-timezone-current" type="button" class="btn btn-danger"><svg width="16" height="16" fill="currentColor" aria-hidden="true"><use href="img/bootstrap-icons.svg#clock" /></svg> Use Current Timezone</button></div>
<div class="col-xs-12 col-md-6 text-right"><button id="emailconfirm-timezone-utc" type="button" class="btn btn-success"><svg width="16" height="16" fill="currentColor" aria-hidden="true"><use href="img/bootstrap-icons.svg#globe" /></svg> Convert To UTC</button></div>
</div></div></div></div>` : ""}
<nav class="navbar navbar-expand-lg bg-body-tertiary text-nowrap mb-3">
<div class="container-fluid">
<a class="reloadlink navbar-brand" href=""><img alt="${escapeHtml(config.siteName)}" src="img/icon.svg" height="38" /></a>
<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbar" aria-controls="navbar" aria-expanded="false" aria-label="Toggle navigation"><span class="navbar-toggler-icon"></span></button>
<div id="navbar" class="collapse navbar-collapse">
<ul class="navbar-nav me-auto gap-2 align-items-lg-center align-items-stretch">
<li id="loadingindicator" class="navbar-text hidden me-auto"><svg width="16" height="16" fill="currentColor" aria-hidden="true"><use href="img/bootstrap-icons.svg#clock" /></svg> Loading…</li>
<li class="nav-item d-flex flex-lg-row flex-column"><button id="retrybutton" type="button" class="reloadlink hidden btn btn-primary d-flex justify-content-center align-items-center gap-1"><svg width="16" height="16" fill="currentColor" aria-hidden="true"><use href="img/bootstrap-icons.svg#repeat" /></svg> Retry</button></li>
<li class="nav-item d-flex flex-lg-row flex-column gap-2">
<button id="newbutton" type="button" class="hidden btn btn-secondary flex-fill d-flex justify-content-center align-items-center gap-1"><svg width="16" height="16" fill="currentColor" aria-hidden="true"><use href="img/bootstrap-icons.svg#file-earmark" /></svg> New</button>
<button id="clonebutton" type="button" class="hidden btn btn-secondary flex-fill d-flex justify-content-center align-items-center gap-1"><svg width="16" height="16" fill="currentColor" aria-hidden="true"><use href="img/bootstrap-icons.svg#copy" /></svg> Clone</button>
<button id="rawtextbutton" type="button" class="hidden btn btn-secondary flex-fill d-flex justify-content-center align-items-center gap-1"><svg width="16" height="16" fill="currentColor" aria-hidden="true"><use href="img/bootstrap-icons.svg#filetype-txt" /></svg> Raw text</button>
<button id="downloadtextbutton" type="button" class="hidden btn btn-secondary flex-fill d-flex justify-content-center align-items-center gap-1"><svg width="16" height="16" fill="currentColor" aria-hidden="true"><use href="img/bootstrap-icons.svg#download" /></svg> Save document</button>
${config.emailSharing ? '<button id="emaillink" type="button" class="hidden btn btn-secondary flex-fill d-flex justify-content-center align-items-center gap-1"><svg width="16" height="16" fill="currentColor" aria-hidden="true"><use href="img/bootstrap-icons.svg#envelope" /></svg> Email</button>' : ""}
${config.qrCode ? '<button id="qrcodelink" type="button" data-bs-toggle="modal" data-bs-target="#qrcodemodal" class="hidden btn btn-secondary flex-fill d-flex justify-content-center align-items-center gap-1"><svg width="16" height="16" fill="currentColor" aria-hidden="true"><use href="img/bootstrap-icons.svg#qr-code" /></svg> QR code</button>' : ""}
</li>
<li id="expiration" class="nav-item d-flex hidden">
<label for="pasteExpiration" class="form-label my-auto me-1">Expires:</label>
<select id="pasteExpiration" name="pasteExpiration" class="form-select">${buildExpireOptions(config)}</select>
</li>
<li class="nav-item"><div id="burnafterreadingoption" class="navbar-text form-check hidden">
<input class="form-check-input" type="checkbox" id="burnafterreading" name="burnafterreading"${config.burnAfterReadingSelected ? ' checked="checked"' : ""} />
<label class="form-check-label" for="burnafterreading">Burn after reading</label>
</div></li>
${config.discussion ? `<li class="nav-item"><div id="opendiscussionoption" class="navbar-text form-check hidden">
<input class="form-check-input" type="checkbox" id="opendiscussion" name="opendiscussion"${config.openDiscussion ? ' checked="checked"' : ""} />
<label class="form-check-label" for="opendiscussion">Open discussion</label>
</div></li>` : ""}
${config.password ? `<li class="nav-item"><div id="password" class="navbar-form hidden"><div class="input-group">
<input type="password" id="passwordinput" placeholder="Password (recommended)" aria-label="Password (recommended)" class="form-control input-password" size="23" />
<button class="btn btn-outline-secondary toggle-password" type="button" title="Show password" aria-label="Show password"><svg width="16" height="16" fill="currentColor" aria-hidden="true"><use href="img/bootstrap-icons.svg#eye" /></svg></button>
</div></div></li>` : ""}
${config.fileUpload ? `<li id="attach" class="nav-item hidden dropdown">
<a href="#" class="nav-link dropdown-toggle" data-bs-toggle="dropdown" role="button" aria-expanded="false">Attach a file</a>
<ul class="dropdown-menu px-2">
<li id="filewrap"><div><input type="file" id="file" name="file" class="form-control" multiple /></div>
<div id="dragAndDropFileName" class="dragAndDropFile">alternatively drag &amp; drop a file or paste an image from the clipboard</div></li>
<li id="customattachment" class="hidden d-flex flex-column px-3"></li>
<li><a id="fileremovebutton" href="#" class="dropdown-item">Remove attachment</a></li>
</ul></li>` : ""}
<li id="formatter" class="nav-item d-flex hidden">
<label for="pasteFormatter" class="form-label my-auto me-1">Format:</label>
<select id="pasteFormatter" name="pasteFormatter" class="form-select">${buildFormatterOptions(config)}</select>
</li>
</ul>
<ul class="navbar-nav gap-2">
<li class="nav-item"><div class="form-check form-switch navbar-text">
<input id="bd-theme" type="checkbox" class="form-check-input" />
<label for="bd-theme" class="form-check-label">Dark Mode</label>
</div></li>
</ul>
</div></div></nav>
<main>
<section class="container-fluid mt-2">
${config.noticeText ? `<div role="alert" class="alert alert-info"><svg width="16" height="16" fill="currentColor" aria-hidden="true"><use href="img/bootstrap-icons.svg#info-circle" /></svg> ${escapeHtml(config.noticeText)}</div>` : ""}
<div id="remainingtime" role="alert" class="hidden alert alert-info"><svg width="16" height="16" fill="currentColor" aria-hidden="true"><use href="img/bootstrap-icons.svg#fire" /></svg></div>
${config.fileUpload ? '<div id="attachment" class="hidden"></div>' : ""}
<div id="status" role="alert" class="d-flex align-items-center gap-2 alert alert-info hidden"><div><svg width="16" height="16" fill="currentColor" aria-hidden="true"><use href="img/bootstrap-icons.svg#info-circle" /></svg></div></div>
<div id="errormessage" role="alert" class="hidden alert alert-danger"><svg width="16" height="16" fill="currentColor" aria-hidden="true"><use href="img/bootstrap-icons.svg#exclamation-triangle" /></svg></div>
<noscript><div id="noscript" role="alert" class="alert alert-warning"><svg width="16" height="16" fill="currentColor" aria-hidden="true"><use href="img/bootstrap-icons.svg#exclamation-circle" /></svg> JavaScript is required for ${escapeHtml(config.siteName)} to work. Sorry for the inconvenience.</div></noscript>
<div id="oldnotice" role="alert" class="hidden alert alert-danger"><svg width="16" height="16" fill="currentColor" aria-hidden="true"><use href="img/bootstrap-icons.svg#exclamation-triangle" /></svg> ${escapeHtml(config.siteName)} requires a modern browser to work. <a href="https://www.mozilla.org/firefox/">Firefox</a>, <a href="https://www.opera.com/">Opera</a>, <a href="https://www.google.com/chrome">Chrome</a>…</div>
${config.httpWarning ? `<div id="httpnotice" role="alert" class="hidden alert alert-danger"><svg width="16" height="16" fill="currentColor" aria-hidden="true"><use href="img/bootstrap-icons.svg#exclamation-triangle" /></svg> This website is using an insecure connection! Please only use it for testing.</div>
<div id="insecurecontextnotice" role="alert" class="hidden alert alert-danger"><svg width="16" height="16" fill="currentColor" aria-hidden="true"><use href="img/bootstrap-icons.svg#exclamation-triangle" /></svg> Your browser may require an HTTPS connection to support the WebCrypto API. Try <a href="${escapeHtml(httpsLink)}">switching to HTTPS</a>.</div>` : ""}
<div id="pastesuccess" class="hidden">
<div class="nav justify-content-between mb-2">
<button id="copyLink" type="button" class="btn btn-secondary d-flex justify-content-center align-items-center gap-1"><svg width="16" height="16" fill="currentColor" aria-hidden="true"><use href="img/bootstrap-icons.svg#copy" /></svg> Copy link</button>
<a href="#" id="deletelink" class="btn btn-secondary d-flex justify-content-center align-items-center gap-1"><svg width="16" height="16" fill="currentColor" aria-hidden="true"><use href="img/bootstrap-icons.svg#trash" /></svg><span></span></a>
</div>
<div role="alert" class="alert alert-success"><svg width="16" height="16" fill="currentColor" aria-hidden="true"><use href="img/bootstrap-icons.svg#check" /></svg><div id="pastelink"></div></div>
${config.urlShortener ? `<p><button id="shortenbutton" data-shortener="${escapeHtml(config.urlShortener)}"${config.shortenByDefault ? ' data-autoshorten="true"' : ""} type="button" class="btn btn-primary btn-block d-flex justify-content-center align-items-center gap-1"><svg width="16" height="16" fill="currentColor" aria-hidden="true"><use href="img/bootstrap-icons.svg#send" /></svg> Shorten URL</button></p>` : ""}
</div>
<ul id="editorTabs" class="nav nav-tabs hidden">
<li role="presentation" class="nav-item me-1"><a class="nav-link active" role="tab" id="messageedit" href="#">Editor</a></li>
<li role="presentation" class="nav-item me-1"><a class="nav-link" role="tab" id="messagepreview" href="#">Preview</a></li>
<li role="presentation" class="nav-item ms-auto"><button id="sendbutton" type="button" tabindex="2" class="hidden btn btn-primary d-flex justify-content-center align-items-center gap-1"><svg width="16" height="16" fill="currentColor" aria-hidden="true"><use href="img/bootstrap-icons.svg#cloud-upload" /></svg> Create</button></li>
</ul>
</section>
<section class="container-fluid">
<article>
<div id="placeholder" class="col-md-12 hidden">+++ no document text +++</div>
<div id="attachmentPreview" class="col-md-12 text-center hidden"></div>
<h6 id="copyShortcutHint" class="col-md-12"><small id="copyShortcutHintText"></small></h6>
<div id="prettymessage" class="card col-md-12 hidden">
<button type="button" id="prettyMessageCopyBtn" class="text-secondary opacity-05-1-hover">
<svg id="copyIcon" fill="currentColor" aria-hidden="true"><use href="img/bootstrap-icons.svg#copy" /></svg>
<svg id="copySuccessIcon" class="text-success" fill="currentColor" aria-hidden="true"><use href="img/bootstrap-icons.svg#check" /></svg>
</button>
<pre id="prettyprint" class="card-body col-md-12 prettyprint linenums:1"></pre>
</div>
<div id="plaintext" class="col-md-12 hidden"></div>
<p class="col-md-12"><textarea id="message" name="message" cols="80" rows="25" aria-label="Document text" tabindex="1" class="form-control hidden"></textarea></p>
<p class="col-md-12 form-check form-switch">
<input id="messagetab" type="checkbox" tabindex="3" class="form-check-input" checked="checked" />
<label for="messagetab" class="form-check-label">Tabulator key serves as character (Hit <kbd>Ctrl</kbd>+<kbd>m</kbd> or <kbd>Esc</kbd> to toggle)</label>
</p>
</article>
</section>
<section class="container-fluid">
<div id="discussion" class="hidden"><h4>Discussion</h4><div id="commentcontainer"></div></div>
</section>
<section class="container-fluid">
<div id="noscript" role="alert" class="alert alert-info noscript-hide"><svg width="16" height="16" fill="currentColor" aria-hidden="true"><use href="img/bootstrap-icons.svg#exclamation-circle" /></svg> Loading…</div>
</section>
</main>
<footer class="container-fluid mt-auto"><div class="row">
<h5 class="col-md-5 col-xs-8">${escapeHtml(config.siteName)} <small>- Because ignorance is bliss</small></h5>
<p class="col-md-1 col-xs-4 text-center">${version}</p>
<p id="aboutbox" class="col-md-6 col-xs-12">${escapeHtml(config.siteName)} is a minimalist, open source online pastebin where the server has zero knowledge of stored data. Data is encrypted/decrypted <i>in the browser</i> using 256 bits AES. ${config.infoText ? escapeHtml(config.infoText) : ""}</p>
</div></footer>
<div id="serverdata" class="hidden" aria-hidden="true">
<div id="templates">
<article id="commenttemplate" class="comment px-2 pb-3">
<div class="commentmeta"><span class="nickname">name</span><span class="commentdate">0000-00-00</span></div>
<div class="commentdata">c</div>
<button class="btn btn-secondary btn-sm">Reply</button>
</article>
<p id="commenttailtemplate" class="comment px-2 pb-3"><button class="btn btn-secondary btn-sm">Add comment</button></p>
<div id="replytemplate" class="reply hidden">
<input type="text" id="nickname" class="form-control my-2" title="Optional nickname…" placeholder="Optional nickname…" />
<textarea id="replymessage" class="replymessage form-control" cols="80" rows="7"></textarea><br />
<div id="replystatus" role="alert" class="statusmessage hidden alert"><svg width="16" height="16" fill="currentColor" aria-hidden="true"><use href="img/bootstrap-icons.svg#info-circle" /></svg></div>
<button id="replybutton" class="btn btn-secondary btn-sm">Post comment</button>
</div>
<div id="attachmenttemplate" role="alert" class="hidden alert alert-info">
<svg width="16" height="16" fill="currentColor" aria-hidden="true"><use href="img/bootstrap-icons.svg#download" /></svg>
<a class="alert-link">Download attachment<span></span></a>
</div>
</div>
</div>
${config.fileUpload ? '<div id="dropzone" class="hidden" tabindex="-1" aria-hidden="true"></div>' : ""}
</body>
</html>`;
}

export function handleHtml(request: Request, env: Env): Response {
  const config = loadConfig(env);
  const url = new URL(request.url);
  const html = renderTemplate(config, url);

  const cspHeader = config.cspHeader || "default-src 'none'; base-uri 'self'; form-action 'none'; manifest-src 'self'; connect-src * blob:; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; font-src 'self'; frame-ancestors 'none'; frame-src blob:; img-src 'self' data: blob:; media-src blob:; object-src blob:; sandbox allow-same-origin allow-scripts allow-forms allow-modals allow-downloads";

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": cspHeader,
      "Cross-Origin-Resource-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Permissions-Policy": "browsing-topics=()",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "deny",
      "Cache-Control": "no-store, no-cache, no-transform, must-revalidate",
      "Pragma": "no-cache",
    },
  });
}
