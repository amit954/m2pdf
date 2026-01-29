(() => {
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
})();
