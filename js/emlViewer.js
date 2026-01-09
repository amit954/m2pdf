(()=>{var E=Object.defineProperty;var x=(o,e)=>()=>(o&&(e=o(o=0)),e);var k=(o,e)=>{for(var t in e)E(o,t,{get:e[t],enumerable:!0})};var h,T=x(()=>{h=class o{constructor(e){if(this._headers={},this._body=null,this._multiParts=[],this._isAttachment=!1,typeof e!="object")throw new Error("invalid content for class MultiPartParser");this._lineEnding=this.getLineEnding(e);let t=this.splitHeaderFromBody(e);if(t.header){let i=new TextDecoder("utf-8").decode(t.header).split(/\n(?=[^\s])/g);for(let r of i){let s=r.indexOf(":");if(s!==-1){let l=r.substring(0,s).toLowerCase().trim(),c=r.substring(s+1).trim();this._headers[l]&&typeof this._headers[l]=="string"&&(this._headers[l]=[this._headers[l]]),this._headers[l]?this._headers[l].push(c):this._headers[l]=c}}}let n=this.getContentType(),a=this.getHeader("Content-Disposition");if(a&&a.match(/attachment/i)&&(this._isAttachment=!0),this._isAttachment)this.parseBodyApplication(t.body);else switch(n.mediaType){case"multipart":this.parseBodyMultipart(t.body,n.args);break;case"text":this.parseBodyText(t.body);break;default:this.parseBodyApplication(t.body);break}}get isAttachment(){return this._isAttachment}get contentType(){let e=this.getContentType();return e.mediaType&&e.subType?e.mediaType+"/"+e.subType:null}getContentType(){let e=this.getHeader("Content-Type");if(e){let t=e.match(/([a-z]+)\/([a-z0-9\-\.\+_]+);?((?:.|\s)*)$/i);if(t){let n=t[3]&&t[3].trim()!==""?t[3].trim():null;return{mediaType:t[1].toLowerCase(),subType:t[2].toLowerCase(),args:n}}}return{mediaType:null,subType:null,args:null}}getBody(){return this._body}getPartByContentType(e,t=null){return this.recursiveGetByContentType(this,e,t)||null}getHeader(e,t=!1,n=!1){let a=null;return this._headers[e.toLowerCase()]&&(a=this._headers[e.toLowerCase()]),a&&t&&(a=typeof a=="string"?this.decodeRfc1342(a):a.map(this.decodeRfc1342.bind(this))),a&&n&&(a=typeof a=="string"?a.replace(/\r?\n\s/g,""):a.map((i=>i.replace(/\r?\n\s/g,"")))),a}getMultiParts(){return this._multiParts}getFilename(){let e=this.getHeader("Content-Disposition"),t=e&&e.match(/filename=\"?([^"\n]+)\"?/i);if(t)return this.decodeRfc1342(t[1]);let n=this.getHeader("Content-Type"),a=n&&n.match(/name=\"?([^"\n]+)\"?/i);return a?this.decodeRfc1342(a[1]):null}decodeContent(e,t=null){let n=this.getHeader("Content-Transfer-Encoding");switch(n=n?n.toUpperCase():"BINARY",n){case"BASE64":return this.decodeBase64(e);case"QUOTED-PRINTABLE":return this.decodeQuotedPrintable(e,t);case"8BIT":case"7BIT":case"BINARY":return e}}decodeRfc1342(e){let t=new TextDecoder;return e=e.replace(/=\?([0-9a-z\-_:]+)\?(B|Q)\?(.*?)\?=/gi,((n,a,i,r)=>{let s=null;switch(i.toUpperCase()){case"B":s=this.decodeBase64(r,a);break;case"Q":s=this.decodeQuotedPrintable(r,a,!0);break;default:throw new Error('invalid string encoding "'+i+'"')}return t.decode(new Uint8Array(s))}))}decodeBase64(e,t=null){e instanceof Uint8Array&&(e=new TextDecoder().decode(e));let n=atob(e),a=n.length,i=new Uint8Array(a);for(let r=0;r<a;r++)i[r]=n.charCodeAt(r);if(t){let r=new TextDecoder(t);return new TextEncoder().encode(r.decode(i)).buffer}return i.buffer}decodeQuotedPrintable(e,t,n=!1){e instanceof Uint8Array&&(e=new TextDecoder().decode(e)),n&&(e=e.replace(/_/g," "));let a=new TextDecoder(t||"utf-8"),i=e.replace(/[\t\x20]$/gm,"").replace(/=(?:\r\n?|\n)/g,"").replace(/((?:=[a-fA-F0-9]{2})+)/g,(r=>{let s=r.substring(1).split("="),l=new Uint8Array(s.length);for(let c=0;c<s.length;c++)l[c]=parseInt(s[c],16);return a.decode(l)}));return new TextEncoder().encode(i).buffer}getBoundary(e){let t=e.match(/boundary=\"?([^"\s\n]+)\"?/i);return t?t[1]:null}recursiveGetByContentType(e,t,n){let a=e.getContentType();if(t===a.mediaType&&(!n||n===a.subType))return e;for(let i of e.getMultiParts())if(i instanceof o){let r=this.recursiveGetByContentType(i,t,n);if(r)return r}return null}getLineEnding(e){let t=new Uint8Array(e),n=0,a=0;for(let i=0;i<t.length;i++)t[i]===10&&t[i-1]===13?a++:t[i]===10&&n++;return n>0&&a>0?"mixed":n>0?"unix":a>0?"windows":"unknown"}splitHeaderFromBody(e){let t=new Uint8Array(e),n=null,a=0;for(let s=0;s<t.length;s++){if(this._lineEnding!=="unix"&&t[s]===13&&t[s+1]===10&&t[s+2]===13&&t[s+3]===10){a=4,n=s;break}if(t[s]===10&&t[s+1]===10){a=2,n=s;break}}let i=null,r=null;return n?(i=t.slice(0,n),r=t.slice(n+a)):r=t,{header:i,body:r}}parseBodyApplication(e){this._body=this.decodeContent(e,null)}parseBodyText(e){let t="utf-8",n=this.getContentType().args;n&&n.match(/charset=\"?([^"\s\n;]+)\"?/i)&&(t=n.match(/charset=\"?([^"\s\n;]+)\"?/i)[1]);let a=this.decodeContent(e,t),i=new TextDecoder;this._body=i.decode(new Uint8Array(a))}parseBodyMultipart(e,t){let n=this.getBoundary(t);if(!n)throw new Error("Boundary not found.");let a="--"+n+"--",i=this.indexOfString(e,a);if(i===-1)throw new Error("Final Boundary not found");let r=e.slice(0,i+a.length);for(let s=0;s<1e3;s++){let l="--"+n,c=this.indexOfString(r,l),d=this.indexOfString(r,l,c+1);if(c===-1||d===-1)break;c+=l.length;let p=r.slice(c,d);this._multiParts.push(new o(p)),r=r.slice(d)}}indexOfString(e,t,n=0,a="utf-8"){let i=new TextEncoder(a).encode(t);return e.findIndex(((r,s)=>{if(s<n)return!1;for(let l=0;l<i.length;l++)if(e[s+l]!==i[l])return!1;return!0}))}}});var B={};k(B,{EmlReader:()=>g});var g,v=x(()=>{T();g=class{#e=null;constructor(e){this.#e=new h(e)}getDate(){let e=this.#e.getHeader("date");return e?new Date(e):null}getSubject(){return this.#e.getHeader("subject",!0,!0)}getFrom(){return this.#e.getHeader("from",!0,!0)}getBcc(){return this.#e.getHeader("bcc",!0,!0)}getCc(){return this.#e.getHeader("cc",!0,!0)}getTo(){return this.#e.getHeader("to",!0,!0)}getReplyTo(){return this.#e.getHeader("reply-to",!0,!0)}getType(){return this.#e.getHeader("received")?"received":"sent"}getHeader(e,t=!1,n=!1){return this.#e.getHeader(e,t,n)}getAttachments(){let e=[],t=this.#e.getPartByContentType("multipart","mixed");if(t)for(let n of t.getMultiParts())n.isAttachment&&e.push({filename:n.getFilename(),contentType:n.contentType,content:n.getBody(),filesize:n.getBody().byteLength});else{let n=this.#e.getPartByContentType("application","octet-stream");n&&n.getFilename()&&e.push({filename:n.getFilename(),contentType:n.contentType,content:n.getBody(),filesize:n.getBody().byteLength})}return e}getMessageText(){let e=this.#e.getPartByContentType("text","plain");if(e&&!e.isAttachment)return e.getBody();let t=this.#e.getPartByContentType("text","html");if(t&&!t.isAttachment){let n=t.getBody(),a=n.indexOf("<body");a!==-1&&(n=n.substring(a)),n=n.replace(/<style[\s\w\W]+<\/style>/g,"");let i=document.createElement("div");return i.innerHTML=n,i.innerText.replace(/\r?\n\s+\r?\n/g,`

