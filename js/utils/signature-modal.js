(()=>{var f=class{constructor(t){this.onSave=t,this.modal=null,this.drawCanvas=null,this.ctx=null,this.isDrawing=!1,this.uploadedImage=null,this.activeTab="draw"}open(){this.modal||this.createModal(),this.modal.style.display="flex",this.resetCanvas(),this.switchTab("draw")}close(){this.modal&&(this.modal.style.display="none")}createModal(){let t=document.createElement("div");t.className="signature-modal-overlay",t.innerHTML=`
            <div class="signature-modal">
                <div class="modal-header">
                    <h3>Create Signature</h3>
                    <button class="close-btn">&times;</button>
                </div>
                
                <div class="modal-tabs">
                    <button class="tab-btn active" data-tab="draw">Draw</button>
                    <button class="tab-btn" data-tab="upload">Upload Image</button>
                </div>

                <div class="modal-body">
                    <div id="tab-draw" class="tab-content active">
                        <div class="canvas-wrapper">
                            <canvas id="sign-pad"></canvas>
                            <div class="canvas-placeholder">Sign here</div>
                        </div>
                        <button class="clear-btn">Clear</button>
                    </div>

                    <div id="tab-upload" class="tab-content">
                        <div class="upload-area" id="drop-zone">
                            <i class="bi bi-cloud-upload"></i>
                            <p>Click or Drop Signature Image</p>
                            <input type="file" id="sig-file-input" accept="image/*" hidden>
                        </div>
                        <div class="preview-area" style="display:none;">
                            <canvas id="preview-canvas"></canvas>
                            
                            <div class="controls">
                                <label>Remove Background</label>
                                <input type="checkbox" id="remove-bg-check" checked>
                                <div class="slider-group" id="threshold-group">
                                    <span>Threshold</span>
                                    <input type="range" id="bg-threshold" min="0" max="255" value="200">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-footer">
                    <button class="btn-cancel">Cancel</button>
                    <button class="btn-apply">Apply Signature</button>
                </div>
            </div>
        `,document.body.appendChild(t),this.modal=t,this.setupListeners(t)}setupListeners(t){t.querySelectorAll(".tab-btn").forEach(i=>{i.onclick=()=>this.switchTab(i.dataset.tab)}),t.querySelector(".close-btn").onclick=()=>this.close(),t.querySelector(".btn-cancel").onclick=()=>this.close();let e=t.querySelector("#sign-pad");this.drawCanvas=e,this.ctx=e.getContext("2d"),this.setupDrawingPad(e),t.querySelector(".clear-btn").onclick=()=>this.resetCanvas();let a=t.querySelector("#drop-zone"),s=t.querySelector("#sig-file-input");a.onclick=()=>s.click(),s.onchange=i=>this.handleFile(i.target.files[0]),a.ondragover=i=>{i.preventDefault(),a.classList.add("dragover")},a.ondragleave=()=>a.classList.remove("dragover"),a.ondrop=i=>{i.preventDefault(),a.classList.remove("dragover"),i.dataTransfer.files[0]&&this.handleFile(i.dataTransfer.files[0])};let r=t.querySelector("#bg-threshold"),l=t.querySelector("#remove-bg-check");r.oninput=()=>this.updatePreview(),l.onchange=i=>{t.querySelector("#threshold-group").style.opacity=i.target.checked?"1":"0.5",this.updatePreview()},t.querySelector(".btn-apply").onclick=()=>this.handleSave()}setupDrawingPad(t){let e=window.devicePixelRatio||1,a=t.getBoundingClientRect();t.width=a.width*e,t.height=a.height*e,this.ctx.scale(e,e),this.ctx.lineCap="round",this.ctx.lineJoin="round",this.ctx.lineWidth=3,this.ctx.strokeStyle="#000000";let s=!1,r=n=>{s=!0,this.ctx.beginPath();let{x:o,y:d}=this.getPos(n,t);this.ctx.moveTo(o,d),this.modal.querySelector(".canvas-placeholder").style.display="none"},l=n=>{if(!s)return;n.preventDefault();let{x:o,y:d}=this.getPos(n,t);this.ctx.lineTo(o,d),this.ctx.stroke()},i=()=>s=!1;t.addEventListener("mousedown",r),t.addEventListener("mousemove",l),t.addEventListener("mouseup",i),t.addEventListener("touchstart",r,{passive:!1}),t.addEventListener("touchmove",l,{passive:!1}),t.addEventListener("touchend",i)}getPos(t,e){let a=e.getBoundingClientRect(),s=t.touches?t.touches[0].clientX:t.clientX,r=t.touches?t.touches[0].clientY:t.clientY;return{x:s-a.left,y:r-a.top}}switchTab(t){this.activeTab=t,this.modal.querySelectorAll(".tab-btn").forEach(e=>e.classList.toggle("active",e.dataset.tab===t)),this.modal.querySelectorAll(".tab-content").forEach(e=>e.classList.toggle("active",e.id===`tab-${t}`)),t==="draw"&&this.resetCanvas()}resetCanvas(){let t=this.drawCanvas.parentElement;this.drawCanvas.style.width="100%",this.drawCanvas.style.height="100%";let e=window.devicePixelRatio||1,a=this.drawCanvas.getBoundingClientRect();this.drawCanvas.width=a.width*e,this.drawCanvas.height=a.height*e,this.ctx.scale(e,e),this.ctx.lineCap="round",this.ctx.lineJoin="round",this.ctx.lineWidth=3,this.modal.querySelector(".canvas-placeholder").style.display="block"}handleFile(t){if(!t)return;let e=new FileReader;e.onload=a=>{let s=new Image;s.onload=()=>{this.uploadedImage=s,this.modal.querySelector("#drop-zone").style.display="none",this.modal.querySelector(".preview-area").style.display="block",this.updatePreview()},s.src=a.target.result},e.readAsDataURL(t)}updatePreview(){if(!this.uploadedImage)return;let t=this.modal.querySelector("#preview-canvas"),e=t.getContext("2d"),a=this.modal.querySelector("#remove-bg-check").checked,s=parseInt(this.modal.querySelector("#bg-threshold").value),l=Math.min(1,400/this.uploadedImage.width);if(t.width=this.uploadedImage.width*l,t.height=this.uploadedImage.height*l,e.drawImage(this.uploadedImage,0,0,t.width,t.height),a){let i=e.getImageData(0,0,t.width,t.height),n=i.data;for(let o=0;o<n.length;o+=4)(n[o]+n[o+1]+n[o+2])/3>s&&(n[o+3]=0);e.putImageData(i,0,0)}}handleSave(){let t;this.activeTab==="draw"?t=this.drawCanvas:t=this.modal.querySelector("#preview-canvas");let e=this.trimCanvas(t),a=e.toDataURL("image/png"),s=e.width/e.height;this.onSave(a,s),this.close()}trimCanvas(t){let e=t.getContext("2d"),a=t.width,s=t.height,l=e.getImageData(0,0,a,s).data,i=null,n=null,o=null,d=null,h,u;for(let c=0;c<l.length;c+=4)l[c+3]!==0&&(h=c/4%a,u=Math.floor(c/4/a),i===null&&(i=u),n===null&&(n=u),o===null&&(o=h),d===null&&(d=h),u<i&&(i=u),u>n&&(n=u),h<o&&(o=h),h>d&&(d=h));if(i===null){let c=document.createElement("canvas");return c.width=1,c.height=1,c}let g=10,b=Math.max(0,i-g),w=Math.max(0,o-g),y=Math.min(s,n+g),p=Math.min(a,d+g)-w,m=y-b,v=document.createElement("canvas");return v.width=p,v.height=m,v.getContext("2d").drawImage(t,w,b,p,m,0,0,p,m),v}};})();
