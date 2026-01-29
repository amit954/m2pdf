(() => {
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
})();
