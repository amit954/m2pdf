(() => {
  // src/js/config.js
  var config = {
    pdfjs: {
      workerSrc: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js",
      renderingQueue: {
        // Increase for smoother scrolling but more memory usage
        viewsPerQueue: 10,
        // Time before removing cached pages
        cacheExpirationTime: 3e4
      },
      webGLOptions: {
        // Enable WebGL if available
        enableWebGL: true,
        // Texture size for WebGL rendering
        maxTextureSize: 8192,
        // Whether to use WebGL for image rendering
        imageRendering: true
      }
    },
    zoom: {
      min: 0.1,
      max: 10,
      default: 1,
      // Delay between zoom renders
      renderDelay: 50,
      // Number of zoom steps to animate
      smoothSteps: 5
    },
    rendering: {
      // Enable progressive rendering
      progressive: true,
      // Enable page preloading
      preload: true,
      // Number of pages to preload
      preloadPages: 2,
      // Viewport margin for early rendering
      viewportMargin: 2
    }
  };
  var config_default = config;

  // src/js/performance-utils.js
  var PerformanceManager = class {
    /**
     * @param {Object} pdfDocument - The loaded PDF document object
     * @param {Object} pdfjsLib - The PDF.js library instance
     * @param {Function} renderCallback - Function to call when a page needs rendering (pageNum) => void
     */
    constructor(pdfDocument, pdfjsLib2, renderCallback) {
      this.pdfDocument = pdfDocument;
      this.pdfjsLib = pdfjsLib2;
      this.renderCallback = renderCallback;
      this.visiblePages = /* @__PURE__ */ new Set();
      this.renderQueue = [];
      this.isRendering = false;
      this.renderedPages = /* @__PURE__ */ new Set();
      this.canvasPool = [];
      this.maxCanvasPoolSize = 20;
      this.observer = null;
      this.setupIntersectionObserver();
    }
    setupIntersectionObserver() {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const pageNum = parseInt(entry.target.getAttribute("data-page"));
          if (entry.isIntersecting) {
            this.visiblePages.add(pageNum);
            this.queuePageRender(pageNum);
          } else {
            this.visiblePages.delete(pageNum);
          }
        });
      }, {
        root: document.getElementById("pdf-container"),
        rootMargin: "200px 0px",
        // Pre-render slightly ahead of scroll
        threshold: 0.1
      });
    }
    observePages() {
      const containers = document.querySelectorAll(".page-container");
      containers.forEach((container) => {
        this.observer.observe(container);
      });
    }
    async queuePageRender(pageNum) {
      if (!this.renderQueue.includes(pageNum)) {
        this.renderQueue.push(pageNum);
        if (!this.isRendering) {
          this.processRenderQueue();
        }
      }
    }
    async processRenderQueue() {
      if (this.renderQueue.length === 0) {
        this.isRendering = false;
        return;
      }
      this.isRendering = true;
      const pageNum = this.renderQueue.shift();
      if (this.visiblePages.has(pageNum)) {
        if (this.renderCallback) {
          try {
            await this.renderCallback(pageNum);
            this.renderedPages.add(pageNum);
          } catch (e) {
            console.error(`Error rendering page ${pageNum}:`, e);
          }
        }
      }
      requestAnimationFrame(() => this.processRenderQueue());
    }
    resetRenderStatus() {
      this.renderedPages.clear();
      this.renderQueue = [];
    }
    // --- RESTORED: Canvas Pooling Methods ---
    /**
     * Gets a canvas from the pool or creates a new one
     */
    getCanvas() {
      if (this.canvasPool.length > 0) {
        return this.canvasPool.pop();
      }
      return document.createElement("canvas");
    }
    /**
     * Puts a canvas back into the pool for reuse
     */
    recycleCanvas(canvas) {
      if (!canvas) return;
      if (this.canvasPool.length < this.maxCanvasPoolSize) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.canvasPool.push(canvas);
      } else {
        canvas.width = 1;
        canvas.height = 1;
        canvas.remove();
      }
    }
    /**
     * Helper to apply common optimization settings to context
     */
    optimizeCanvasRendering(canvas) {
      const ctx = canvas.getContext("2d", {
        alpha: true,
        // Opaque background is faster
        desynchronized: true
        // Low latency
      });
      canvas.style.transform = "translateZ(0)";
      canvas.style.backfaceVisibility = "hidden";
      return ctx;
    }
    cleanupResources() {
      if (this.observer) {
        this.observer.disconnect();
      }
      this.visiblePages.clear();
      this.renderedPages.clear();
      this.renderQueue = [];
      this.canvasPool = [];
    }
  };

  // src/js/utils/zoom.js
  var ZoomManager = class {
    constructor(scale = 1) {
      this.scale = scale;
      this.minScale = config_default.zoom.min;
      this.maxScale = config_default.zoom.max;
      this.baseWidth = 0;
    }
    updateDisplay(scale) {
      document.getElementById("zoom-level").textContent = `${Math.round(scale * 100)}%`;
    }
    // NEW: Call this once after rendering pages
    setBaseDimensions(width) {
      this.baseWidth = width;
    }
    applyTemporaryZoom(newScale, oldScale, origin = null) {
      const container = document.querySelector(".pdf-container");
      const wrapper = document.querySelector(".pages-wrapper");
      if (!this.baseWidth) {
        const prevTransform = wrapper.style.transform;
        wrapper.style.transform = "none";
        this.baseWidth = wrapper.offsetWidth;
        wrapper.style.transform = prevTransform;
      }
      const containerWidth = container.clientWidth;
      const scaledWidth = this.baseWidth * newScale;
      let translateX = 0;
      let newScrollLeft = container.scrollLeft;
      let newScrollTop = container.scrollTop;
      if (scaledWidth < containerWidth) {
        translateX = (containerWidth - scaledWidth) / 2;
        newScrollLeft = 0;
        if (origin) {
          const ratio = newScale / oldScale;
          newScrollTop = (container.scrollTop + origin.y) * ratio - origin.y;
        }
      } else {
        translateX = 0;
        if (!origin) {
          const rect = container.getBoundingClientRect();
          origin = { x: rect.width / 2, y: rect.height / 2 };
        }
        const ratio = newScale / oldScale;
        newScrollLeft = (container.scrollLeft + origin.x) * ratio - origin.x;
        newScrollTop = (container.scrollTop + origin.y) * ratio - origin.y;
      }
      wrapper.style.transform = `translate(${translateX}px, 0px) scale(${newScale})`;
      container.scrollLeft = newScrollLeft;
      container.scrollTop = newScrollTop;
    }
    calculateNewScale(factor, absoluteScale = null) {
      let newScale = absoluteScale !== null ? absoluteScale : this.scale * factor;
      newScale = Math.round(newScale * 100) / 100;
      return Math.min(Math.max(newScale, this.minScale), this.maxScale);
    }
  };

  // src/js/utils/ui.js
  var UIManager = class {
    static showMessage(text, type) {
      const message = document.getElementById("message");
      message.textContent = text;
      message.className = `alert alert-${type === "error" ? "danger" : "success"}`;
      message.style.display = "block";
      setTimeout(() => message.style.display = "none", 3e3);
    }
  };

  // src/js/features/modifications.js
  var ModificationManager = class {
    constructor() {
      this.modifications = /* @__PURE__ */ new Map();
      this.currentTool = null;
    }
    addModification(pageNum, modification) {
      if (!this.modifications.has(pageNum)) {
        this.modifications.set(pageNum, []);
      }
      this.modifications.get(pageNum).push(modification);
    }
    // UPDATED: Now mostly handles cleanup, text is no longer drawn here
    renderModifications(pageNum, canvas, scale) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    toggleTool(tool) {
      const btn = document.getElementById(`${tool}-btn`);
      document.querySelectorAll(".icon-btn").forEach((b) => b.classList.remove("active"));
      if (this.currentTool === tool) {
        this.currentTool = null;
      } else {
        this.currentTool = tool;
        if (btn) btn.classList.add("active");
      }
    }
    resetTool() {
      this.currentTool = null;
      document.querySelectorAll(".icon-btn").forEach((b) => b.classList.remove("active"));
    }
  };

  // src/js/features/images.js
  var ImageAnnotationManager = class {
    constructor() {
      this.imageAnnotations = /* @__PURE__ */ new Map();
    }
    /**
     * Creates or re-renders an image annotation on the DOM.
     * UPDATED: Now accepts modManager to handle deletion properly.
     */
    createImageAnnotation(container, modification, pageNum, scale, modManager) {
      const existingAnnotation = container.querySelector(`[data-id="${modification.id}"]`);
      if (existingAnnotation) {
        existingAnnotation.remove();
      }
      const imgContainer = document.createElement("div");
      imgContainer.className = "image-annotation";
      imgContainer.setAttribute("data-id", modification.id);
      imgContainer.style.left = `${modification.x}px`;
      imgContainer.style.top = `${modification.y}px`;
      imgContainer.style.width = `${modification.width}px`;
      imgContainer.style.height = `${modification.height}px`;
      this.setupImageElements(imgContainer, modification, modManager, pageNum);
      this.setupImageInteractions(imgContainer, modification, pageNum, scale);
      container.appendChild(imgContainer);
    }
    setupImageElements(imgContainer, modification, modManager, pageNum) {
      const img = document.createElement("img");
      img.src = modification.data;
      img.style.width = "100%";
      img.style.height = "100%";
      modification.noBackground = modification.noBackground || false;
      modification.threshold = modification.threshold || 240;
      if (modification.noBackground) {
        img.classList.add("transparent-bg");
        imgContainer.classList.add("show-threshold");
        this.removeBackground(img, modification);
      }
      imgContainer.appendChild(img);
      const sliderContainer = document.createElement("div");
      sliderContainer.className = "threshold-slider-container";
      const slider = document.createElement("input");
      slider.type = "range";
      slider.className = "threshold-slider";
      slider.min = "0";
      slider.max = "255";
      slider.value = modification.threshold;
      slider.style.display = modification.noBackground ? "block" : "none";
      let sliderTimeout;
      slider.addEventListener("mousedown", (e) => e.stopPropagation());
      slider.oninput = (e) => {
        e.stopPropagation();
        modification.threshold = parseInt(e.target.value);
        if (sliderTimeout) clearTimeout(sliderTimeout);
        sliderTimeout = setTimeout(() => {
          this.removeBackground(img, modification);
        }, 50);
      };
      sliderContainer.appendChild(slider);
      imgContainer.appendChild(sliderContainer);
      const handle = document.createElement("div");
      handle.className = "resize-handle";
      imgContainer.appendChild(handle);
      const bgToggleBtn = document.createElement("button");
      bgToggleBtn.className = "bg-toggle-btn" + (modification.noBackground ? " active" : "");
      bgToggleBtn.textContent = "B";
      bgToggleBtn.title = "Toggle Background";
      bgToggleBtn.onclick = async (e) => {
        e.stopPropagation();
        modification.noBackground = !modification.noBackground;
        if (modification.noBackground) {
          bgToggleBtn.classList.add("active");
          imgContainer.classList.add("show-threshold");
          slider.style.display = "block";
          await this.removeBackground(img, modification);
        } else {
          bgToggleBtn.classList.remove("active");
          imgContainer.classList.remove("show-threshold");
          slider.style.display = "none";
          img.src = modification.originalData || modification.data;
          img.classList.remove("transparent-bg");
        }
      };
      imgContainer.appendChild(bgToggleBtn);
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-btn";
      deleteBtn.textContent = "\xD7";
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        if (modManager) {
          const mods = modManager.modifications.get(pageNum);
          if (mods) {
            const idx = mods.findIndex((m) => m.id === modification.id);
            if (idx > -1) {
              mods.splice(idx, 1);
            }
          }
        }
        imgContainer.remove();
      };
      imgContainer.appendChild(deleteBtn);
    }
    async removeBackground(img, modification) {
      if (!modification.originalData) {
        modification.originalData = modification.data;
      }
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      await new Promise((resolve) => {
        const tempImg = new Image();
        tempImg.onload = () => {
          canvas.width = tempImg.width;
          canvas.height = tempImg.height;
          ctx.drawImage(tempImg, 0, 0);
          resolve();
        };
        tempImg.src = modification.originalData;
      });
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r + g + b) / 3;
        if (brightness > modification.threshold) {
          data[i + 3] = 0;
        }
      }
      ctx.putImageData(imageData, 0, 0);
      const processedImageData = canvas.toDataURL("image/png");
      img.src = processedImageData;
      modification.data = processedImageData;
      img.classList.add("transparent-bg");
    }
    setupImageInteractions(imgContainer, modification, pageNum, scale) {
      this.setupDragHandling(imgContainer, modification, scale);
      this.setupResizeHandling(imgContainer, modification, scale);
    }
    setupDragHandling(imgContainer, modification, scale) {
      let isDragging = false;
      let startX, startY;
      let initialLeft, initialTop;
      imgContainer.addEventListener("mousedown", (e) => {
        if (e.target.classList.contains("resize-handle") || e.target.classList.contains("delete-btn") || e.target.classList.contains("bg-toggle-btn") || e.target.closest(".threshold-slider-container")) return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialLeft = parseFloat(imgContainer.style.left) || 0;
        initialTop = parseFloat(imgContainer.style.top) || 0;
        imgContainer.style.cursor = "move";
        e.preventDefault();
      });
      document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        const dx = (e.clientX - startX) / scale;
        const dy = (e.clientY - startY) / scale;
        const newX = initialLeft + dx;
        const newY = initialTop + dy;
        modification.x = newX;
        modification.y = newY;
        imgContainer.style.left = `${newX}px`;
        imgContainer.style.top = `${newY}px`;
      });
      document.addEventListener("mouseup", () => {
        if (!isDragging) return;
        isDragging = false;
        imgContainer.style.cursor = "default";
      });
    }
    setupResizeHandling(imgContainer, modification, scale) {
      const handle = imgContainer.querySelector(".resize-handle");
      handle.onmousedown = (e) => {
        e.stopPropagation();
        e.preventDefault();
        const startWidth = parseFloat(imgContainer.style.width);
        const startHeight = parseFloat(imgContainer.style.height);
        const aspectRatio = modification.aspectRatio;
        const startX = e.clientX;
        const startY = e.clientY;
        const onMouseMove = (e2) => {
          const dx = (e2.clientX - startX) / scale;
          const dy = (e2.clientY - startY) / scale;
          let newWidth, newHeight;
          if (Math.abs(dx) > Math.abs(dy)) {
            newWidth = startWidth + dx;
            newHeight = newWidth / aspectRatio;
          } else {
            newHeight = startHeight + dy;
            newWidth = newHeight * aspectRatio;
          }
          const minSize = 20;
          if (newWidth > minSize && newHeight > minSize) {
            modification.width = newWidth;
            modification.height = newHeight;
            imgContainer.style.width = `${newWidth}px`;
            imgContainer.style.height = `${newHeight}px`;
          }
        };
        const onMouseUp = () => {
          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseup", onMouseUp);
        };
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      };
    }
  };

  // src/js/features/drawing.js
  var DrawingManager = class {
    constructor() {
      this.isDrawing = false;
      this.currentPath = [];
      this.paths = /* @__PURE__ */ new Map();
    }
    startDrawing(x, y, pageNum) {
      this.isDrawing = true;
      this.currentPath = [{ x, y }];
    }
    addPoint(x, y) {
      if (!this.isDrawing) return;
      const lastPoint = this.currentPath[this.currentPath.length - 1];
      const dx = x - lastPoint.x;
      const dy = y - lastPoint.y;
      if (dx * dx + dy * dy > 4) {
        this.currentPath.push({ x, y });
        return true;
      }
      return false;
    }
    stopDrawing(pageNum) {
      if (!this.isDrawing) return;
      this.isDrawing = false;
      if (this.currentPath.length > 1) {
        if (!this.paths.has(pageNum)) {
          this.paths.set(pageNum, []);
        }
        this.paths.get(pageNum).push([...this.currentPath]);
      }
      this.currentPath = [];
    }
    // --- NEW METHOD: Draws only the latest segment ---
    drawActivePath(canvas, scale) {
      if (this.currentPath.length < 2) return;
      const ctx = canvas.getContext("2d");
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const transform = (val) => val * scale * pixelRatio;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#000080";
      ctx.lineWidth = 2 * scale * pixelRatio;
      const p0 = this.currentPath[this.currentPath.length - 2];
      const p1 = this.currentPath[this.currentPath.length - 1];
      ctx.beginPath();
      ctx.moveTo(transform(p0.x), transform(p0.y));
      ctx.lineTo(transform(p1.x), transform(p1.y));
      ctx.stroke();
    }
    renderDrawings(pageNum, canvas, scale) {
      const ctx = canvas.getContext("2d");
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#000080";
      ctx.lineWidth = 2 * scale * pixelRatio;
      const paths = this.paths.get(pageNum) || [];
      paths.forEach((path) => {
        this.drawPath(ctx, path, scale, pixelRatio);
      });
      if (this.isDrawing && this.currentPath.length > 0) {
        this.drawPath(ctx, this.currentPath, scale, pixelRatio);
      }
    }
    drawPath(ctx, path, scale, pixelRatio) {
      if (path.length < 2) return;
      const transform = (val) => val * scale * pixelRatio;
      ctx.beginPath();
      ctx.moveTo(transform(path[0].x), transform(path[0].y));
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(transform(path[i].x), transform(path[i].y));
      }
      ctx.stroke();
    }
  };

  // src/js/features/text.js
  var TextAnnotationManager = class {
    constructor() {
    }
    createTextAnnotation(container, modification, pageNum, scale, modManager) {
      const existing = container.querySelector(`[data-id="${modification.id}"]`);
      if (existing) existing.remove();
      const textContainer = document.createElement("div");
      textContainer.className = "text-annotation";
      textContainer.setAttribute("data-id", modification.id);
      const fontSize = (modification.fontSize || 16) * scale;
      textContainer.style.left = `${modification.x}px`;
      textContainer.style.top = `${modification.y}px`;
      textContainer.style.fontSize = `${fontSize}px`;
      textContainer.style.lineHeight = "1.2";
      const content = document.createElement("div");
      content.className = "text-content";
      content.innerText = modification.text;
      content.style.whiteSpace = "pre";
      textContainer.appendChild(content);
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-btn";
      deleteBtn.innerHTML = '<i class="bi bi-x"></i>';
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        const mods = modManager.modifications.get(pageNum);
        const idx = mods.findIndex((m) => m.id === modification.id);
        if (idx > -1) mods.splice(idx, 1);
        textContainer.remove();
      };
      textContainer.appendChild(deleteBtn);
      const resizeHandle = document.createElement("div");
      resizeHandle.className = "resize-handle";
      textContainer.appendChild(resizeHandle);
      container.appendChild(textContainer);
      this.setupInteractions(textContainer, content, modification, scale);
    }
    setupInteractions(container, content, modification, scale) {
      container.onmousedown = (e) => {
        if (e.target.classList.contains("resize-handle") || e.target.classList.contains("delete-btn") || content.isContentEditable) return;
        e.preventDefault();
        const startX = e.clientX;
        const startY = e.clientY;
        const startLeft = parseFloat(container.style.left);
        const startTop = parseFloat(container.style.top);
        const onMove = (e2) => {
          const dx = (e2.clientX - startX) / scale;
          const dy = (e2.clientY - startY) / scale;
          const newX = startLeft + (e2.clientX - startX);
          const newY = startTop + (e2.clientY - startY);
          container.style.left = `${newX}px`;
          container.style.top = `${newY}px`;
          modification.x = newX;
          modification.y = newY;
        };
        const onUp = () => {
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
        };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
      };
      const handle = container.querySelector(".resize-handle");
      handle.onmousedown = (e) => {
        e.stopPropagation();
        e.preventDefault();
        const startY = e.clientY;
        const startFontSize = modification.fontSize || 16;
        const onMove = (e2) => {
          const dy = e2.clientY - startY;
          const scaleFactor = 1 + dy / 200;
          let newFs = Math.max(8, startFontSize * scaleFactor);
          newFs = Math.min(100, newFs);
          modification.fontSize = newFs;
          container.style.fontSize = `${newFs * scale}px`;
        };
        const onUp = () => {
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
        };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
      };
      container.ondblclick = (e) => {
        e.stopPropagation();
        content.contentEditable = true;
        content.focus();
        container.classList.add("editing");
        const range = document.createRange();
        range.selectNodeContents(content);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        const finishEdit = () => {
          content.contentEditable = false;
          container.classList.remove("editing");
          modification.text = content.innerText;
          window.getSelection().removeAllRanges();
        };
        content.onblur = finishEdit;
        content.onkeydown = (e2) => {
          if (e2.key === "Enter" && !e2.shiftKey) {
            e2.preventDefault();
            content.blur();
          }
        };
      };
    }
  };

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

  // src/js/main.js
  pdfjsLib.GlobalWorkerOptions.workerSrc = config_default.pdfjs.workerSrc;
  var PDFEditor = class {
    constructor() {
      this.pdfDoc = null;
      this.pdfBytes = null;
      this.fileName = "document.pdf";
      this.pageCanvases = /* @__PURE__ */ new Map();
      this.renderTasks = /* @__PURE__ */ new Map();
      this.pendingRenderTimeout = null;
      this.zoomManager = new ZoomManager();
      this.modManager = new ModificationManager();
      this.imageManager = new ImageAnnotationManager();
      this.drawingManager = new DrawingManager();
      this.textManager = new TextAnnotationManager();
      this.performanceManager = new PerformanceManager(
        this.pdfDoc,
        pdfjsLib,
        (pageNum) => {
          const container = document.querySelector(`.page-container[data-page="${pageNum}"]`);
          if (container) {
            this.renderPageAtScale(pageNum, container);
          }
        }
      );
      this.signatureModal = new SignatureModal((dataUrl, aspectRatio) => {
        this.activateSignaturePlacement(dataUrl, aspectRatio);
      });
      this.setupListeners();
    }
    setupListeners() {
      this.setupFileHandling();
      this.setupToolbar();
      this.setupZoomControls();
    }
    setupFileHandling() {
      document.getElementById("upload-btn").onclick = () => document.getElementById("file-input").click();
      document.getElementById("file-input").onchange = (e) => this.handleFileUpload(e);
    }
    setupToolbar() {
      document.getElementById("text-btn").onclick = () => this.modManager.toggleTool("text");
      document.getElementById("image-btn").onclick = () => this.modManager.toggleTool("image");
      document.getElementById("draw-btn").onclick = () => {
        this.modManager.resetTool();
        this.signatureModal.open();
      };
      document.getElementById("save-btn").onclick = () => this.savePDF();
    }
    setupZoomControls() {
      document.getElementById("zoom-in").onclick = () => this.smoothZoom(1.1);
      document.getElementById("zoom-out").onclick = () => this.smoothZoom(0.9);
      this.setupWheelZoom();
      this.setupPinchZoom();
      this.setupKeyboardZoom();
    }
    setupWheelZoom() {
      const container = document.getElementById("pdf-container");
      container.addEventListener("wheel", (e) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          const rect = container.getBoundingClientRect();
          const origin = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
          };
          const delta = e.deltaY || e.detail || e.wheelDelta;
          const factor = delta > 0 ? 0.9 : 1.1;
          this.smoothZoom(factor, origin);
        }
      }, { passive: false });
    }
    setupPinchZoom() {
      const container = document.getElementById("pdf-container");
      const hammer = new Hammer(container);
      hammer.get("pinch").set({ enable: true });
      let startScale = 1;
      hammer.on("pinchstart", () => {
        startScale = this.zoomManager.scale;
        this.zoomManager.isZooming = true;
      });
      hammer.on("pinch", (e) => {
        const newScale = startScale * e.scale;
        this.zoomManager.updateDisplay(newScale);
        this.zoomManager.applyTemporaryZoom(newScale, startScale, null);
      });
      hammer.on("pinchend", () => {
        this.zoomManager.isZooming = false;
        this.smoothZoom(1, null, this.zoomManager.scale);
      });
    }
    setupKeyboardZoom() {
      document.addEventListener("keydown", (e) => {
        if (e.ctrlKey || e.metaKey) {
          if (e.key === "=" || e.key === "+") {
            e.preventDefault();
            this.smoothZoom(1.1);
          } else if (e.key === "-") {
            e.preventDefault();
            this.smoothZoom(0.9);
          } else if (e.key === "0") {
            e.preventDefault();
            this.smoothZoom(1, null, 1);
          }
        }
      });
    }
    async handleFileUpload(e) {
      const file = e.target.files[0];
      if (!file) return;
      this.fileName = file.name;
      this.cleanup();
      const arrayBuffer = await file.arrayBuffer();
      this.pdfBytes = new Uint8Array(arrayBuffer);
      this.modManager.modifications.clear();
      this.imageManager.imageAnnotations.clear();
      this.drawingManager.paths.clear();
      this.zoomManager.scale = 1;
      this.zoomManager.updateDisplay(1);
      await this.loadPDF();
      this.smoothZoom(1, null, 1);
      document.getElementById("save-btn").disabled = false;
      UIManager.showMessage("PDF loaded successfully", "success");
    }
    async loadPDF() {
      const loadingTask = pdfjsLib.getDocument({
        data: this.pdfBytes,
        useSystemFonts: true
      });
      this.pdfDoc = await loadingTask.promise;
      const container = document.getElementById("pdf-container");
      container.innerHTML = "";
      const wrapper = document.createElement("div");
      wrapper.className = "pages-wrapper";
      wrapper.style.transformOrigin = "0 0";
      container.appendChild(wrapper);
      const firstPage = await this.pdfDoc.getPage(1);
      const baseViewport = firstPage.getViewport({ scale: 1 });
      const defaultWidth = baseViewport.width;
      const defaultHeight = baseViewport.height;
      for (let i = 1; i <= this.pdfDoc.numPages; i++) {
        const pageContainer = document.createElement("div");
        pageContainer.className = "page-container";
        pageContainer.setAttribute("data-page", i);
        pageContainer.style.width = `${defaultWidth}px`;
        pageContainer.style.height = `${defaultHeight}px`;
        pageContainer.classList.add("pending-render");
        wrapper.appendChild(pageContainer);
        this.setupPageInteractions(pageContainer, i);
      }
      this.zoomManager.setBaseDimensions(wrapper.offsetWidth);
      this.performanceManager.observePages();
      this.zoomManager.applyTemporaryZoom(
        this.zoomManager.scale,
        this.zoomManager.scale,
        null
      );
      wrapper.classList.add("loaded");
      this.renderPagesAtCurrentScale();
    }
    async renderPagesAtCurrentScale() {
      if (this.zoomManager.isZooming) return;
      if (this.pendingRenderTimeout) {
        clearTimeout(this.pendingRenderTimeout);
      }
      for (const [pageNum, task] of this.renderTasks) {
        task.cancel();
      }
      this.renderTasks.clear();
      const visiblePages = this.getVisiblePageNumbers();
      const containers = document.querySelectorAll(".page-container");
      for (const container of containers) {
        const pageNum = parseInt(container.getAttribute("data-page"));
        this.updatePageDimensions(container, pageNum);
        if (visiblePages.includes(pageNum)) {
          await this.renderPageAtScale(pageNum, container);
        } else {
          container.classList.add("pending-render");
        }
      }
    }
    updatePageDimensions(container, pageNum) {
      const scale = this.zoomManager.scale;
      const canvas = container.querySelector("canvas:not(.canvas-layer)");
      if (canvas) {
      } else {
      }
    }
    async renderPageAtScale(pageNum, container) {
      try {
        const existingTask = this.renderTasks.get(pageNum);
        if (existingTask) {
          existingTask.cancel();
          this.renderTasks.delete(pageNum);
        }
        const page = await this.pdfDoc.getPage(pageNum);
        const baseViewport = page.getViewport({ scale: 1 });
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        const scale = this.zoomManager.scale;
        const displayWidth = baseViewport.width;
        const displayHeight = baseViewport.height;
        container.style.width = `${displayWidth}px`;
        container.style.height = `${displayHeight}px`;
        const oldCanvas = container.querySelector("canvas:not(.canvas-layer)");
        if (oldCanvas) {
          this.performanceManager.recycleCanvas(oldCanvas);
          oldCanvas.remove();
        }
        const newCanvas = this.performanceManager.getCanvas();
        newCanvas.width = Math.floor(displayWidth * pixelRatio * scale);
        newCanvas.height = Math.floor(displayHeight * pixelRatio * scale);
        newCanvas.style.width = `${displayWidth}px`;
        newCanvas.style.height = `${displayHeight}px`;
        newCanvas.style.display = "block";
        const ctx = this.performanceManager.optimizeCanvasRendering(newCanvas);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(pixelRatio * scale, pixelRatio * scale);
        const renderContext = {
          canvasContext: ctx,
          viewport: page.getViewport({ scale: 1 })
        };
        container.style.transform = "none";
        const renderTask = page.render(renderContext);
        this.renderTasks.set(pageNum, renderTask);
        await renderTask.promise;
        this.renderTasks.delete(pageNum);
        container.insertBefore(newCanvas, container.firstChild);
        this.setupAnnotationLayer(container, newCanvas);
        this.renderAnnotations(pageNum, container);
      } catch (error) {
        if (error.name !== "RenderingCancelledException") {
          console.error(`Error rendering page ${pageNum}:`, error);
        }
        this.renderTasks.delete(pageNum);
      }
    }
    getVisiblePageNumbers() {
      const visiblePages = [];
      const container = document.getElementById("pdf-container");
      const containerRect = container.getBoundingClientRect();
      const buffer = 100;
      document.querySelectorAll(".page-container").forEach((page) => {
        const pageRect = page.getBoundingClientRect();
        const pageNum = parseInt(page.getAttribute("data-page"));
        if (pageRect.bottom > containerRect.top - buffer && pageRect.top < containerRect.bottom + buffer) {
          visiblePages.push(pageNum);
        }
      });
      return visiblePages;
    }
    setupAnnotationLayer(container, mainCanvas) {
      let annotationCanvas = container.querySelector(".canvas-layer");
      if (!annotationCanvas) {
        annotationCanvas = document.createElement("canvas");
        annotationCanvas.className = "canvas-layer";
        container.appendChild(annotationCanvas);
      }
      annotationCanvas.width = mainCanvas.width;
      annotationCanvas.height = mainCanvas.height;
      annotationCanvas.style.width = mainCanvas.style.width;
      annotationCanvas.style.height = mainCanvas.style.height;
    }
    renderAnnotations(pageNum, container) {
      const annotationCanvas = container.querySelector(".canvas-layer");
      this.modManager.renderModifications(pageNum, annotationCanvas, this.zoomManager.scale);
      this.drawingManager.renderDrawings(pageNum, annotationCanvas, this.zoomManager.scale);
      const mods = this.modManager.modifications.get(pageNum) || [];
      mods.forEach((mod) => {
        if (mod.type === "image") {
          this.imageManager.createImageAnnotation(
            container,
            mod,
            pageNum,
            this.zoomManager.scale,
            this.modManager
          );
        } else if (mod.type === "text") {
          this.textManager.createTextAnnotation(
            container,
            mod,
            pageNum,
            this.zoomManager.scale,
            this.modManager
          );
        }
      });
    }
    // NEW: Handle Signature Placement
    activateSignaturePlacement(dataUrl, aspectRatio) {
      UIManager.showMessage("Click anywhere on the document to place signature", "success");
      document.body.style.cursor = "crosshair";
      const placeHandler = (e) => {
        const container = e.target.closest(".page-container");
        if (!container) return;
        e.preventDefault();
        e.stopPropagation();
        const pageNum = parseInt(container.getAttribute("data-page"));
        const rect = container.getBoundingClientRect();
        const scale = this.zoomManager.scale;
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        const scaledWidth = 150;
        const scaledHeight = scaledWidth / aspectRatio;
        const visualLeft = clickX - scaledWidth / 2;
        const visualTop = clickY - scaledHeight / 2;
        const modification = {
          type: "image",
          id: Date.now().toString(),
          x: visualLeft / scale,
          y: visualTop / scale,
          width: scaledWidth / scale,
          height: scaledHeight / scale,
          data: dataUrl,
          aspectRatio,
          noBackground: false
          // Already processed in modal if needed
        };
        this.modManager.addModification(pageNum, modification);
        this.imageManager.createImageAnnotation(
          container,
          modification,
          pageNum,
          scale,
          this.modManager
        );
        document.body.style.cursor = "default";
      };
      setTimeout(() => {
        document.addEventListener("click", placeHandler, { once: true });
      }, 100);
    }
    smoothZoom(factor, origin = null, absoluteScale = null) {
      const oldScale = this.zoomManager.scale;
      const newScale = this.zoomManager.calculateNewScale(factor, absoluteScale);
      if (newScale === oldScale) return;
      this.zoomManager.scale = newScale;
      this.zoomManager.updateDisplay(newScale);
      this.zoomManager.applyTemporaryZoom(newScale, oldScale, origin);
      if (this.pendingRenderTimeout) {
        clearTimeout(this.pendingRenderTimeout);
      }
      this.pendingRenderTimeout = setTimeout(() => {
        this.renderPagesAtCurrentScale();
      }, 400);
    }
    cleanup() {
      for (const [pageNum, task] of this.renderTasks) {
        task.cancel();
      }
      this.renderTasks.clear();
      if (this.pendingRenderTimeout) {
        clearTimeout(this.pendingRenderTimeout);
      }
    }
    setupPageInteractions(container, pageNum) {
      container.onmousedown = (e) => this.handlePointerDown(e, container, pageNum);
      container.ontouchstart = (e) => this.handlePointerDown(e, container, pageNum);
      container.onclick = async (e) => {
        if (this.isDragging || !this.modManager.currentTool || e.target.classList.contains("image-annotation") || e.target.classList.contains("text-annotation") || e.target.closest(".text-annotation") || e.target.closest(".image-annotation")) return;
        if (["text", "image"].includes(this.modManager.currentTool)) {
          const rect = container.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          if (this.modManager.currentTool === "text") {
            await this.handleTextAdd(x, y, pageNum);
          } else if (this.modManager.currentTool === "image") {
            await this.handleImageAdd(x, y, pageNum);
          }
        }
      };
    }
    handlePointerDown(e, container, pageNum) {
      if (this.modManager.currentTool !== "draw") return;
      if (e.type === "touchstart") e.preventDefault();
      const rect = container.getBoundingClientRect();
      const scale = this.zoomManager.scale;
      const getPoint = (evt) => {
        const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
        const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
        return {
          x: (clientX - rect.left) / scale,
          y: (clientY - rect.top) / scale
        };
      };
      const startPoint = getPoint(e);
      this.drawingManager.startDrawing(startPoint.x, startPoint.y, pageNum);
      this.isDragging = true;
      const onMove = (moveEvent) => {
        moveEvent.preventDefault();
        const p = getPoint(moveEvent);
        const pointAdded = this.drawingManager.addPoint(p.x, p.y);
        if (pointAdded) {
          const canvas = container.querySelector(".canvas-layer");
          this.drawingManager.drawActivePath(canvas, scale);
        }
      };
      const onUp = () => {
        this.drawingManager.stopDrawing(pageNum);
        this.isDragging = false;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.removeEventListener("touchmove", onMove);
        document.removeEventListener("touchend", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
      document.addEventListener("touchmove", onMove, { passive: false });
      document.addEventListener("touchend", onUp);
    }
    async handleTextAdd(x, y, pageNum) {
      const modification = {
        type: "text",
        id: Date.now().toString(),
        x: x / this.zoomManager.scale,
        y: y / this.zoomManager.scale,
        text: "Double click to edit",
        fontSize: 16
      };
      this.modManager.addModification(pageNum, modification);
      const container = document.querySelector(`[data-page="${pageNum}"]`);
      this.textManager.createTextAnnotation(
        container,
        modification,
        pageNum,
        this.zoomManager.scale,
        this.modManager
      );
      this.modManager.resetTool();
    }
    async handleImageAdd(x, y, pageNum) {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e2) => {
            const img = new Image();
            img.onload = () => {
              const maxSize = 200;
              let width = img.naturalWidth;
              let height = img.naturalHeight;
              if (width > maxSize || height > maxSize) {
                if (width > height) {
                  height = height / width * maxSize;
                  width = maxSize;
                } else {
                  width = width / height * maxSize;
                  height = maxSize;
                }
              }
              const scaledWidth = width / this.zoomManager.scale;
              const scaledHeight = height / this.zoomManager.scale;
              const mouseX = x / this.zoomManager.scale;
              const mouseY = y / this.zoomManager.scale;
              const visualTopLeftX = mouseX - scaledWidth;
              const visualTopLeftY = mouseY - scaledHeight;
              const modification = {
                type: "image",
                x: visualTopLeftX,
                y: visualTopLeftY,
                data: e2.target.result,
                width: scaledWidth,
                height: scaledHeight,
                aspectRatio: width / height,
                id: Date.now().toString()
              };
              this.modManager.addModification(pageNum, modification);
              const container = document.querySelector(`[data-page="${pageNum}"]`);
              this.imageManager.createImageAnnotation(
                container,
                modification,
                pageNum,
                this.zoomManager.scale,
                this.modManager
              );
              this.modManager.resetTool();
            };
            img.src = e2.target.result;
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    }
    async optimizeImage(dataUrl, targetWidth, targetHeight) {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          if (img.width <= targetWidth && img.height <= targetHeight) {
            resolve(dataUrl);
            return;
          }
          const canvas = document.createElement("canvas");
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext("2d");
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          if (dataUrl.startsWith("data:image/png")) {
            resolve(canvas.toDataURL("image/png"));
          } else {
            resolve(canvas.toDataURL("image/jpeg", 0.8));
          }
        };
        img.src = dataUrl;
      });
    }
    async savePDF() {
      const { PDFDocument, rgb, degrees } = PDFLib;
      const pdfDoc = await PDFDocument.load(this.pdfBytes);
      const pages = pdfDoc.getPages();
      const embeddedImageCache = /* @__PURE__ */ new Map();
      for (const [pageNum, modifications] of this.modManager.modifications) {
        const page = pages[pageNum - 1];
        const { width, height } = page.getSize();
        const rotation = page.getRotation();
        const angle = (rotation.angle || 0) % 360;
        for (const mod of modifications) {
          if (mod.type === "text") {
            const fontSize = mod.fontSize || 16;
            let pdfX, pdfY;
            switch (angle) {
              case 90:
                pdfX = mod.y;
                pdfY = mod.x;
                break;
              case 180:
                pdfX = width - mod.x;
                pdfY = mod.y;
                break;
              case 270:
                pdfX = width - mod.y;
                pdfY = height - mod.x;
                break;
              default:
                pdfX = mod.x;
                pdfY = height - mod.y;
                break;
            }
            page.drawText(mod.text, {
              x: pdfX,
              y: pdfY - fontSize * 0.8,
              size: fontSize,
              color: rgb(0, 0, 0),
              rotate: degrees(angle)
            });
          } else if (mod.type === "image") {
            const imgX = parseFloat(mod.x);
            const imgY = parseFloat(mod.y);
            const imgW = parseFloat(mod.width);
            const imgH = parseFloat(mod.height);
            const visualBottom = imgY + imgH;
            const visualRight = imgX + imgW;
            let drawX, drawY;
            switch (angle) {
              case 90:
                drawX = visualBottom;
                drawY = imgX;
                break;
              case 180:
                drawX = width - visualRight;
                drawY = imgY;
                break;
              case 270:
                drawX = width - visualBottom;
                drawY = height - visualRight;
                break;
              default:
                drawX = imgX;
                drawY = height - visualBottom;
                break;
            }
            let image;
            if (embeddedImageCache.has(mod.data)) {
              image = embeddedImageCache.get(mod.data);
            } else {
              const targetDPI = 150;
              const targetPixelWidth = Math.ceil(imgW / 72 * targetDPI);
              const targetPixelHeight = Math.ceil(imgH / 72 * targetDPI);
              const optimizedDataUrl = await this.optimizeImage(
                mod.data,
                targetPixelWidth,
                targetPixelHeight
              );
              const imageBytes = await fetch(optimizedDataUrl).then((res) => res.arrayBuffer());
              if (optimizedDataUrl.startsWith("data:image/png")) {
                image = await pdfDoc.embedPng(imageBytes);
              } else {
                image = await pdfDoc.embedJpg(imageBytes);
              }
              embeddedImageCache.set(mod.data, image);
            }
            page.drawImage(image, {
              x: drawX,
              y: drawY,
              width: imgW,
              height: imgH,
              rotate: degrees(angle)
            });
          }
        }
      }
      for (const [pageNum, paths] of this.drawingManager.paths) {
        const page = pages[pageNum - 1];
        const { width, height } = page.getSize();
        const rotation = page.getRotation();
        const angle = (rotation.angle || 0) % 360;
        for (const path of paths) {
          if (path.length < 2) continue;
          const transformPoint = (p) => {
            let px, py;
            switch (angle) {
              case 90:
                px = p.y;
                py = p.x;
                break;
              case 180:
                px = width - p.x;
                py = p.y;
                break;
              case 270:
                px = width - p.y;
                py = height - p.x;
                break;
              default:
                px = p.x;
                py = height - p.y;
            }
            return { x: px, y: py };
          };
          for (let i = 0; i < path.length - 1; i++) {
            const p1 = transformPoint(path[i]);
            const p2 = transformPoint(path[i + 1]);
            page.drawLine({
              start: p1,
              end: p2,
              thickness: 2,
              color: rgb(0, 0, 0.5),
              opacity: 1
            });
          }
        }
      }
      const modifiedPdfBytes = await pdfDoc.save();
      const blob = new Blob([modifiedPdfBytes], { type: "application/pdf" });
      try {
        if (window.showSaveFilePicker) {
          const handle = await window.showSaveFilePicker({
            suggestedName: this.fileName,
            types: [{
              description: "PDF Document",
              accept: { "application/pdf": [".pdf"] }
            }]
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          UIManager.showMessage("PDF saved successfully", "success");
        } else {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = this.fileName;
          link.click();
          URL.revokeObjectURL(url);
          UIManager.showMessage("PDF downloaded successfully", "success");
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error(error);
          UIManager.showMessage("Failed to save PDF", "error");
        }
      }
    }
  };
  new PDFEditor();
})();
