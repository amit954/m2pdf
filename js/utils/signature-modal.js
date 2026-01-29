(() => {
  // src/js/utils/signature-modal.js
  var SignatureModal = class {
    constructor(onSave) {
      this.onSave = onSave;
      this.modal = null;
      this.drawCanvas = null;
      this.ctx = null;
      this.isDrawing = false;
      this.uploadedImage = null;
      this.activeTab = "draw";
    }
    open() {
      if (!this.modal) this.createModal();
      this.modal.style.display = "flex";
      this.resetCanvas();
      this.switchTab("draw");
    }
    close() {
      if (this.modal) this.modal.style.display = "none";
    }
    createModal() {
      const overlay = document.createElement("div");
      overlay.className = "signature-modal-overlay";
      overlay.innerHTML = `
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
        `;
      document.body.appendChild(overlay);
      this.modal = overlay;
      this.setupListeners(overlay);
    }
    setupListeners(overlay) {
      overlay.querySelectorAll(".tab-btn").forEach((btn) => {
        btn.onclick = () => this.switchTab(btn.dataset.tab);
      });
      overlay.querySelector(".close-btn").onclick = () => this.close();
      overlay.querySelector(".btn-cancel").onclick = () => this.close();
      const canvas = overlay.querySelector("#sign-pad");
      this.drawCanvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.setupDrawingPad(canvas);
      overlay.querySelector(".clear-btn").onclick = () => this.resetCanvas();
      const dropZone = overlay.querySelector("#drop-zone");
      const fileInput = overlay.querySelector("#sig-file-input");
      dropZone.onclick = () => fileInput.click();
      fileInput.onchange = (e) => this.handleFile(e.target.files[0]);
      dropZone.ondragover = (e) => {
        e.preventDefault();
        dropZone.classList.add("dragover");
      };
      dropZone.ondragleave = () => dropZone.classList.remove("dragover");
      dropZone.ondrop = (e) => {
        e.preventDefault();
        dropZone.classList.remove("dragover");
        if (e.dataTransfer.files[0]) this.handleFile(e.dataTransfer.files[0]);
      };
      const thresholdSlider = overlay.querySelector("#bg-threshold");
      const bgCheck = overlay.querySelector("#remove-bg-check");
      thresholdSlider.oninput = () => this.updatePreview();
      bgCheck.onchange = (e) => {
        overlay.querySelector("#threshold-group").style.opacity = e.target.checked ? "1" : "0.5";
        this.updatePreview();
      };
      overlay.querySelector(".btn-apply").onclick = () => this.handleSave();
    }
    setupDrawingPad(canvas) {
      const ratio = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      this.ctx.scale(ratio, ratio);
      this.ctx.lineCap = "round";
      this.ctx.lineJoin = "round";
      this.ctx.lineWidth = 3;
      this.ctx.strokeStyle = "#000000";
      let isDrawing = false;
      const start = (e) => {
        isDrawing = true;
        this.ctx.beginPath();
        const { x, y } = this.getPos(e, canvas);
        this.ctx.moveTo(x, y);
        this.modal.querySelector(".canvas-placeholder").style.display = "none";
      };
      const move = (e) => {
        if (!isDrawing) return;
        e.preventDefault();
        const { x, y } = this.getPos(e, canvas);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
      };
      const end = () => isDrawing = false;
      canvas.addEventListener("mousedown", start);
      canvas.addEventListener("mousemove", move);
      canvas.addEventListener("mouseup", end);
      canvas.addEventListener("touchstart", start, { passive: false });
      canvas.addEventListener("touchmove", move, { passive: false });
      canvas.addEventListener("touchend", end);
    }
    getPos(e, canvas) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    }
    switchTab(tab) {
      this.activeTab = tab;
      this.modal.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
      this.modal.querySelectorAll(".tab-content").forEach((c) => c.classList.toggle("active", c.id === `tab-${tab}`));
      if (tab === "draw") {
        this.resetCanvas();
      }
    }
    resetCanvas() {
      const parent = this.drawCanvas.parentElement;
      this.drawCanvas.style.width = "100%";
      this.drawCanvas.style.height = "100%";
      const ratio = window.devicePixelRatio || 1;
      const rect = this.drawCanvas.getBoundingClientRect();
      this.drawCanvas.width = rect.width * ratio;
      this.drawCanvas.height = rect.height * ratio;
      this.ctx.scale(ratio, ratio);
      this.ctx.lineCap = "round";
      this.ctx.lineJoin = "round";
      this.ctx.lineWidth = 3;
      this.modal.querySelector(".canvas-placeholder").style.display = "block";
    }
    handleFile(file) {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          this.uploadedImage = img;
          this.modal.querySelector("#drop-zone").style.display = "none";
          this.modal.querySelector(".preview-area").style.display = "block";
          this.updatePreview();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
    updatePreview() {
      if (!this.uploadedImage) return;
      const canvas = this.modal.querySelector("#preview-canvas");
      const ctx = canvas.getContext("2d");
      const removeBg = this.modal.querySelector("#remove-bg-check").checked;
      const threshold = parseInt(this.modal.querySelector("#bg-threshold").value);
      const MAX_W = 400;
      const scale = Math.min(1, MAX_W / this.uploadedImage.width);
      canvas.width = this.uploadedImage.width * scale;
      canvas.height = this.uploadedImage.height * scale;
      ctx.drawImage(this.uploadedImage, 0, 0, canvas.width, canvas.height);
      if (removeBg) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          if (avg > threshold) data[i + 3] = 0;
        }
        ctx.putImageData(imageData, 0, 0);
      }
    }
    handleSave() {
      let sourceCanvas;
      if (this.activeTab === "draw") {
        sourceCanvas = this.drawCanvas;
      } else {
        sourceCanvas = this.modal.querySelector("#preview-canvas");
      }
      const trimmedCanvas = this.trimCanvas(sourceCanvas);
      const finalDataUrl = trimmedCanvas.toDataURL("image/png");
      const aspectRatio = trimmedCanvas.width / trimmedCanvas.height;
      this.onSave(finalDataUrl, aspectRatio);
      this.close();
    }
    trimCanvas(c) {
      const ctx = c.getContext("2d");
      const width = c.width;
      const height = c.height;
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      let top = null, bottom = null, left = null, right = null;
      let x, y;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] !== 0) {
          x = i / 4 % width;
          y = Math.floor(i / 4 / width);
          if (top === null) top = y;
          if (bottom === null) bottom = y;
          if (left === null) left = x;
          if (right === null) right = x;
          if (y < top) top = y;
          if (y > bottom) bottom = y;
          if (x < left) left = x;
          if (x > right) right = x;
        }
      }
      if (top === null) {
        const empty = document.createElement("canvas");
        empty.width = 1;
        empty.height = 1;
        return empty;
      }
      const padding = 10;
      const trimTop = Math.max(0, top - padding);
      const trimLeft = Math.max(0, left - padding);
      const trimBottom = Math.min(height, bottom + padding);
      const trimRight = Math.min(width, right + padding);
      const trimWidth = trimRight - trimLeft;
      const trimHeight = trimBottom - trimTop;
      const trimmed = document.createElement("canvas");
      trimmed.width = trimWidth;
      trimmed.height = trimHeight;
      trimmed.getContext("2d").drawImage(
        c,
        trimLeft,
        trimTop,
        trimWidth,
        trimHeight,
        // Source rect
        0,
        0,
        trimWidth,
        trimHeight
        // Dest rect
      );
      return trimmed;
    }
  };
})();
