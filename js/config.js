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
})();
