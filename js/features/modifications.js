(() => {
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
})();
