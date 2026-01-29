(() => {
  // src/js/performance-utils.js
  var PerformanceManager = class {
    /**
     * @param {Object} pdfDocument - The loaded PDF document object
     * @param {Object} pdfjsLib - The PDF.js library instance
     * @param {Function} renderCallback - Function to call when a page needs rendering (pageNum) => void
     */
    constructor(pdfDocument, pdfjsLib, renderCallback) {
      this.pdfDocument = pdfDocument;
      this.pdfjsLib = pdfjsLib;
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
})();
