(() => {
  // src/js/pdfEditor.js
  document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("file-input");
    const dropZone = document.getElementById("drop-zone");
    const hideable = document.querySelectorAll(".hideable");
    const editorContainer = document.getElementById("editor-container");
    const filenameDisplay = document.getElementById("filename-display");
    const uploadBtn = document.getElementById("upload-btn");
    if (fileInput) {
      fileInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files.length > 0) {
          hideable.forEach((el) => el.style.display = "none");
          editorContainer.style.display = "block";
          if (filenameDisplay) {
            filenameDisplay.textContent = e.target.files[0].name;
          }
        }
      });
    }
    if (dropZone) {
      dropZone.addEventListener("click", () => fileInput.click());
      ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
        dropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
        }, false);
      });
      ["dragenter", "dragover"].forEach((name) => {
        dropZone.addEventListener(name, () => dropZone.classList.add("drag-over"), false);
      });
      ["dragleave", "drop"].forEach((name) => {
        dropZone.addEventListener(name, () => dropZone.classList.remove("drag-over"), false);
      });
      dropZone.addEventListener("drop", (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
          const file = files[0];
          if (file.name.toLowerCase().endsWith(".pdf")) {
            fileInput.files = files;
            const event = new Event("change", { bubbles: true });
            fileInput.dispatchEvent(event);
            document.getElementById("error-message").style.display = "none";
          } else {
            const errorMsg = document.getElementById("error-message");
            errorMsg.textContent = "Please drop a .PDF file";
            errorMsg.style.display = "block";
          }
        }
      });
    }
  });
})();