`).trim()}return null}getMessageHtml(){let e=this.#e.getPartByContentType("text","html");if(e&&!e.isAttachment)return e.getBody();let t=this.#e.getPartByContentType("text","plain");return t&&!t.isAttachment?t.getBody().replace(/\r?\n/g,"<br />"):null}}});var f,y=[];function L(o){return o.replace(/[^a-z0-9\s.\-_]/gi,"").replace(/\s+/g," ").trim().replace(/\s/g,"_")||"attachments"}function P(o){if(o===0)return"0 Bytes";let e=Math.floor(Math.log(o)/Math.log(1024));return parseFloat((o/Math.pow(1024,e)).toFixed(2))+" "+["Bytes","KB","MB","GB","TB"][e]}function _(o){return o.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,"")}function u(o,e){let t=document.getElementById("email-content");if(t.innerHTML="",e){let n=document.createElement("div");n.className="email-content-container",n.innerHTML=_(o),t.appendChild(n)}else{let n=document.createElement("pre");n.className="plain-text-content",n.style.whiteSpace="pre-wrap",n.style.margin="0",n.textContent=o,t.appendChild(n)}}async function C(o){if(o&&o.name.toLowerCase().endsWith(".eml"))if(f)try{$("#error-message").hide();let e=await o.arrayBuffer(),t=new f(e);$("#email-subject").text(t.getSubject()||"(No Subject)"),$("#email-from").text(t.getFrom()||"Unknown"),$("#email-to").text(t.getTo()||"Unknown");let n=t.getDate();if(n){let d={weekday:"short",day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!0,timeZoneName:"shortOffset"},p=n.toLocaleString("en-US",d).replace(/,/g,"").replace(/(\d{2}):(\d{2}):(\d{2})/,"$1:$2:$3").replace("GMT","");$("#email-date").text(p)}else $("#email-date").text("Unknown");let a=t.getCc();$("#cc-container").toggle(!!a),a&&$("#email-cc").text(a);let i=t.getBcc();$("#bcc-container").toggle(!!i),i&&$("#email-bcc").text(i);let r=t.getReplyTo();$("#reply-to-container").toggle(!!r),r&&$("#email-reply-to").text(r);let s=t.getAttachments();if(y=s,s.length>0){let d=$("#attachments-list");d.empty(),s.forEach(((p,m)=>{let A=P(p.filesize);d.append(`
                        <div class="attachment-item">
                            <span class="attachment-name">${p.filename}</span>
                            <span class="attachment-size">${A}</span>
                            <a href="#" class="attachment-download no-print" 
                               onclick="downloadAttachment('${p.filename}', '${p.contentType}', ${m}); return false;">
                                <i class="bi bi-download"></i>
                            </a>
                        </div>
                    `)})),$("#attachments-section").show(),$("#download-all").toggle(s.length>1),s.length>1&&$("#download-all").off("click").on("click",window.downloadAllAttachments)}else $("#attachments-section").hide(),$("#download-all").hide();let l=t.getMessageHtml(),c=t.getMessageText();l?u(l.replace(/(\r\n|\n|\r)/g,"").replace(/\s+/g," ").replace(/> +</g,"><").replace(/<br\s*\/?>/gi,"<br>").replace(/(<br>){3,}/gi,"<br><br>").trim(),!0):u(c?c.replace(/(\r\n|\n|\r)+/g,`
