(() => {
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
})();
