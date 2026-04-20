(()=>{document.addEventListener("DOMContentLoaded",()=>{let c="classic",t={name:document.getElementById("sig-name"),title:document.getElementById("sig-title"),company:document.getElementById("sig-company"),phone:document.getElementById("sig-phone"),email:document.getElementById("sig-email"),website:document.getElementById("sig-website"),address:document.getElementById("sig-address"),image:document.getElementById("sig-image"),facebook:document.getElementById("sig-facebook"),linkedin:document.getElementById("sig-linkedin"),twitter:document.getElementById("sig-twitter"),github:document.getElementById("sig-github"),instagram:document.getElementById("sig-instagram"),youtube:document.getElementById("sig-youtube"),discord:document.getElementById("sig-discord"),pinterest:document.getElementById("sig-pinterest"),whatsapp:document.getElementById("sig-whatsapp"),reddit:document.getElementById("sig-reddit"),twitch:document.getElementById("sig-twitch"),telegram:document.getElementById("sig-telegram"),spotify:document.getElementById("sig-spotify"),tiktok:document.getElementById("sig-tiktok"),snapchat:document.getElementById("sig-snapchat")},s=document.getElementById("signature-preview-container"),r=document.getElementById("signature-source-code"),p=document.querySelectorAll(".template-btn");function i(e){return e?e.replace(/[&<>'"]/g,o=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[o]||o):""}let h={classic:e=>`
<table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif; font-size: 14px; color: #333333; line-height: 1.4; max-width: 500px; width: 100%;">
    <tr>
        ${e.image?`
        <td style="padding-right: 20px; vertical-align: top; width: 80px;">
            <img src="${e.image}" alt="${e.name}" width="80" style="max-width: 80px; height: auto; border-radius: 4px; display: block;">
        </td>`:""}
        <td style="vertical-align: top; border-left: ${e.image?"2px solid #4f46e5":"none"}; padding-left: ${e.image?"20px":"0"};">
            <div style="font-size: 18px; font-weight: bold; color: #0f172a; margin-bottom: 2px;">${e.name}</div>
            <div style="font-size: 14px; color: #64748b; margin-bottom: 8px;">${e.title}${e.company?` at <strong style="color: #334155;">${e.company}</strong>`:""}</div>
            <table cellpadding="0" cellspacing="0" border="0" style="font-size: 13px; color: #475569;">
                ${e.phone?`<tr><td style="padding-bottom: 3px;"><strong style="color: #4f46e5;">P:</strong> <a href="tel:${e.phone.replace(/\s+/g,"")}" style="color: #475569; text-decoration: none;">${e.phone}</a></td></tr>`:""}
                ${e.email?`<tr><td style="padding-bottom: 3px;"><strong style="color: #4f46e5;">E:</strong> <a href="mailto:${e.email}" style="color: #475569; text-decoration: none;">${e.email}</a></td></tr>`:""}
                ${e.website?`<tr><td style="padding-bottom: 3px;"><strong style="color: #4f46e5;">W:</strong> <a href="${e.website}" target="_blank" style="color: #475569; text-decoration: none;">${e.displayWebsite}</a></td></tr>`:""}
                ${e.address?`<tr><td style="padding-top: 4px; color: #94a3b8; font-size: 12px;">${e.address}</td></tr>`:""}
            </table>
        </td>
    </tr>
</table>`.trim(),minimal:e=>`
<table cellpadding="0" cellspacing="0" border="0" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #444444; line-height: 1.5; max-width: 500px; width: 100%;">
    <tr>
        <td>
            <div style="font-size: 16px; font-weight: bold; color: #111111; letter-spacing: 0.5px;">${e.name.toUpperCase()}</div>
            <div style="font-size: 13px; color: #888888; margin-bottom: 12px; text-transform: uppercase;">${e.title}${e.company?` | ${e.company}`:""}</div>
            
            <div style="margin-bottom: 12px;">
                ${e.email?`<a href="mailto:${e.email}" style="color: #444444; text-decoration: none; margin-right: 12px;">${e.email}</a>`:""}
                ${e.phone?`<a href="tel:${e.phone.replace(/\s+/g,"")}" style="color: #444444; text-decoration: none; margin-right: 12px;">${e.phone}</a>`:""}
                ${e.website?`<a href="${e.website}" target="_blank" style="color: #444444; text-decoration: none;">${e.displayWebsite}</a>`:""}
            </div>
            
            ${e.image?`<img src="${e.image}" alt="${e.name}" height="40" style="height: 40px; width: auto; display: block; border-radius: 4px;">`:""}
        </td>
    </tr>
</table>`.trim(),corporate:e=>`
<table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif; font-size: 14px; color: #333333; line-height: 1.4; border-top: 3px solid #4f46e5; padding-top: 15px; width: 100%; max-width: 500px;">
    <tr>
        ${e.image?`
        <td style="padding-right: 15px; vertical-align: middle; width: 90px;">
            <img src="${e.image}" alt="${e.name}" width="90" style="max-width: 90px; height: auto; border-radius: 50%; display: block;">
        </td>`:""}
        <td style="vertical-align: middle;">
            <div style="font-size: 18px; font-weight: bold; color: #4f46e5; margin-bottom: 2px;">${e.name}</div>
            <div style="font-size: 14px; color: #334155; font-weight: bold; margin-bottom: 2px;">${e.title}</div>
            ${e.company?`<div style="font-size: 13px; color: #64748b; margin-bottom: 8px;">${e.company}</div>`:'<div style="margin-bottom: 8px;"></div>'}
            
            <div style="font-size: 12px; color: #475569;">
                ${e.phone?`<span style="margin-right: 10px;">\u{1F4DE} <a href="tel:${e.phone.replace(/\s+/g,"")}" style="color: #475569; text-decoration: none;">${e.phone}</a></span>`:""}
                ${e.email?`<span style="margin-right: 10px;">\u2709\uFE0F <a href="mailto:${e.email}" style="color: #475569; text-decoration: none;">${e.email}</a></span>`:""}
                ${e.website?`<span>\u{1F310} <a href="${e.website}" target="_blank" style="color: #475569; text-decoration: none;">${e.displayWebsite}</a></span>`:""}
            </div>
            ${e.address?`<div style="font-size: 12px; color: #94a3b8; margin-top: 5px;">\u{1F4CD} ${e.address}</div>`:""}
        </td>
    </tr>
</table>`.trim(),minimalistBrand:e=>`
<table style="width: 500px; font-size: 9pt; font-family: Arial, sans-serif; background: transparent !important;" cellpadding="0" cellspacing="0" border="0">
    <tbody>
        <tr>
            ${e.image?`
            <td style="width: 143px; vertical-align: middle; border-right: 1px solid #4f46e5" valign="middle">
                <img src="${e.image}" alt="${e.name}" width="116" height="116" style="border:1px solid #3e59ff; height:116px; width:116px; display:block; border-radius: 50%; object-fit: cover;"/> 
            </td>
            <td style="width: 26px;"></td>
            `:""}
            <td style="width: 331px; vertical-align: middle;">
                <span style="font-size: 10pt; font-family: Arial, sans-serif; color:#000000; font-weight: bold;">${e.name}<br></span>
                <span style="font-family: Arial, sans-serif; font-size: 9pt; line-height: 16px; color:#846d53;">${e.title}${e.company?` | ${e.company}`:""}<br></span>
        
                <p style="padding-top: 18px; padding-bottom: 0px; margin: 0px; font-size: 9pt; line-height: 16px;">

                    ${e.phone?`
                    <span style="font-size: 9pt; line-height: 16px; color:#846d53;">
                        <strong>P:</strong> <a href="tel:${e.phone.replace(/\s+/g,"")}" style="color:#846d53; text-decoration: none;">${e.phone}</a>
                    </span>
                    <span style="line-height: 16px;"><br></span>
                    `:""}
                    
                    ${e.email?`
                    <span style="font-family: Arial, sans-serif; font-size: 9pt; line-height: 16px; color:#846d53;">
                        <strong>E:</strong> <a href="mailto:${e.email}" style="font-size: 9pt; color:#846d53; text-decoration: none;">${e.email}</a>
                    </span>
                    <span style="line-height: 16px;"><br></span>
                    `:""}

                    ${e.website?`
                    <span style="padding: 0px; margin-top: 10px; margin-bottom: 0px; color:#846d53;">
                        <strong>W:</strong> <a href="${e.website}" target="_blank" rel="noopener" style="font-family: Arial, sans-serif; font-size: 9pt; color: #846d53 !important; text-decoration:none !important;">${e.displayWebsite}</a>
                    </span>
                    <span style="line-height: 16px;"><br></span>
                    `:""}

                    ${e.address?`
                    <span style="line-height: 16px;">
                        <span style="font-size: 9pt; line-height: 16px; font-family: Arial, sans-serif; color: #846d53;">${e.address}</span>
                    </span>
                    <br><br>
                    `:"<br>"}

                    <span style="display: inline-flex; flex-wrap: wrap; gap: 8px; align-items: center;">
                        ${e.facebook?`
                        <a href="${e.facebook}" target="_blank" rel="noopener" style="text-decoration: none;">
                            <img src="https://m2pdf.com/img/social/facebook.png" alt="Facebook" width="16" height="16" style="display: block; border: none;" />
                        </a>`:""}

                        ${e.twitter?`
                        <a href="${e.twitter}" target="_blank" rel="noopener" style="text-decoration: none;">
                            <img src="https://m2pdf.com/img/social/twitter.png" alt="Twitter" width="16" height="16" style="display: block; border: none;" />
                        </a>`:""}
                        
                        ${e.github?`
                        <a href="${e.github}" target="_blank" rel="noopener" style="text-decoration: none;">
                            <img src="https://m2pdf.com/img/social/github.png" alt="GitHub" width="16" height="16" style="display: block; border: none;" />
                        </a>`:""}
                        
                        ${e.linkedin?`
                        <a href="${e.linkedin}" target="_blank" rel="noopener" style="text-decoration: none;">
                            <img src="https://m2pdf.com/img/social/linkedin.png" alt="LinkedIn" width="16" height="16" style="display: block; border: none;" />
                        </a>`:""}
                        
                        ${e.instagram?`
                        <a href="${e.instagram}" target="_blank" rel="noopener" style="text-decoration: none;">
                            <img src="https://m2pdf.com/img/social/instagram.png" alt="Instagram" width="16" height="16" style="display: block; border: none;" />
                        </a>`:""}

                        ${e.youtube?`
                        <a href="${e.youtube}" target="_blank" rel="noopener" style="text-decoration: none;">
                            <img src="https://m2pdf.com/img/social/youtube.png" alt="YouTube" width="16" height="16" style="display: block; border: none;" />
                        </a>`:""}

                        ${e.discord?`
                        <a href="${e.discord}" target="_blank" rel="noopener" style="text-decoration: none;">
                            <img src="https://m2pdf.com/img/social/discord.png" alt="Discord" width="16" height="16" style="display: block; border: none;" />
                        </a>`:""}

                        ${e.pinterest?`
                        <a href="${e.pinterest}" target="_blank" rel="noopener" style="text-decoration: none;">
                            <img src="https://m2pdf.com/img/social/pinterest.png" alt="Pinterest" width="16" height="16" style="display: block; border: none;" />
                        </a>`:""}

                        ${e.whatsapp?`
                        <a href="${e.whatsapp}" target="_blank" rel="noopener" style="text-decoration: none;">
                            <img src="https://m2pdf.com/img/social/whatsapp.png" alt="WhatsApp" width="16" height="16" style="display: block; border: none;" />
                        </a>`:""}

                        ${e.reddit?`
                        <a href="${e.reddit}" target="_blank" rel="noopener" style="text-decoration: none;">
                            <img src="https://m2pdf.com/img/social/reddit.png" alt="Reddit" width="16" height="16" style="display: block; border: none;" />
                        </a>`:""}

                        ${e.twitch?`
                        <a href="${e.twitch}" target="_blank" rel="noopener" style="text-decoration: none;">
                            <img src="https://m2pdf.com/img/social/twitch.png" alt="Twitch" width="16" height="16" style="display: block; border: none;" />
                        </a>`:""}

                        ${e.telegram?`
                        <a href="${e.telegram}" target="_blank" rel="noopener" style="text-decoration: none;">
                            <img src="https://m2pdf.com/img/social/telegram.png" alt="Telegram" width="16" height="16" style="display: block; border: none;" />
                        </a>`:""}

                        ${e.spotify?`
                        <a href="${e.spotify}" target="_blank" rel="noopener" style="text-decoration: none;">
                            <img src="https://m2pdf.com/img/social/spotify.png" alt="Spotify" width="16" height="16" style="display: block; border: none;" />
                        </a>`:""}

                        ${e.tiktok?`
                        <a href="${e.tiktok}" target="_blank" rel="noopener" style="text-decoration: none;">
                            <img src="https://m2pdf.com/img/social/tiktok.png" alt="TikTok" width="16" height="16" style="display: block; border: none;" />
                        </a>`:""}

                        ${e.snapchat?`
                        <a href="${e.snapchat}" target="_blank" rel="noopener" style="text-decoration: none;">
                            <img src="https://m2pdf.com/img/social/snapchat.png" alt="Snapchat" width="16" height="16" style="display: block; border: none;" />
                        </a>`:""}
                    </span>
                </p>                
            </td>
        </tr>
    </tbody>
</table>`.trim()};function a(){let e={name:i(t.name.value),title:i(t.title.value),company:i(t.company.value),phone:i(t.phone.value),email:i(t.email.value),website:i(t.website.value),displayWebsite:i(t.website.value.replace(/^https?:\/\//,"")),address:i(t.address.value),image:i(t.image.value),facebook:i(t.facebook.value),linkedin:i(t.linkedin.value),twitter:i(t.twitter.value),github:i(t.github.value),instagram:i(t.instagram.value),youtube:i(t.youtube.value),discord:i(t.discord.value),pinterest:i(t.pinterest.value),whatsapp:i(t.whatsapp.value),reddit:i(t.reddit.value),twitch:i(t.twitch.value),telegram:i(t.telegram.value),spotify:i(t.spotify.value),tiktok:i(t.tiktok.value),snapchat:i(t.snapchat.value)},o=h[c](e);s.innerHTML=o,r.value=o}Object.values(t).forEach(e=>{e&&e.addEventListener("input",a)}),p.forEach(e=>{e.addEventListener("click",o=>{p.forEach(l=>{l.classList.remove("active","border-indigo-600","text-indigo-700"),l.classList.add("border-slate-200","text-slate-600","hover:border-slate-300","hover:bg-slate-50")});let n=o.currentTarget;n.classList.remove("border-slate-200","text-slate-600","hover:border-slate-300","hover:bg-slate-50"),n.classList.add("active","border-indigo-600","text-indigo-700"),c=n.dataset.template,a()})});let g=document.querySelectorAll(".tab-btn"),y=document.querySelectorAll(".tab-pane");g.forEach(e=>{e.addEventListener("click",o=>{g.forEach(l=>{l.classList.remove("active","text-indigo-600","border-indigo-600"),l.classList.add("text-slate-500","border-transparent")}),o.currentTarget.classList.remove("text-slate-500","border-transparent"),o.currentTarget.classList.add("active","text-indigo-600","border-indigo-600");let n=o.currentTarget.dataset.target;y.forEach(l=>{l.id===n?(l.classList.remove("hidden"),l.classList.add("flex")):(l.classList.add("hidden"),l.classList.remove("flex"))})})}),a();function d(e){let o=document.getElementById(e);o.classList.remove("hidden"),setTimeout(()=>{o.classList.add("hidden")},3e3)}document.getElementById("btn-copy-visual").addEventListener("click",()=>{if(navigator.clipboard&&window.ClipboardItem){let e=new Blob([r.value],{type:"text/html"}),o=new Blob([s.innerText],{type:"text/plain"}),n=[new ClipboardItem({"text/html":e,"text/plain":o})];navigator.clipboard.write(n).then(()=>d("copy-feedback-visual")).catch(()=>m(s))}else m(s)}),document.getElementById("btn-copy-html").addEventListener("click",()=>{r.select(),document.execCommand("copy"),window.getSelection().removeAllRanges(),d("copy-feedback-html")});function m(e){let o=document.createRange();o.selectNodeContents(e);let n=window.getSelection();n.removeAllRanges(),n.addRange(o),document.execCommand("copy"),n.removeAllRanges(),d("copy-feedback-visual")}});})();