`).replace(/\n\s+\n/g,`

`).replace(/\s+/g," ").replace(/\n{3,}/g,`

`).trim():"(No content)",!1),$("#email-display").show(),setTimeout((()=>{document.getElementById("email-display").scrollIntoView({behavior:"smooth",block:"start"})}),100)}catch(e){$("#error-message").text("Error processing email: "+e.message).show()}else $("#error-message").text("EML parser not loaded. Please check console for errors.").show();else $("#error-message").text("Please drop an .eml file").show()}function U(){let o=$("#email-subject").text(),e=$("#email-from").text(),t=$("#email-to").text(),n=$("#email-date").text(),a=$("#email-cc").text(),i=$("#email-bcc").text(),r=$("#email-reply-to").text(),s=$("#email-content").html(),l="";if($("#attachments-section").is(":visible")){let d=[];$("#attachments-list .attachment-item").each((function(){let p=$(this).find(".attachment-name").text(),m=$(this).find(".attachment-size").text();d.push(`<div style="display:flex;margin:8px 0;"><span style="flex-grow:1;">${p}</span><span style="color:#5f6368;margin-left:10px;">${m}</span></div>`)})),d.length>0&&(l=`
                <div style="border-top: 1px solid #e0e0e0; padding-top: 10px; margin-top: 20px;">
                    <h3 style="font-size: 16px; margin-bottom: 10px;">Attachments</h3>
                    ${d.join("")}
                </div>
            `)}let c=window.open("","_blank");c.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Print: ${o}</title>
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
                <h1 class="email-subject">${o}</h1>
                
                <div class="metadata">
                    <div class="metadata-row">
                        <span class="metadata-label">From:</span>
                        <span>${e}</span>
                    </div>
                    <div class="metadata-row">
                        <span class="metadata-label">To:</span>
                        <span>${t}</span>
                    </div>
                    ${a?`
                    <div class="metadata-row">
                        <span class="metadata-label">CC:</span>
                        <span>${a}</span>
                    </div>
                    `:""}
                    ${i?`
                    <div class="metadata-row">
                        <span class="metadata-label">BCC:</span>
                        <span>${i}</span>
                    </div>
                    `:""}
                    <div class="metadata-row">
                        <span class="metadata-label">Date:</span>
                        <span>${n}</span>
                    </div>
                    ${r?`
                    <div class="metadata-row">
                        <span class="metadata-label">Reply-To:</span>
                        <span>${r}</span>
                    </div>
                    `:""}
                </div>
                
                <div class="email-content">
                    ${s}
                </div>
                
                ${l}
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
    `),c.document.close()}function w(){$(".email-header, .email-content").addClass("no-page-break"),$(".email-content").css({"padding-top":"0","margin-top":"0"}),$("#email-display").css({"margin-top":"0","padding-top":"0"}),$("body").addClass("printing"),$("#email-content").height()>1e3&&$("html, body").css("height","auto"),/Chrome/.test(navigator.userAgent)&&($(".email-header").css("position","relative"),$(".email-content").css("position","relative"))}function b(){$("body").removeClass("printing"),$("html, body").css("height",""),$(".email-header").css("position",""),$(".email-content").css("position","")}if($(document).ready((async function(){try{f=(await Promise.resolve().then(()=>(v(),B))).EmlReader}catch(e){$("#error-message").text("Error loading EML parser: "+e.message).show()}$(document).on("drag dragstart dragend dragover dragenter dragleave drop",(function(e){e.preventDefault(),e.stopPropagation()}));let o=$("#drop-zone");o.on("click",(function(){let e=$('<input type="file" accept=".eml" style="display: none">');e.on("change",(function(t){let n=t.target.files[0];n&&C(n)})),e.click()})),o.on("dragover dragenter",(function(){$(this).addClass("drag-over")})).on("dragleave dragend drop",(function(){$(this).removeClass("drag-over")})).on("drop",(function(e){C(e.originalEvent.dataTransfer.files[0])})),$("#print-button").off("click").on("click",(function(){U()}))})),window.matchMedia){let o=window.matchMedia("print");o.addEventListener?o.addEventListener("change",(function(e){e.matches?w():b()})):o.addListener&&o.addListener((function(e){e.matches?w():b()}))}window.onbeforeprint=w,window.onafterprint=b,window.downloadAllAttachments=async function(){let o=new JSZip,e=L($("#email-subject").text()||"attachments");y.forEach((t=>{o.file(t.filename,t.content)}));try{let t=await o.generateAsync({type:"blob",compression:"DEFLATE",compressionOptions:{level:9}}),n=URL.createObjectURL(t),a=document.createElement("a");a.href=n,a.download=`${e}_attachments.zip`,document.body.appendChild(a),a.click(),document.body.removeChild(a),URL.revokeObjectURL(n)}catch(t){alert("Error creating ZIP file: "+t.message)}},window.downloadAttachment=function(o,e,t){let n=y[t],a=new Blob([n.content],{type:e}),i=URL.createObjectURL(a),r=document.createElement("a");r.href=i,r.download=o,document.body.appendChild(r),r.click(),document.body.removeChild(r),URL.revokeObjectURL(i)};})();
/*
 * Copyright © 2023 Netas Ltd., Switzerland.
 * @author  Lukas Buchs, lukas.buchs@netas.ch
 * @license MIT
 * @date    2023-02-17
 */
