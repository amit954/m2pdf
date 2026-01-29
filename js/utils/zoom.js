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
})();
