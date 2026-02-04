(() => {
  // src/js/pdfEditor.js
  var fileInput = document.getElementById("file-input");
  var dropZone = document.getElementById("drop-zone");
  var hideable = document.querySelectorAll(".hideable");
  var editorContainer = document.getElementById("editor-container");
  var editorFrame = document.getElementById("pdf-editor-frame");
  var filenameDisplay = document.getElementById("filename-display");
  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      hideable.forEach((el) => el.style.display = "none");
      editorContainer.style.display = "block";
      if (e.target.files && e.target.files.length > 0) {
        filenameDisplay.textContent = e.target.files[0].name;
      }
    });
  }
  if (dropZone) {
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
      processFile(dt.files[0]);
    });
  }
  function processFile(file) {
    hideable.forEach((el) => el.style.display = "none");
    editorContainer.style.display = "block";
    filenameDisplay.textContent = file.name;
  }
})();
