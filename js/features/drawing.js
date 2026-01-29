(() => {
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
})();
