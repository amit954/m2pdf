let EmlReader,currentAttachments=[];function sanitizeFilename(e){return e.replace(/[^a-z0-9\s.\-_]/gi,"").replace(/\s+/g," ").trim().replace(/\s/g,"_")||"attachments"}function formatFileSize(e){if(0===e)return"0 Bytes";const t=Math.floor(Math.log(e)/Math.log(1024));return parseFloat((e/Math.pow(1024,t)).toFixed(2))+" "+["Bytes","KB","MB","GB","TB"][t]}function createContentIframe(){const e=document.createElement("iframe");return e.id="email-content-frame",e.style.width="100%",e.style.border="none",e.style.overflow="hidden",e.setAttribute("frameborder","0"),e.setAttribute("scrolling","no"),e}function resizeIframe(e){if(!e.contentWindow)return;const t=e.contentWindow.document.body.querySelector(".email-content").offsetHeight;e.style.height=`${t}px`}function initializeIframe(e,t,n){setTimeout((()=>{const a=e.contentDocument||e.contentWindow.document,o=`\n            <!DOCTYPE html>\n            <html>\n            <head>\n                <meta charset="UTF-8">\n                <base target="_blank">\n                <style>\n                    body {\n                        margin: 0;\n                        padding: 0;\n                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;\n                        line-height: 1.5;\n                        color: #000;\n                        background: #fff;\n                    }\n                    img { max-width: 100%; height: auto; }\n                    pre, code { white-space: pre-wrap; }\n                    a { color: #4f46e5; }\n                    * { word-break: break-word; }\n                    .email-content { \n                        min-height: 20px;\n                        padding: 16px;\n                        margin: 0;\n                    }\n                </style>\n            </head>\n            <body><div class="email-content">${n?t:`<pre style="margin: 0; white-space: pre-wrap;">${t}</pre>`}</div></body>\n            </html>\n        `;a.open(),a.write(o),a.close();const r=a.getElementsByTagName("img");let i=0;const c=()=>{setTimeout((()=>{resizeIframe(e)}),100)},l=()=>{i++,i===r.length&&c()};r.length>0?Array.from(r).forEach((e=>{e.complete?l():(e.addEventListener("load",l),e.addEventListener("error",l))})):c()}),0)}async function handleFile(e){if(e&&e.name.toLowerCase().endsWith(".eml"))if(EmlReader)try{$("#error-message").hide();const t=await e.arrayBuffer(),n=new EmlReader(t);$("#email-subject").text(n.getSubject()||"(No Subject)"),$("#email-from").text(n.getFrom()||"Unknown"),$("#email-to").text(n.getTo()||"Unknown");const a=n.getDate();if(a){const e={weekday:"short",day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!0,timeZoneName:"shortOffset"},t=a.toLocaleString("en-US",e).replace(/,/g,"").replace(/(\d{2}):(\d{2}):(\d{2})/,"$1:$2:$3").replace("GMT","");$("#email-date").text(t)}else $("#email-date").text("Unknown");const o=n.getCc();$("#cc-container").toggle(!!o),o&&$("#email-cc").text(o);const r=n.getBcc();$("#bcc-container").toggle(!!r),r&&$("#email-bcc").text(r);const i=n.getReplyTo();$("#reply-to-container").toggle(!!i),i&&$("#email-reply-to").text(i);const c=n.getAttachments();if(currentAttachments=c,c.length>0){const e=$("#attachments-list");e.empty(),c.forEach(((t,n)=>{const a=formatFileSize(t.filesize);e.append(`\n                    <div class="attachment-item">\n                        <span class="attachment-name">${t.filename}</span>\n                        <span class="attachment-size">${a}</span>\n                        <a href="#" class="attachment-download no-print" \n                           onclick="downloadAttachment('${t.filename}', '${t.contentType}', ${n}); return false;">\n                            <i class="bi bi-download"></i>\n                        </a>\n                    </div>\n                `)})),$("#attachments-section").show(),$("#download-all").toggle(c.length>1),c.length>1&&$("#download-all").off("click").on("click",window.downloadAllAttachments)}else $("#attachments-section").hide(),$("#download-all").hide();const l=$("#email-content");l.empty();const s=createContentIframe(),d=n.getMessageHtml(),m=n.getMessageText(),g=()=>{if(d){const e=d.replace(/(\r\n|\n|\r)/g,"").replace(/\s+/g," ").replace(/> +</g,"><").replace(/<br\s*\/?>/gi,"<br>").replace(/(<br>){3,}/gi,"<br><br>").trim();initializeIframe(s,e,!0)}else if(m){const e=m.replace(/(\r\n|\n|\r)+/g,"\n").replace(/\n\s+\n/g,"\n\n").replace(/\s+/g," ").replace(/\n{3,}/g,"\n\n").trim();initializeIframe(s,e,!1)}else initializeIframe(s,"(No content)",!1)};l.append(s),g(),$("#email-display").show(),setTimeout((()=>{document.getElementById("email-display").scrollIntoView({behavior:"smooth",block:"start"})}),100)}catch(e){$("#error-message").text("Error processing email: "+e.message).show()}else $("#error-message").text("EML parser not loaded. Please check console for errors.").show();else $("#error-message").text("Please drop an .eml file").show()}$(document).ready((async function(){try{const e=await import("./EmlReader.js");EmlReader=e.EmlReader}catch(e){$("#error-message").text("Error loading EML parser: "+e.message).show()}$(document).on("drag dragstart dragend dragover dragenter dragleave drop",(function(e){e.preventDefault(),e.stopPropagation()}));const e=$("#drop-zone");e.on("click",(function(){const e=$('<input type="file" accept=".eml" style="display: none">');e.on("change",(function(e){const t=e.target.files[0];t&&handleFile(t)})),e.click()})),e.on("dragover dragenter",(function(){$(this).addClass("drag-over")})).on("dragleave dragend drop",(function(){$(this).removeClass("drag-over")})).on("drop",(function(e){handleFile(e.originalEvent.dataTransfer.files[0])})),$("#print-button").on("click",(function(){window.print()}))})),window.downloadAllAttachments=async function(){const e=new JSZip,t=sanitizeFilename($("#email-subject").text()||"attachments");currentAttachments.forEach((t=>{e.file(t.filename,t.content)}));try{const n=await e.generateAsync({type:"blob",compression:"DEFLATE",compressionOptions:{level:9}}),a=URL.createObjectURL(n),o=document.createElement("a");o.href=a,o.download=`${t}_attachments.zip`,document.body.appendChild(o),o.click(),document.body.removeChild(o),URL.revokeObjectURL(a)}catch(e){alert("Error creating ZIP file: "+e.message)}},window.downloadAttachment=function(e,t,n){const a=currentAttachments[n],o=new Blob([a.content],{type:t}),r=URL.createObjectURL(o),i=document.createElement("a");i.href=r,i.download=e,document.body.appendChild(i),i.click(),document.body.removeChild(i),URL.revokeObjectURL(r)}; 