(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // src/js/MultiPartParser.js
  var MultiPartParser;
  var init_MultiPartParser = __esm({
    "src/js/MultiPartParser.js"() {
      MultiPartParser = class _MultiPartParser {
        constructor(e) {
          if (this._headers = {}, this._body = null, this._multiParts = [], this._isAttachment = false, "object" != typeof e) throw new Error("invalid content for class MultiPartParser");
          this._lineEnding = this.getLineEnding(e);
          const t = this.splitHeaderFromBody(e);
          if (t.header) {
            const e2 = new TextDecoder("utf-8").decode(t.header).split(/\n(?=[^\s])/g);
            for (let t2 of e2) {
              const e3 = t2.indexOf(":");
              if (-1 !== e3) {
                const n2 = t2.substring(0, e3).toLowerCase().trim(), r2 = t2.substring(e3 + 1).trim();
                this._headers[n2] && "string" == typeof this._headers[n2] && (this._headers[n2] = [this._headers[n2]]), this._headers[n2] ? this._headers[n2].push(r2) : this._headers[n2] = r2;
              }
            }
          }
          let n = this.getContentType();
          const r = this.getHeader("Content-Disposition");
          if (r && r.match(/attachment/i) && (this._isAttachment = true), this._isAttachment) this.parseBodyApplication(t.body);
          else switch (n.mediaType) {
            case "multipart":
              this.parseBodyMultipart(t.body, n.args);
              break;
            case "text":
              this.parseBodyText(t.body);
              break;
            default:
              this.parseBodyApplication(t.body);
              break;
          }
        }
        get isAttachment() {
          return this._isAttachment;
        }
        get contentType() {
          let e = this.getContentType();
          return e.mediaType && e.subType ? e.mediaType + "/" + e.subType : null;
        }
        getContentType() {
          let e = this.getHeader("Content-Type");
          if (e) {
            let t = e.match(/([a-z]+)\/([a-z0-9\-\.\+_]+);?((?:.|\s)*)$/i);
            if (t) {
              const e2 = t[3] && "" !== t[3].trim() ? t[3].trim() : null;
              return { mediaType: t[1].toLowerCase(), subType: t[2].toLowerCase(), args: e2 };
            }
          }
          return { mediaType: null, subType: null, args: null };
        }
        getBody() {
          return this._body;
        }
        getPartByContentType(e, t = null) {
          let n = this.recursiveGetByContentType(this, e, t);
          return n || null;
        }
        getHeader(e, t = false, n = false) {
          let r = null;
          return this._headers[e.toLowerCase()] && (r = this._headers[e.toLowerCase()]), r && t && (r = "string" == typeof r ? this.decodeRfc1342(r) : r.map(this.decodeRfc1342.bind(this))), r && n && (r = "string" == typeof r ? r.replace(/\r?\n\s/g, "") : r.map(((e2) => e2.replace(/\r?\n\s/g, "")))), r;
        }
        getMultiParts() {
          return this._multiParts;
        }
        getFilename() {
          let e = this.getHeader("Content-Disposition"), t = e && e.match(/filename=\"?([^"\n]+)\"?/i);
          if (t) return this.decodeRfc1342(t[1]);
          let n = this.getHeader("Content-Type"), r = n && n.match(/name=\"?([^"\n]+)\"?/i);
          return r ? this.decodeRfc1342(r[1]) : null;
        }
        decodeContent(e, t = null) {
          let n = this.getHeader("Content-Transfer-Encoding");
          switch (n = n ? n.toUpperCase() : "BINARY", n) {
            case "BASE64":
              return this.decodeBase64(e);
            case "QUOTED-PRINTABLE":
              return this.decodeQuotedPrintable(e, t);
            case "8BIT":
            case "7BIT":
            case "BINARY":
              return e;
          }
        }
        decodeRfc1342(e) {
          const t = new TextDecoder();
          return e = e.replace(/=\?([0-9a-z\-_:]+)\?(B|Q)\?(.*?)\?=/gi, ((e2, n, r, i) => {
            let s = null;
            switch (r.toUpperCase()) {
              case "B":
                s = this.decodeBase64(i, n);
                break;
              case "Q":
                s = this.decodeQuotedPrintable(i, n, true);
                break;
              default:
                throw new Error('invalid string encoding "' + r + '"');
            }
            return t.decode(new Uint8Array(s));
          }));
        }
        decodeBase64(e, t = null) {
          if (e instanceof Uint8Array) {
            e = new TextDecoder().decode(e);
          }
          const n = atob(e), r = n.length, i = new Uint8Array(r);
          for (let e2 = 0; e2 < r; e2++) i[e2] = n.charCodeAt(e2);
          if (t) {
            const e2 = new TextDecoder(t);
            return new TextEncoder().encode(e2.decode(i)).buffer;
          }
          return i.buffer;
        }
        decodeQuotedPrintable(e, t, n = false) {
          if (e instanceof Uint8Array) {
            e = new TextDecoder().decode(e);
          }
          n && (e = e.replace(/_/g, " "));
          const r = new TextDecoder(t || "utf-8"), i = e.replace(/[\t\x20]$/gm, "").replace(/=(?:\r\n?|\n)/g, "").replace(/((?:=[a-fA-F0-9]{2})+)/g, ((e2) => {
            const t2 = e2.substring(1).split("="), n2 = new Uint8Array(t2.length);
            for (let e3 = 0; e3 < t2.length; e3++) n2[e3] = parseInt(t2[e3], 16);
            return r.decode(n2);
          }));
          return new TextEncoder().encode(i).buffer;
        }
        getBoundary(e) {
          const t = e.match(/boundary=\"?([^"\s\n]+)\"?/i);
          return t ? t[1] : null;
        }
        recursiveGetByContentType(e, t, n) {
          const r = e.getContentType();
          if (t === r.mediaType && (!n || n === r.subType)) return e;
          for (let r2 of e.getMultiParts()) if (r2 instanceof _MultiPartParser) {
            let e2 = this.recursiveGetByContentType(r2, t, n);
            if (e2) return e2;
          }
          return null;
        }
        getLineEnding(e) {
          const t = new Uint8Array(e);
          let n = 0, r = 0;
          for (let e2 = 0; e2 < t.length; e2++) 10 === t[e2] && 13 === t[e2 - 1] ? r++ : 10 === t[e2] && n++;
          return n > 0 && r > 0 ? "mixed" : n > 0 ? "unix" : r > 0 ? "windows" : "unknown";
        }
        splitHeaderFromBody(e) {
          const t = new Uint8Array(e);
          let n = null, r = 0;
          for (let e2 = 0; e2 < t.length; e2++) {
            if ("unix" !== this._lineEnding && 13 === t[e2] && 10 === t[e2 + 1] && 13 === t[e2 + 2] && 10 === t[e2 + 3]) {
              r = 4, n = e2;
              break;
            }
            if (10 === t[e2] && 10 === t[e2 + 1]) {
              r = 2, n = e2;
              break;
            }
          }
          let i = null, s = null;
          return n ? (i = t.slice(0, n), s = t.slice(n + r)) : s = t, { header: i, body: s };
        }
        parseBodyApplication(e) {
          this._body = this.decodeContent(e, null);
        }
        parseBodyText(e) {
          let t = "utf-8";
          const n = this.getContentType().args;
          if (n && n.match(/charset=\"?([^"\s\n;]+)\"?/i)) {
            t = n.match(/charset=\"?([^"\s\n;]+)\"?/i)[1];
          }
          const r = this.decodeContent(e, t), i = new TextDecoder();
          this._body = i.decode(new Uint8Array(r));
        }
        parseBodyMultipart(e, t) {
          const n = this.getBoundary(t);
          if (!n) throw new Error("Boundary not found.");
          const r = "--" + n + "--", i = this.indexOfString(e, r);
          if (-1 === i) throw new Error("Final Boundary not found");
          let s = e.slice(0, i + r.length);
          for (let e2 = 0; e2 < 1e3; e2++) {
            let e3 = "--" + n, t2 = this.indexOfString(s, e3), r2 = this.indexOfString(s, e3, t2 + 1);
            if (-1 === t2 || -1 === r2) break;
            t2 += e3.length;
            const i2 = s.slice(t2, r2);
            this._multiParts.push(new _MultiPartParser(i2)), s = s.slice(r2);
          }
        }
        indexOfString(e, t, n = 0, r = "utf-8") {
          const i = new TextEncoder(r).encode(t);
          return e.findIndex(((t2, r2) => {
            if (r2 < n) return false;
            for (let t3 = 0; t3 < i.length; t3++) if (e[r2 + t3] !== i[t3]) return false;
            return true;
          }));
        }
      };
    }
  });

  // src/js/EmlReader.js
  var EmlReader_exports = {};
  __export(EmlReader_exports, {
    EmlReader: () => EmlReader
  });
  var EmlReader;
  var init_EmlReader = __esm({
    "src/js/EmlReader.js"() {
      init_MultiPartParser();
      EmlReader = class {
        #t = null;
        constructor(t) {
          this.#t = new MultiPartParser(t);
        }
        getDate() {
          let t = this.#t.getHeader("date");
          return t ? new Date(t) : null;
        }
        getSubject() {
          return this.#t.getHeader("subject", true, true);
        }
        getFrom() {
          return this.#t.getHeader("from", true, true);
        }
        getBcc() {
          return this.#t.getHeader("bcc", true, true);
        }
        getCc() {
          return this.#t.getHeader("cc", true, true);
        }
        getTo() {
          return this.#t.getHeader("to", true, true);
        }
        getReplyTo() {
          return this.#t.getHeader("reply-to", true, true);
        }
        getType() {
          return this.#t.getHeader("received") ? "received" : "sent";
        }
        getHeader(t, e = false, r = false) {
          return this.#t.getHeader(t, e, r);
        }
        getAttachments() {
          let t = [], e = this.#t.getPartByContentType("multipart", "mixed");
          if (e) for (const r of e.getMultiParts()) r.isAttachment && t.push({ filename: r.getFilename(), contentType: r.contentType, content: r.getBody(), filesize: r.getBody().byteLength });
          else {
            const e2 = this.#t.getPartByContentType("application", "octet-stream");
            e2 && e2.getFilename() && t.push({ filename: e2.getFilename(), contentType: e2.contentType, content: e2.getBody(), filesize: e2.getBody().byteLength });
          }
          return t;
        }
        getMessageText() {
          let t = this.#t.getPartByContentType("text", "plain");
          if (t && !t.isAttachment) return t.getBody();
          let e = this.#t.getPartByContentType("text", "html");
          if (e && !e.isAttachment) {
            let t2 = e.getBody(), r = t2.indexOf("<body");
            -1 !== r && (t2 = t2.substring(r)), t2 = t2.replace(/<style[\s\w\W]+<\/style>/g, "");
            let a = document.createElement("div");
            return a.innerHTML = t2, a.innerText.replace(/\r?\n\s+\r?\n/g, "\n\n").trim();
          }
          return null;
        }
        getMessageHtml() {
          let t = this.#t.getPartByContentType("text", "html");
          if (t && !t.isAttachment) return t.getBody();
          let e = this.#t.getPartByContentType("text", "plain");
          return e && !e.isAttachment ? e.getBody().replace(/\r?\n/g, "<br />") : null;
        }
      };
    }
  });

  // src/js/emlViewer.js
  var EmlReader2;
  var currentAttachments = [];
  function sanitizeFilename(e) {
    return e.replace(/[^a-z0-9\s.\-_]/gi, "").replace(/\s+/g, " ").trim().replace(/\s/g, "_") || "attachments";
  }
  function formatFileSize(e) {
    if (0 === e) return "0 Bytes";
    const t = Math.floor(Math.log(e) / Math.log(1024));
    return parseFloat((e / Math.pow(1024, t)).toFixed(2)) + " " + ["Bytes", "KB", "MB", "GB", "TB"][t];
  }
  function sanitizeHtml(e) {
    return e.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  }
  function displayEmailContent(e, t) {
    const n = document.getElementById("email-content");
    if (n.innerHTML = "", t) {
      const t2 = document.createElement("div");
      t2.className = "email-content-container", t2.innerHTML = sanitizeHtml(e), n.appendChild(t2);
    } else {
      const t2 = document.createElement("pre");
      t2.className = "plain-text-content", t2.style.whiteSpace = "pre-wrap", t2.style.margin = "0", t2.textContent = e, n.appendChild(t2);
    }
  }
  async function handleFile(e) {
    if (e && e.name.toLowerCase().endsWith(".eml")) if (EmlReader2) try {
      $("#error-message").hide();
      const t = await e.arrayBuffer(), n = new EmlReader2(t);
      $("#email-subject").text(n.getSubject() || "(No Subject)"), $("#email-from").text(n.getFrom() || "Unknown"), $("#email-to").text(n.getTo() || "Unknown");
      const a = n.getDate();
      if (a) {
        const e2 = { weekday: "short", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true, timeZoneName: "shortOffset" }, t2 = a.toLocaleString("en-US", e2).replace(/,/g, "").replace(/(\d{2}):(\d{2}):(\d{2})/, "$1:$2:$3").replace("GMT", "");
        $("#email-date").text(t2);
      } else $("#email-date").text("Unknown");
      const o = n.getCc();
      $("#cc-container").toggle(!!o), o && $("#email-cc").text(o);
      const i = n.getBcc();
      $("#bcc-container").toggle(!!i), i && $("#email-bcc").text(i);
      const s = n.getReplyTo();
      $("#reply-to-container").toggle(!!s), s && $("#email-reply-to").text(s);
      const l = n.getAttachments();
      if (currentAttachments = l, l.length > 0) {
        const e2 = $("#attachments-list");
        e2.empty(), l.forEach(((t2, n2) => {
          const a2 = formatFileSize(t2.filesize);
          e2.append(`
                        <div class="attachment-item">
                            <span class="attachment-name">${t2.filename}</span>
                            <span class="attachment-size">${a2}</span>
                            <a href="#" class="attachment-download no-print" 
                               onclick="downloadAttachment('${t2.filename}', '${t2.contentType}', ${n2}); return false;">
                                <i class="bi bi-download"></i>
                            </a>
                        </div>
                    `);
        })), $("#attachments-section").show(), $("#download-all").toggle(l.length > 1), l.length > 1 && $("#download-all").off("click").on("click", window.downloadAllAttachments);
      } else $("#attachments-section").hide(), $("#download-all").hide();
      const r = n.getMessageHtml(), c = n.getMessageText();
      if (r) {
        displayEmailContent(r.replace(/(\r\n|\n|\r)/g, "").replace(/\s+/g, " ").replace(/> +</g, "><").replace(/<br\s*\/?>/gi, "<br>").replace(/(<br>){3,}/gi, "<br><br>").trim(), true);
      } else if (c) {
        displayEmailContent(c.replace(/(\r\n|\n|\r)+/g, "\n").replace(/\n\s+\n/g, "\n\n").replace(/\s+/g, " ").replace(/\n{3,}/g, "\n\n").trim(), false);
      } else displayEmailContent("(No content)", false);
      $("#email-display").show(), setTimeout((() => {
        document.getElementById("email-display").scrollIntoView({ behavior: "smooth", block: "start" });
      }), 100);
    } catch (e2) {
      $("#error-message").text("Error processing email: " + e2.message).show();
    }
    else $("#error-message").text("EML parser not loaded. Please check console for errors.").show();
    else $("#error-message").text("Please drop an .eml file").show();
  }
  function createPrintVersion() {
    const e = $("#email-subject").text(), t = $("#email-from").text(), n = $("#email-to").text(), a = $("#email-date").text(), o = $("#email-cc").text(), i = $("#email-bcc").text(), s = $("#email-reply-to").text(), l = $("#email-content").html();
    let r = "";
    if ($("#attachments-section").is(":visible")) {
      const e2 = [];
      $("#attachments-list .attachment-item").each((function() {
        const t2 = $(this).find(".attachment-name").text(), n2 = $(this).find(".attachment-size").text();
        e2.push(`<div style="display:flex;margin:8px 0;"><span style="flex-grow:1;">${t2}</span><span style="color:#5f6368;margin-left:10px;">${n2}</span></div>`);
      })), e2.length > 0 && (r = `
                <div style="border-top: 1px solid #e0e0e0; padding-top: 10px; margin-top: 20px;">
                    <h3 style="font-size: 16px; margin-bottom: 10px;">Attachments</h3>
                    ${e2.join("")}
                </div>
            `);
    }
    const c = window.open("", "_blank");
    c.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Print: ${e}</title>
            <meta charset="UTF-8">
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                    line-height: 1.5;
                    color: #000;
                    margin: 0;
                    padding: 20px;
                }
                .container {
                    max-width: 100%;
                    margin: 0 auto;
                }
                .email-subject {
                    font-size: 20px;
                    font-weight: bold;
                    margin: 0 0 15px 0;
                }
                .metadata-row {
                    display: flex;
                    padding: 3px 0;
                }
                .metadata-label {
                    font-weight: 500;
                    color: #5f6368;
                    min-width: 55px;
                    margin-right: 5px;
                }
                .email-content {
                    margin-top: 20px;
                    border-top: 1px solid #e0e0e0;
                    padding-top: 20px;
                }
                img { max-width: 100%; height: auto; }
                pre, code { white-space: pre-wrap; }
                * { word-break: break-word; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1 class="email-subject">${e}</h1>
                
                <div class="metadata">
                    <div class="metadata-row">
                        <span class="metadata-label">From:</span>
                        <span>${t}</span>
                    </div>
                    <div class="metadata-row">
                        <span class="metadata-label">To:</span>
                        <span>${n}</span>
                    </div>
                    ${o ? `
                    <div class="metadata-row">
                        <span class="metadata-label">CC:</span>
                        <span>${o}</span>
                    </div>
                    ` : ""}
                    ${i ? `
                    <div class="metadata-row">
                        <span class="metadata-label">BCC:</span>
                        <span>${i}</span>
                    </div>
                    ` : ""}
                    <div class="metadata-row">
                        <span class="metadata-label">Date:</span>
                        <span>${a}</span>
                    </div>
                    ${s ? `
                    <div class="metadata-row">
                        <span class="metadata-label">Reply-To:</span>
                        <span>${s}</span>
                    </div>
                    ` : ""}
                </div>
                
                <div class="email-content">
                    ${l}
                </div>
                
                ${r}
            </div>
            
            <script>
                // Automatically print and then close the window when done
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                        // Optional: Close the window after printing
                        // Uncomment the next line if you want the print window to close automatically
                        // window.close();
                    }, 500);
                };
            <\/script>
        </body>
        </html>
    `), c.document.close();
  }
  function preparePrint() {
    $(".email-header, .email-content").addClass("no-page-break"), $(".email-content").css({ "padding-top": "0", "margin-top": "0" }), $("#email-display").css({ "margin-top": "0", "padding-top": "0" }), $("body").addClass("printing");
    $("#email-content").height() > 1e3 && $("html, body").css("height", "auto"), /Chrome/.test(navigator.userAgent) && ($(".email-header").css("position", "relative"), $(".email-content").css("position", "relative"));
  }
  function restorePage() {
    $("body").removeClass("printing"), $("html, body").css("height", ""), $(".email-header").css("position", ""), $(".email-content").css("position", "");
  }
  if ($(document).ready((async function() {
    try {
      const e2 = await Promise.resolve().then(() => (init_EmlReader(), EmlReader_exports));
      EmlReader2 = e2.EmlReader;
    } catch (e2) {
      $("#error-message").text("Error loading EML parser: " + e2.message).show();
    }
    $(document).on("drag dragstart dragend dragover dragenter dragleave drop", (function(e2) {
      e2.preventDefault(), e2.stopPropagation();
    }));
    const e = $("#drop-zone");
    e.on("click", (function() {
      const e2 = $('<input type="file" accept=".eml" style="display: none">');
      e2.on("change", (function(e3) {
        const t = e3.target.files[0];
        t && handleFile(t);
      })), e2.click();
    })), e.on("dragover dragenter", (function() {
      $(this).addClass("drag-over");
    })).on("dragleave dragend drop", (function() {
      $(this).removeClass("drag-over");
    })).on("drop", (function(e2) {
      handleFile(e2.originalEvent.dataTransfer.files[0]);
    })), $("#print-button").off("click").on("click", (function() {
      createPrintVersion();
    }));
  })), window.matchMedia) {
    const e = window.matchMedia("print");
    e.addEventListener ? e.addEventListener("change", (function(e2) {
      e2.matches ? preparePrint() : restorePage();
    })) : e.addListener && e.addListener((function(e2) {
      e2.matches ? preparePrint() : restorePage();
    }));
  }
  window.onbeforeprint = preparePrint, window.onafterprint = restorePage, window.downloadAllAttachments = async function() {
    const e = new JSZip(), t = sanitizeFilename($("#email-subject").text() || "attachments");
    currentAttachments.forEach(((t2) => {
      e.file(t2.filename, t2.content);
    }));
    try {
      const n = await e.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 9 } }), a = URL.createObjectURL(n), o = document.createElement("a");
      o.href = a, o.download = `${t}_attachments.zip`, document.body.appendChild(o), o.click(), document.body.removeChild(o), URL.revokeObjectURL(a);
    } catch (e2) {
      alert("Error creating ZIP file: " + e2.message);
    }
  }, window.downloadAttachment = function(e, t, n) {
    const a = currentAttachments[n], o = new Blob([a.content], { type: t }), i = URL.createObjectURL(o), s = document.createElement("a");
    s.href = i, s.download = e, document.body.appendChild(s), s.click(), document.body.removeChild(s), URL.revokeObjectURL(i);
  };
})();
/*
 * Copyright © 2023 Netas Ltd., Switzerland.
 * @author  Lukas Buchs, lukas.buchs@netas.ch
 * @license MIT
 * @date    2023-02-17
 */
