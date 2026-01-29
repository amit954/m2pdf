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

  // src/js/emlViewer-iframe.js
  var currentAttachments = [];
  var EmlReader2;
  function sanitizeFilename(input) {
    let safe = input.replace(/[^a-z0-9\s.\-_]/gi, "").replace(/\s+/g, " ").trim().replace(/\s/g, "_");
    return safe || "attachments";
  }
  function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }
  window.downloadAllAttachments = async function() {
    const zip = new JSZip();
    const subject = $("#email-subject").text() || "attachments";
    const safeSubject = sanitizeFilename(subject);
    currentAttachments.forEach((attachment) => {
      zip.file(attachment.filename, attachment.content);
    });
    try {
      const content = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: {
          level: 9
        }
      });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${safeSubject}_attachments.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error creating ZIP:", error);
      alert("Error creating ZIP file: " + error.message);
    }
  };
  window.downloadAttachment = function(filename, contentType, index) {
    const attachment = currentAttachments[index];
    const blob = new Blob([attachment.content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  async function handleFile(file) {
    if (!file || !file.name.toLowerCase().endsWith(".eml")) {
      $("#error-message").text("Please drop an .eml file").show();
      return;
    }
    if (!EmlReader2) {
      $("#error-message").text("EML parser not loaded. Please check console for errors.").show();
      return;
    }
    try {
      $("#error-message").hide();
      const buffer = await file.arrayBuffer();
      const emlReader = new EmlReader2(buffer);
      $("#email-subject").text(emlReader.getSubject() || "(No Subject)");
      $("#email-from").text(emlReader.getFrom() || "Unknown");
      $("#email-to").text(emlReader.getTo() || "Unknown");
      const date = emlReader.getDate();
      if (date) {
        const options = {
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
          timeZoneName: "shortOffset"
        };
        const formattedDate = date.toLocaleString("en-US", options).replace(/,/g, "").replace(/(\d{2}):(\d{2}):(\d{2})/, "$1:$2:$3").replace("GMT", "");
        $("#email-date").text(formattedDate);
      } else {
        $("#email-date").text("Unknown");
      }
      const cc = emlReader.getCc();
      if (cc) {
        $("#email-cc").text(cc);
        $("#cc-container").show();
      } else {
        $("#cc-container").hide();
      }
      const bcc = emlReader.getBcc();
      if (bcc) {
        $("#email-bcc").text(bcc);
        $("#bcc-container").show();
      } else {
        $("#bcc-container").hide();
      }
      const replyTo = emlReader.getReplyTo();
      if (replyTo) {
        $("#email-reply-to").text(replyTo);
        $("#reply-to-container").show();
      } else {
        $("#reply-to-container").hide();
      }
      const attachments = emlReader.getAttachments();
      currentAttachments = attachments;
      if (attachments.length > 0) {
        const attachmentsList = $("#attachments-list");
        attachmentsList.empty();
        attachments.forEach((attachment, index) => {
          const size = formatFileSize(attachment.filesize);
          attachmentsList.append(`
                    <div class="attachment-item">
                        <span class="attachment-name">${attachment.filename}</span>
                        <span class="attachment-size">${size}</span>
                        <a href="#" class="attachment-download no-print" 
                           onclick="downloadAttachment('${attachment.filename}', '${attachment.contentType}', ${index}); return false;">
                            <i class="bi bi-download"></i>
                        </a>
                    </div>
                `);
        });
        $("#attachments-section").show();
        if (attachments.length > 1) {
          $("#download-all").show().off("click").on("click", window.downloadAllAttachments);
        } else {
          $("#download-all").hide();
        }
      } else {
        $("#attachments-section").hide();
        $("#download-all").hide();
      }
      const htmlContent = emlReader.getMessageHtml();
      const textContent = emlReader.getMessageText();
      if (htmlContent) {
        const cleanHtml = htmlContent.replace(/(\r\n|\n|\r)/g, "").replace(/\s+/g, " ").replace(/> +</g, "><").replace(/<br\s*\/?>/gi, "<br>").replace(/(<br>){3,}/gi, "<br><br>").trim();
        $("#email-content").html(cleanHtml);
      } else if (textContent) {
        const cleanText = textContent.replace(/(\r\n|\n|\r)+/g, "\n").replace(/\n\s+\n/g, "\n\n").replace(/\s+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
        $("#email-content").text(cleanText);
      } else {
        $("#email-content").text("(No content)");
      }
      $("#email-display").show();
    } catch (error) {
      console.error("Error processing email:", error);
      $("#error-message").text("Error processing email: " + error.message).show();
    }
  }
  $(document).ready(async function() {
    try {
      const module = await Promise.resolve().then(() => (init_EmlReader(), EmlReader_exports));
      EmlReader2 = module.EmlReader;
    } catch (error) {
      console.error("Error loading EmlReader:", error);
      $("#error-message").text("Error loading EML parser: " + error.message).show();
    }
    $(document).on("drag dragstart dragend dragover dragenter dragleave drop", function(e) {
      e.preventDefault();
      e.stopPropagation();
    });
    const dropZone = $("#drop-zone");
    dropZone.on("click", function() {
      const input = $('<input type="file" accept=".eml" style="display: none">');
      input.on("change", function(e) {
        const file = e.target.files[0];
        if (file) handleFile(file);
      });
      input.click();
    });
    dropZone.on("dragover dragenter", function() {
      $(this).addClass("drag-over");
    });
    dropZone.on("dragleave dragend drop", function() {
      $(this).removeClass("drag-over");
    });
    dropZone.on("drop", function(e) {
      const file = e.originalEvent.dataTransfer.files[0];
      handleFile(file);
    });
    $("#print-button").on("click", function() {
      window.print();
    });
  });
})();
/*
 * Copyright © 2023 Netas Ltd., Switzerland.
 * @author  Lukas Buchs, lukas.buchs@netas.ch
 * @license MIT
 * @date    2023-02-17
 */
