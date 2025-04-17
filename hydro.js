(function () {
  function loadCodeMirror(callback) {
    if (window.CodeMirror) {
      callback();
      return;
    }
    const scripts = [
      {
        src: "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.7/codemirror.min.js",
        fallback: "https://unpkg.com/codemirror@5.65.7/lib/codemirror.js",
        name: "CodeMirror core",
        type: "script",
        onError: () => showCustomModal("Error", "Could not load CodeMirror core.")
      },
      {
        src: "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.7/codemirror.min.css",
        name: "CodeMirror CSS",
        type: "css"
      },
      {
        src: "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.7/mode/javascript/javascript.min.js",
        fallback: "https://unpkg.com/codemirror@5.65.7/mode/javascript/javascript.js",
        name: "JavaScript mode",
        type: "script",
        onError: () => showCustomModal("Error", "Could not load CodeMirror JavaScript mode.")
      },
      {
        src: "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.7/addon/hint/show-hint.min.js",
        fallback: "https://unpkg.com/codemirror@5.65.7/addon/hint/show-hint.js",
        name: "Show-hint addon",
        type: "script",
        onError: () => {
          console.error("Failed to load show-hint addon");
          window.hintFailed = true;
        }
      },
      {
        src: "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.7/addon/hint/show-hint.min.css",
        name: "Show-hint CSS",
        type: "css"
      },
      {
        src: "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.7/addon/lint/lint.min.js",
        fallback: "https://unpkg.com/codemirror@5.65.7/addon/lint/lint.js",
        name: "Lint addon",
        type: "script",
        onError: () => {
          console.error("Failed to load lint addon");
          window.lintFailed = true;
        }
      },
      {
        src: "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.7/addon/lint/lint.min.css",
        name: "Lint CSS",
        type: "css"
      },
      {
        src: "https://cdnjs.cloudflare.com/ajax/libs/jshint/2.13.6/jshint.min.js",
        fallback: "https://unpkg.com/jshint@2.13.6/dist/jshint.js",
        name: "JSHint",
        type: "script",
        onError: () => {
          console.error("Failed to load JSHint");
          window.lintFailed = true;
        }
      },
      {
        src: "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.7/theme/monokai.min.css",
        name: "Monokai theme",
        type: "css",
        onError: () => showCustomModal("Error", "Could not load CodeMirror theme.")
      }
    ];

    function loadNext(index) {
      if (index >= scripts.length) {
        callback();
        return;
      }
      const { src, fallback, name, type, onError } = scripts[index];
      const element = document.createElement(type === "script" ? "script" : "link");
      if (type === "script") {
        element.src = src;
      } else {
        element.rel = "stylesheet";
        element.href = src;
      }
      element.onerror = () => {
        console.error(`Failed to load ${name}: ${src}`);
        if (fallback) {
          element.src = fallback;
          element.onerror = () => {
            console.error(`Fallback failed for ${name}: ${fallback}`);
            if (onError) onError();
            loadNext(index + 1);
          };
          element.onload = () => {
            loadNext(index + 1);
          };
          document.head.appendChild(element);
        } else {
          if (onError) onError();
          loadNext(index + 1);
        }
      };
      element.onload = () => {
        loadNext(index + 1);
      };
      document.head.appendChild(element);
    }

    loadNext(0);
  }

  // Inline minimal JSHint configuration as a fallback
  if (!window.JSHINT) {
    window.JSHINT = function (code, options) {
      options = options || { esversion: 6 };
      const errors = [];
      try {
        // Basic syntax check using Function constructor
        new Function(code);
      } catch (e) {
        errors.push({
          line: 1,
          character: 1,
          reason: e.message,
          severity: "error"
        });
      }
      // Simple undefined variable check
      const undefinedVars = code.match(/\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g) || [];
      undefinedVars.forEach((varName) => {
        if (!/^(function|var|let|const|if|for|while|return|true|false|null|undefined|console|document|window)$/.test(varName) &&
          code.indexOf(`var ${varName}`) === -1 &&
          code.indexOf(`let ${varName}`) === -1 &&
          code.indexOf(`const ${varName}`) === -1) {
          errors.push({
            line: 1,
            character: 1,
            reason: `'${varName}' is not defined`,
            severity: "warning"
          });
        }
      });
      return errors;
    };
  }

  function showCustomModal(title, message) {
    const modal = document.createElement("div");
    modal.className = "hydro-editor-custom-modal";
    modal.innerHTML = `
      <div class="custom-modal-content">
        <div class="custom-modal-header">
          <span>${title}</span>
          <button class="custom-modal-close">×</button>
        </div>
        <div class="custom-modal-body">${message}</div>
        <div class="custom-modal-footer">
          <button class="custom-modal-ok">OK</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const closeModal = () => {
      modal.remove();
    };

    modal.querySelector(".custom-modal-close").addEventListener("click", closeModal);
    modal.querySelector(".custom-modal-ok").addEventListener("click", closeModal);
  }

  function createModal() {
    if (!document.querySelector("#hydro-styles")) {
      let style = document.createElement("style");
      style.id = "hydro-styles";
      style.textContent = `
            @keyframes slideIn {
                from { transform: translateY(-20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            .hydro-editor-modal {
                position: fixed;
                background: linear-gradient(135deg, #1e1e1e, #252526);
                border-radius: 8px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
                z-index: 10000;
                width: 900px;
                height: 700px;
                font-family: 'Segoe UI', 'Roboto', 'Oxygen', sans-serif;
                display: flex;
                flex-direction: column;
                animation: slideIn 0.3s ease-out;
                color: #d4d4d4;
                overflow: hidden;
            }
            .hydro-editor-header {
                background: linear-gradient(90deg, #2d2d2d, #333333);
                color: #e0e0e0;
                padding: 10px 15px;
                border-radius: 8px 8px 0 0;
                cursor: move;
                display: flex;
                justify-content: space-between;
                align-items: center;
                user-select: none;
                font-size: 14px;
                font-weight: 600;
                border-bottom: 2px solid #3c3c3c;
                height: 40px;
                flex-shrink: 0;
            }
            .hydro-editor-header:hover {
                background: linear-gradient(90deg, #333333, #3c3c3c);
            }
            .hydro-editor-header span {
                font-size: 14px;
                font-weight: 600;
            }
            .hydro-editor-header-buttons {
                display: flex;
                gap: 8px;
            }
            .hydro-editor-header button {
                background-color: transparent;
                color: #e0e0e0;
                border: none;
                font-size: 14px;
                cursor: pointer;
                padding: 6px 10px;
                transition: color 0.2s, background-color 0.2s;
                border-radius: 4px;
                font-weight: 500;
            }
            .hydro-editor-header button:hover {
                color: #ffffff;
                background-color: #4a4a4a;
            }
            .hydro-editor-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                background: #1e1e1e url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAJElEQVQYV2NkYGD4z8DAwMgAB//xQAFgNUEgF6Qe9AAAAAElFTkSuQmCC') repeat;
                border-radius: 0 0 8px 8px;
                overflow: hidden;
            }
            .hydro-editor-main-content {
                flex: 1;
                display: flex;
                overflow: hidden;
            }
            .hydro-editor-sidebar {
                width: 40px;
                background-color: #252526;
                border-right: 2px solid #3c3c3c;
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 10px 0;
                flex-shrink: 0;
                transition: background-color 0.2s;
            }
            .hydro-editor-sidebar button {
                background: none;
                border: none;
                color: #cccccc;
                font-size: 18px;
                padding: 10px;
                cursor: pointer;
                transition: color 0.2s, transform 0.1s;
                width: 100%;
                text-align: center;
                border-radius: 4px;
            }
            .hydro-editor-sidebar button:hover {
                color: #ffffff;
                transform: scale(1.1);
                background-color: #3c3c3c;
            }
            .hydro-editor-wrapper {
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            .hydro-editor-toolbar {
                display: flex;
                background-color: #252526;
                border-bottom: 2px solid #3c3c3c;
                height: 36px;
                align-items: center;
                flex-shrink: 0;
                box-shadow: inset 0 -1px 0 #1e1e1e;
            }
            .hydro-editor-toolbar-menu {
                display: flex;
                gap: 10px;
                padding: 0 10px;
            }
            .hydro-editor-toolbar-menu-item {
                position: relative;
                color: #cccccc;
                font-size: 13px;
                padding: 8px 10px;
                cursor: pointer;
                transition: color 0.2s, background-color 0.2s;
            }
            .hydro-editor-toolbar-menu-item:hover {
                color: #ffffff;
                background-color: #3c3c3c;
            }
            .hydro-editor-toolbar-submenu {
                display: none;
                position: absolute;
                top: 100%;
                left: 0;
                background-color: #2d2d2d;
                border: 2px solid #3c3c3c;
                border-radius: 4px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
                min-width: 150px;
                z-index: 10001;
            }
            .hydro-editor-toolbar-menu-item:hover .hydro-editor-toolbar-submenu {
                display: block;
            }
            .hydro-editor-toolbar-submenu button {
                display: block;
                width: 100%;
                background: none;
                border: none;
                color: #cccccc;
                font-size: 13px;
                padding: 8px 12px;
                text-align: left;
                cursor: pointer;
                transition: color 0.2s, background-color 0.2s;
            }
            .hydro-editor-toolbar-submenu button:hover {
                color: #ffffff;
                background-color: #3c3c3c;
            }
            .hydro-editor-tab-bar {
                display: flex;
                background-color: #252526;
                border-bottom: 2px solid #3c3c3c;
                height: 38px;
                align-items: center;
                flex-shrink: 0;
                overflow-x: auto;
                box-shadow: inset 0 -1px 0 #1e1e1e;
            }
            .hydro-editor-tab {
                padding: 0 18px;
                height: 100%;
                cursor: pointer;
                background-color: #2d2d2d;
                color: #cccccc;
                border-right: 2px solid #3c3c3c;
                transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;
                font-size: 13px;
                display: flex;
                align-items: center;
                min-width: 130px;
                max-width: 220px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                position: relative;
            }
            .hydro-editor-tab:hover {
                background-color: #3c3c3c;
                color: #ffffff;
                box-shadow: inset 0 -2px 0 #007acc;
            }
            .hydro-editor-tab.active {
                background-color: #1e1e1e;
                color: #ffffff;
                box-shadow: inset 0 -4px 0 #007acc;
                font-weight: 500;
            }
            .hydro-editor-tab-close {
                margin-left: 10px;
                color: #858585;
                cursor: pointer;
                transition: color 0.2s;
                font-size: 13px;
                padding: 2px 4px;
                border-radius: 3px;
            }
            .hydro-editor-tab-close:hover {
                color: #ffffff;
                background-color: #4a4a4a;
            }
            .hydro-editor-new-tab-btn {
                background: none;
                border: none;
                color: #cccccc;
                font-size: 18px;
                padding: 10px;
                cursor: pointer;
                transition: color 0.2s, transform 0.1s;
                height: 100%;
                display: flex;
                align-items: center;
            }
            .hydro-editor-new-tab-btn:hover {
                color: #ffffff;
                transform: scale(1.1);
                background-color: #3c3c3c;
            }
            .hydro-editor-container {
                flex: 1;
                min-height: 0;
                overflow: auto;
                background-color: #1e1e1e;
            }
            .CodeMirror {
                height: 100% !important;
                width: 100% !important;
                background-color: #1e1e1e;
                color: #d4d4d4;
                font-family: 'Fira Code', 'Consolas', monospace;
                font-size: 14px;
                line-height: 1.6;
                text-rendering: optimizeLegibility;
            }
            .CodeMirror-gutters {
                background-color: #252526;
                border-right: 2px solid #3c3c3c;
            }
            .CodeMirror-linenumber {
                color: #858585;
                padding-right: 10px;
                font-size: 13px;
            }
            .CodeMirror-cursor {
                border-left: 2px solid #ffffff;
            }
            .CodeMirror-hints {
                background: #2d2d2d;
                border: 2px solid #3c3c3c;
                border-radius: 4px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
                color: #d4d4d4;
                font-family: 'Fira Code', monospace;
                font-size: 13px;
            }
            .CodeMirror-hint {
                padding: 4px 8px;
                color: #cccccc;
                cursor: pointer;
            }
            .CodeMirror-hint:hover {
                background: #3c3c3c;
                color: #ffffff;
            }
            .CodeMirror-hint-active {
                background: #007acc;
                color: #ffffff;
            }
            .CodeMirror-lint-mark-error, .CodeMirror-lint-mark-warning {
                background-position: center;
            }
            .CodeMirror-lint-mark-error {
                background: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAYAAAC09K7GAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB9sJDw4cOC/6q7UAAAAZdEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAAAFElEQVQI12NgYGBgY/j//z8DMACtgAm1gP4pAAAAAElFTkSuQmCC') center no-repeat;
            }
            .CodeMirror-lint-mark-warning {
                background: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAYAAAC09K7GAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB9sJDw4cNzv/1VMAAAAZdEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAAAFUlEQVQI12NgYGBgY/j//z8DIAClgAm0gP4vAAAAAElFTkSuQmCC') center no-repeat;
            }
            .CodeMirror-lint-tooltip {
                background: #2d2d2d;
                border: 2px solid #3c3c3c;
                border-radius: 4px;
                color: #d4d4d4;
                font-family: 'Fira Code', monospace;
                font-size: 13px;
                padding: 4px 8px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
            }
            .hydro-editor-settings-panel {
                display: none;
                padding: 15px;
                background-color: #252526;
                border-top: 2px solid #3c3c3c;
                animation: fadeIn 0.3s ease-out;
                font-size: 13px;
                max-height: 250px;
                overflow-y: auto;
                flex-shrink: 0;
            }
            .hydro-editor-settings-panel h3 {
                margin: 0 0 10px;
                font-size: 14px;
                color: #ffffff;
                font-weight: 600;
            }
            .hydro-editor-settings-panel label {
                display: block;
                margin: 8px 0 4px;
                font-size: 13px;
                color: #cccccc;
            }
            .hydro-editor-settings-panel select,
            .hydro-editor-settings-panel input {
                width: 100%;
                padding: 8px;
                background-color: #2d2d2d;
                border: 2px solid #3c3c3c;
                border-radius: 5px;
                color: #d4d4d4;
                font-size: 13px;
                font-family: 'Fira Code', monospace;
                transition: border-color 0.2s;
            }
            .hydro-editor-settings-panel select:focus,
            .hydro-editor-settings-panel input:focus {
                outline: none;
                border-color: #007acc;
            }
            .hydro-editor-custom-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10001;
            }
            .hydro-editor-custom-modal-content {
                background: #2d2d2d;
                border-radius: 8px;
                width: 400px;
                color: #d4d4d4;
                font-family: 'Segoe UI', 'Roboto', sans-serif;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
            }
            .hydro-editor-custom-modal-header {
                background: #3c3c3c;
                padding: 10px 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 2px solid #4a4a4a;
                border-radius: 8px 8px 0 0;
            }
            .hydro-editor-custom-modal-header span {
                font-size: 14px;
                font-weight: 600;
            }
            .hydro-editor-custom-modal-close {
                background: none;
                border: none;
                color: #cccccc;
                font-size: 16px;
                cursor: pointer;
                padding: 5px;
            }
            .hydro-editor-custom-modal-close:hover {
                color: #ffffff;
            }
            .hydro-editor-custom-modal-body {
                padding: 15px;
                font-size: 13px;
            }
            .hydro-editor-custom-modal-body input[type="text"] {
                width: 100%;
                padding: 8px;
                background-color: #2d2d2d;
                border: 2px solid #3c3c3c;
                border-radius: 5px;
                color: #d4d4d4;
                font-size: 13px;
                font-family: 'Fira Code', monospace;
            }
            .hydro-editor-custom-modal-body input[type="text"]:focus {
                outline: none;
                border-color: #007acc;
            }
            .hydro-editor-custom-modal-footer {
                padding: 10px;
                display: flex;
                justify-content: flex-end;
                border-top: 2px solid #4a4a4a;
            }
            .hydro-editor-custom-modal-ok, .hydro-editor-custom-modal-cancel {
                padding: 8px 16px;
                background: #007acc;
                border: none;
                border-radius: 5px;
                color: #ffffff;
                cursor: pointer;
                font-size: 13px;
                margin-left: 8px;
            }
            .hydro-editor-custom-modal-cancel {
                background: #4a4a4a;
            }
            .hydro-editor-custom-modal-ok:hover {
                background: #005f99;
            }
            .hydro-editor-custom-modal-cancel:hover {
                background: #3c3c3c;
            }
        `;
      document.head.appendChild(style);
    }

    let modal = document.createElement("div");
    modal.className = "hydro-editor-modal";
    modal.style.left = `${(window.innerWidth - 900) / 2}px`;
    modal.style.top = `${(window.innerHeight - 700) / 2}px`;

    let header = document.createElement("div");
    header.className = "hydro-editor-header";
    let logoContainer = document.createElement("div");
    logoContainer.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="50" zoomAndPan="magnify" viewBox="0 0 375 374.999991" height="500" preserveAspectRatio="xMidYMid meet" version="1.0"><defs><clipPath id="25b95e8e5c"><path d="M 23 91 L 189 91 L 189 284 L 23 284 Z M 23 91 " clip-rule="nonzero"/></clipPath><clipPath id="d3019c7775"><path d="M -8.925781 240.175781 L 87.53125 62.484375 L 220.800781 134.824219 L 124.34375 312.515625 Z M -8.925781 240.175781 " clip-rule="nonzero"/></clipPath><clipPath id="5f9afcd705"><path d="M -8.925781 240.175781 L 87.53125 62.484375 L 220.800781 134.824219 L 124.34375 312.515625 Z M -8.925781 240.175781 " clip-rule="nonzero"/></clipPath><clipPath id="da3636ee39"><path d="M 104 91 L 270 91 L 270 284 L 104 284 Z M 104 91 " clip-rule="nonzero"/></clipPath><clipPath id="f4dbc4e374"><path d="M 72.285156 240.175781 L 168.738281 62.484375 L 302.007812 134.824219 L 205.550781 312.515625 Z M 72.285156 240.175781 " clip-rule="nonzero"/></clipPath><clipPath id="7c43c053d0"><path d="M 72.285156 240.175781 L 168.738281 62.484375 L 302.007812 134.824219 L 205.550781 312.515625 Z M 72.285156 240.175781 " clip-rule="nonzero"/></clipPath><clipPath id="f479f224c4"><path d="M 186 91 L 352 91 L 352 284 L 186 284 Z M 186 91 " clip-rule="nonzero"/></clipPath><clipPath id="b68222e0fa"><path d="M 154.199219 240.175781 L 250.65625 62.484375 L 383.925781 134.824219 L 287.46875 312.515625 Z M 154.199219 240.175781 " clip-rule="nonzero"/></clipPath><clipPath id="7d89e772c7"><path d="M 154.199219 240.175781 L 250.65625 62.484375 L 383.925781 134.824219 L 287.46875 312.515625 Z M 154.199219 240.175781 " clip-rule="nonzero"/></clipPath></defs><g clip-path="url(#25b95e8e5c)"><g clip-path="url(#d3019c7775)"><g clip-path="url(#5f9afcd705)"><path fill="#00c950" d="M 154.164062 98.65625 C 155.257812 99.246094 156.328125 99.875 157.378906 100.535156 C 158.429688 101.199219 159.457031 101.894531 160.464844 102.628906 C 161.472656 103.359375 162.457031 104.125 163.421875 104.921875 C 164.382812 105.722656 165.324219 106.554688 166.238281 107.417969 C 167.15625 108.28125 168.046875 109.179688 168.910156 110.105469 C 169.777344 111.035156 170.617188 111.992188 171.433594 112.980469 C 172.246094 113.96875 173.035156 114.988281 173.796875 116.035156 C 174.554688 117.082031 175.289062 118.15625 175.996094 119.257812 C 176.699219 120.363281 177.375 121.492188 178.023438 122.648438 C 178.671875 123.808594 179.292969 124.988281 179.882812 126.195312 C 180.472656 127.402344 181.03125 128.636719 181.5625 129.890625 C 182.089844 131.144531 182.589844 132.421875 183.058594 133.722656 C 183.527344 135.023438 183.964844 136.34375 184.367188 137.6875 C 184.773438 139.027344 185.148438 140.386719 185.492188 141.769531 C 185.832031 143.148438 186.144531 144.546875 186.421875 145.960938 C 186.699219 147.375 186.945312 148.808594 187.15625 150.253906 C 187.371094 151.699219 187.550781 153.160156 187.699219 154.636719 C 187.847656 156.109375 187.960938 157.597656 188.042969 159.097656 C 188.125 160.597656 188.171875 162.105469 188.1875 163.628906 C 188.203125 165.148438 188.1875 166.675781 188.136719 168.214844 C 188.085938 169.753906 188.003906 171.296875 187.886719 172.847656 C 187.769531 174.402344 187.621094 175.957031 187.4375 177.519531 C 187.257812 179.082031 187.042969 180.644531 186.792969 182.210938 C 186.546875 183.78125 186.265625 185.347656 185.957031 186.917969 C 185.644531 188.488281 185.300781 190.058594 184.925781 191.625 C 184.546875 193.195312 184.140625 194.761719 183.703125 196.324219 C 183.261719 197.886719 182.792969 199.445312 182.292969 201 C 181.792969 202.554688 181.261719 204.101562 180.699219 205.644531 C 180.140625 207.183594 179.546875 208.71875 178.925781 210.242188 C 178.304688 211.769531 177.65625 213.285156 176.976562 214.789062 C 176.300781 216.292969 175.59375 217.785156 174.859375 219.269531 C 174.121094 220.75 173.359375 222.21875 172.570312 223.671875 C 171.78125 225.125 170.96875 226.5625 170.125 227.988281 C 169.28125 229.410156 168.414062 230.816406 167.523438 232.207031 C 166.632812 233.59375 165.714844 234.964844 164.773438 236.316406 C 163.832031 237.667969 162.871094 239 161.882812 240.308594 C 160.894531 241.621094 159.886719 242.90625 158.855469 244.175781 C 157.824219 245.441406 156.773438 246.683594 155.703125 247.902344 C 154.628906 249.125 153.539062 250.316406 152.429688 251.488281 C 151.320312 252.65625 150.191406 253.800781 149.042969 254.917969 C 147.898438 256.035156 146.734375 257.125 145.554688 258.183594 C 144.375 259.246094 143.179688 260.277344 141.96875 261.28125 C 140.757812 262.285156 139.535156 263.257812 138.296875 264.199219 C 137.058594 265.144531 135.808594 266.054688 134.546875 266.933594 C 133.285156 267.816406 132.011719 268.664062 130.730469 269.476562 C 129.445312 270.292969 128.152344 271.074219 126.851562 271.824219 C 125.550781 272.570312 124.238281 273.285156 122.921875 273.964844 C 121.605469 274.644531 120.28125 275.289062 118.953125 275.898438 C 117.625 276.507812 116.289062 277.082031 114.953125 277.621094 C 113.613281 278.160156 112.273438 278.660156 110.929688 279.125 C 109.585938 279.589844 108.242188 280.019531 106.894531 280.410156 C 105.546875 280.800781 104.203125 281.152344 102.855469 281.46875 C 101.511719 281.785156 100.167969 282.0625 98.828125 282.300781 C 97.488281 282.539062 96.148438 282.742188 94.816406 282.90625 C 93.480469 283.070312 92.152344 283.195312 90.828125 283.28125 C 89.507812 283.367188 88.191406 283.414062 86.878906 283.425781 C 85.570312 283.433594 84.269531 283.40625 82.976562 283.335938 C 81.683594 283.269531 80.402344 283.164062 79.128906 283.019531 C 77.855469 282.875 76.59375 282.691406 75.34375 282.472656 C 74.097656 282.25 72.859375 281.992188 71.636719 281.695312 C 70.414062 281.398438 69.203125 281.0625 68.007812 280.691406 C 66.8125 280.320312 65.636719 279.910156 64.472656 279.460938 C 63.308594 279.015625 62.164062 278.53125 61.039062 278.011719 C 59.910156 277.492188 58.800781 276.9375 57.710938 276.34375 C 56.617188 275.753906 55.546875 275.125 54.496094 274.464844 C 53.449219 273.800781 52.417969 273.105469 51.410156 272.371094 C 50.402344 271.640625 49.417969 270.875 48.453125 270.078125 C 47.492188 269.277344 46.550781 268.445312 45.636719 267.582031 C 44.722656 266.71875 43.832031 265.820312 42.964844 264.894531 C 42.097656 263.964844 41.257812 263.007812 40.445312 262.019531 C 39.628906 261.03125 38.839844 260.011719 38.082031 258.964844 C 37.320312 257.917969 36.585938 256.84375 35.882812 255.738281 C 35.175781 254.636719 34.5 253.507812 33.851562 252.351562 C 33.203125 251.191406 32.582031 250.011719 31.992188 248.804688 C 31.402344 247.597656 30.84375 246.363281 30.3125 245.109375 C 29.785156 243.855469 29.285156 242.578125 28.816406 241.277344 C 28.347656 239.976562 27.914062 238.65625 27.507812 237.3125 C 27.101562 235.972656 26.726562 234.613281 26.382812 233.230469 C 26.042969 231.851562 25.730469 230.453125 25.453125 229.039062 C 25.175781 227.625 24.929688 226.191406 24.71875 224.746094 C 24.503906 223.300781 24.324219 221.839844 24.175781 220.363281 C 24.03125 218.890625 23.914062 217.402344 23.832031 215.902344 C 23.75 214.402344 23.703125 212.894531 23.6875 211.371094 C 23.671875 209.851562 23.6875 208.324219 23.738281 206.785156 C 23.789062 205.246094 23.875 203.703125 23.988281 202.152344 C 24.105469 200.597656 24.253906 199.042969 24.4375 197.480469 C 24.621094 195.917969 24.832031 194.355469 25.082031 192.789062 C 25.328125 191.21875 25.609375 189.652344 25.917969 188.082031 C 26.230469 186.511719 26.574219 184.941406 26.953125 183.375 C 27.328125 181.804688 27.734375 180.238281 28.171875 178.675781 C 28.613281 177.113281 29.082031 175.554688 29.582031 174 C 30.082031 172.445312 30.613281 170.898438 31.175781 169.355469 C 31.738281 167.816406 32.328125 166.28125 32.949219 164.757812 C 33.570312 163.230469 34.21875 161.714844 34.898438 160.210938 C 35.574219 158.707031 36.28125 157.214844 37.019531 155.730469 C 37.753906 154.25 38.515625 152.78125 39.304688 151.328125 C 40.09375 149.875 40.910156 148.4375 41.75 147.011719 C 42.59375 145.589844 43.460938 144.183594 44.351562 142.792969 C 45.246094 141.40625 46.160156 140.035156 47.101562 138.683594 C 48.042969 137.332031 49.007812 136 49.992188 134.691406 C 50.980469 133.378906 51.988281 132.089844 53.019531 130.824219 C 54.050781 129.558594 55.101562 128.316406 56.171875 127.097656 C 57.246094 125.875 58.335938 124.683594 59.445312 123.511719 C 60.558594 122.34375 61.6875 121.199219 62.832031 120.082031 C 63.980469 118.964844 65.140625 117.875 66.320312 116.816406 C 67.5 115.753906 68.695312 114.722656 69.90625 113.71875 C 71.117188 112.714844 72.339844 111.742188 73.578125 110.800781 C 74.816406 109.855469 76.066406 108.945312 77.328125 108.066406 C 78.589844 107.183594 79.863281 106.335938 81.144531 105.523438 C 82.429688 104.707031 83.722656 103.925781 85.023438 103.175781 C 86.328125 102.429688 87.636719 101.714844 88.953125 101.035156 C 90.269531 100.355469 91.59375 99.710938 92.921875 99.101562 C 94.253906 98.492188 95.585938 97.917969 96.925781 97.378906 C 98.261719 96.839844 99.601562 96.339844 100.945312 95.875 C 102.289062 95.410156 103.636719 94.980469 104.980469 94.589844 C 106.328125 94.199219 107.671875 93.847656 109.019531 93.53125 C 110.363281 93.214844 111.707031 92.9375 113.046875 92.699219 C 114.390625 92.460938 115.726562 92.257812 117.058594 92.09375 C 118.394531 91.929688 119.722656 91.804688 121.046875 91.71875 C 122.367188 91.632812 123.683594 91.585938 124.996094 91.574219 C 126.304688 91.566406 127.605469 91.59375 128.898438 91.664062 C 130.191406 91.730469 131.472656 91.835938 132.746094 91.980469 C 134.019531 92.125 135.28125 92.308594 136.53125 92.527344 C 137.78125 92.75 139.015625 93.007812 140.238281 93.304688 C 141.464844 93.601562 142.671875 93.9375 143.867188 94.308594 C 145.0625 94.679688 146.238281 95.089844 147.402344 95.539062 C 148.566406 95.984375 149.710938 96.46875 150.839844 96.988281 C 151.964844 97.507812 153.074219 98.0625 154.164062 98.65625 Z M 154.164062 98.65625 " fill-opacity="1" fill-rule="nonzero"/></g></g></g><g clip-path="url(#da3636ee39)"><g clip-path="url(#f4dbc4e374)"><g clip-path="url(#7c43c053d0)"><path fill="#00d492" d="M 235.375 98.65625 C 236.464844 99.246094 237.535156 99.875 238.585938 100.535156 C 239.636719 101.199219 240.664062 101.894531 241.671875 102.628906 C 242.679688 103.359375 243.667969 104.125 244.628906 104.921875 C 245.59375 105.722656 246.53125 106.554688 247.445312 107.417969 C 248.363281 108.28125 249.253906 109.179688 250.121094 110.105469 C 250.984375 111.035156 251.824219 111.992188 252.640625 112.980469 C 253.453125 113.96875 254.242188 114.988281 255.003906 116.035156 C 255.765625 117.082031 256.496094 118.15625 257.203125 119.257812 C 257.90625 120.363281 258.585938 121.492188 259.234375 122.648438 C 259.882812 123.808594 260.5 124.988281 261.089844 126.195312 C 261.679688 127.402344 262.238281 128.636719 262.769531 129.890625 C 263.296875 131.144531 263.796875 132.421875 264.265625 133.722656 C 264.734375 135.023438 265.171875 136.34375 265.578125 137.6875 C 265.980469 139.027344 266.355469 140.386719 266.699219 141.769531 C 267.039062 143.148438 267.351562 144.546875 267.628906 145.960938 C 267.90625 147.375 268.152344 148.808594 268.367188 150.253906 C 268.578125 151.699219 268.757812 153.160156 268.90625 154.636719 C 269.054688 156.109375 269.167969 157.597656 269.25 159.097656 C 269.332031 160.597656 269.378906 162.105469 269.394531 163.628906 C 269.410156 165.148438 269.394531 166.675781 269.34375 168.214844 C 269.292969 169.753906 269.210938 171.296875 269.09375 172.847656 C 268.976562 174.402344 268.828125 175.957031 268.644531 177.519531 C 268.464844 179.082031 268.25 180.644531 268.003906 182.210938 C 267.753906 183.78125 267.476562 185.347656 267.164062 186.917969 C 266.851562 188.488281 266.507812 190.058594 266.132812 191.625 C 265.757812 193.195312 265.347656 194.761719 264.910156 196.324219 C 264.472656 197.886719 264 199.445312 263.5 201 C 263 202.554688 262.46875 204.101562 261.90625 205.644531 C 261.347656 207.183594 260.753906 208.71875 260.136719 210.242188 C 259.515625 211.769531 258.863281 213.285156 258.1875 214.789062 C 257.507812 216.292969 256.800781 217.785156 256.066406 219.269531 C 255.332031 220.75 254.570312 222.21875 253.78125 223.671875 C 252.992188 225.125 252.175781 226.5625 251.332031 227.988281 C 250.492188 229.410156 249.625 230.816406 248.730469 232.207031 C 247.839844 233.59375 246.921875 234.964844 245.980469 236.316406 C 245.039062 237.667969 244.078125 239 243.089844 240.308594 C 242.101562 241.621094 241.09375 242.90625 240.0625 244.175781 C 239.035156 245.441406 237.980469 246.683594 236.910156 247.902344 C 235.839844 249.125 234.746094 250.316406 233.636719 251.488281 C 232.527344 252.65625 231.398438 253.800781 230.25 254.917969 C 229.105469 256.035156 227.941406 257.125 226.761719 258.183594 C 225.582031 259.246094 224.386719 260.277344 223.175781 261.28125 C 221.964844 262.285156 220.742188 263.257812 219.503906 264.199219 C 218.265625 265.144531 217.019531 266.054688 215.753906 266.933594 C 214.492188 267.816406 213.21875 268.664062 211.9375 269.476562 C 210.652344 270.292969 209.359375 271.074219 208.058594 271.824219 C 206.757812 272.570312 205.445312 273.285156 204.128906 273.964844 C 202.8125 274.644531 201.488281 275.289062 200.160156 275.898438 C 198.832031 276.507812 197.496094 277.082031 196.160156 277.621094 C 194.820312 278.160156 193.480469 278.660156 192.136719 279.125 C 190.792969 279.589844 189.449219 280.019531 188.101562 280.410156 C 186.757812 280.800781 185.410156 281.152344 184.066406 281.46875 C 182.71875 281.785156 181.375 282.0625 180.035156 282.300781 C 178.695312 282.539062 177.355469 282.742188 176.023438 282.90625 C 174.6875 283.070312 173.359375 283.195312 172.039062 283.28125 C 170.714844 283.367188 169.398438 283.414062 168.089844 283.425781 C 166.777344 283.433594 165.476562 283.40625 164.183594 283.335938 C 162.890625 283.269531 161.609375 283.164062 160.335938 283.019531 C 159.0625 282.875 157.804688 282.691406 156.554688 282.472656 C 155.304688 282.25 154.066406 281.992188 152.84375 281.695312 C 151.621094 281.398438 150.410156 281.0625 149.214844 280.691406 C 148.023438 280.320312 146.84375 279.910156 145.679688 279.460938 C 144.519531 279.015625 143.371094 278.53125 142.246094 278.011719 C 141.117188 277.492188 140.007812 276.9375 138.917969 276.34375 C 137.828125 275.753906 136.757812 275.125 135.707031 274.464844 C 134.65625 273.800781 133.625 273.105469 132.617188 272.371094 C 131.609375 271.640625 130.625 270.875 129.664062 270.078125 C 128.699219 269.277344 127.761719 268.445312 126.84375 267.582031 C 125.929688 266.71875 125.039062 265.820312 124.171875 264.894531 C 123.304688 263.964844 122.464844 263.007812 121.652344 262.019531 C 120.835938 261.03125 120.050781 260.011719 119.289062 258.964844 C 118.527344 257.917969 117.792969 256.84375 117.089844 255.738281 C 116.382812 254.636719 115.707031 253.507812 115.058594 252.351562 C 114.410156 251.191406 113.789062 250.011719 113.199219 248.804688 C 112.613281 247.597656 112.050781 246.363281 111.523438 245.109375 C 110.992188 243.855469 110.492188 242.578125 110.027344 241.277344 C 109.558594 239.976562 109.121094 238.65625 108.714844 237.3125 C 108.308594 235.972656 107.933594 234.613281 107.59375 233.230469 C 107.25 231.851562 106.941406 230.453125 106.664062 229.039062 C 106.382812 227.625 106.140625 226.191406 105.925781 224.746094 C 105.710938 223.300781 105.53125 221.839844 105.386719 220.363281 C 105.238281 218.890625 105.121094 217.402344 105.042969 215.902344 C 104.960938 214.402344 104.910156 212.894531 104.894531 211.371094 C 104.878906 209.851562 104.898438 208.324219 104.949219 206.785156 C 104.996094 205.246094 105.082031 203.703125 105.199219 202.152344 C 105.3125 200.597656 105.464844 199.042969 105.644531 197.480469 C 105.828125 195.917969 106.042969 194.355469 106.289062 192.789062 C 106.535156 191.21875 106.816406 189.652344 107.128906 188.082031 C 107.441406 186.511719 107.785156 184.941406 108.160156 183.375 C 108.535156 181.804688 108.941406 180.238281 109.382812 178.675781 C 109.820312 177.113281 110.289062 175.554688 110.789062 174 C 111.289062 172.445312 111.820312 170.898438 112.382812 169.355469 C 112.945312 167.816406 113.535156 166.28125 114.15625 164.757812 C 114.777344 163.230469 115.425781 161.714844 116.105469 160.210938 C 116.785156 158.707031 117.492188 157.214844 118.226562 155.730469 C 118.960938 154.25 119.722656 152.78125 120.511719 151.328125 C 121.300781 149.875 122.117188 148.4375 122.957031 147.011719 C 123.800781 145.589844 124.667969 144.183594 125.558594 142.792969 C 126.453125 141.40625 127.367188 140.035156 128.308594 138.683594 C 129.25 137.332031 130.214844 136 131.199219 134.691406 C 132.1875 133.378906 133.195312 132.089844 134.226562 130.824219 C 135.257812 129.558594 136.308594 128.316406 137.378906 127.097656 C 138.453125 125.875 139.542969 124.683594 140.65625 123.511719 C 141.765625 122.34375 142.894531 121.199219 144.039062 120.082031 C 145.1875 118.964844 146.351562 117.875 147.53125 116.816406 C 148.710938 115.753906 149.902344 114.722656 151.113281 113.71875 C 152.324219 112.714844 153.546875 111.742188 154.785156 110.800781 C 156.023438 109.855469 157.273438 108.945312 158.535156 108.066406 C 159.796875 107.183594 161.070312 106.335938 162.355469 105.523438 C 163.636719 104.707031 164.929688 103.925781 166.234375 103.175781 C 167.535156 102.429688 168.84375 101.714844 170.160156 101.035156 C 171.476562 100.355469 172.800781 99.710938 174.128906 99.101562 C 175.460938 98.492188 176.792969 97.917969 178.132812 97.378906 C 179.46875 96.839844 180.8125 96.339844 182.15625 95.875 C 183.5 95.410156 184.84375 94.980469 186.1875 94.589844 C 187.535156 94.199219 188.878906 93.847656 190.226562 93.53125 C 191.570312 93.214844 192.914062 92.9375 194.253906 92.699219 C 195.597656 92.460938 196.933594 92.257812 198.269531 92.09375 C 199.601562 91.929688 200.929688 91.804688 202.253906 91.71875 C 203.578125 91.632812 204.894531 91.585938 206.203125 91.574219 C 207.511719 91.566406 208.8125 91.59375 210.105469 91.664062 C 211.398438 91.730469 212.679688 91.835938 213.953125 91.980469 C 215.226562 92.125 216.488281 92.308594 217.738281 92.527344 C 218.988281 92.75 220.222656 93.007812 221.449219 93.304688 C 222.671875 93.601562 223.878906 93.9375 225.074219 94.308594 C 226.269531 94.679688 227.449219 95.089844 228.609375 95.539062 C 229.773438 95.984375 230.917969 96.46875 232.046875 96.988281 C 233.175781 97.507812 234.285156 98.0625 235.375 98.65625 Z M 235.375 98.65625 " fill-opacity="1" fill-rule="nonzero"/></g></g></g><g clip-path="url(#f479f224c4)"><g clip-path="url(#b68222e0fa)"><g clip-path="url(#7d89e772c7)"><path fill="#46ecd5" d="M 317.289062 98.65625 C 318.382812 99.246094 319.453125 99.875 320.5 100.535156 C 321.550781 101.199219 322.582031 101.894531 323.589844 102.628906 C 324.597656 103.359375 325.582031 104.125 326.546875 104.921875 C 327.507812 105.722656 328.449219 106.554688 329.363281 107.417969 C 330.277344 108.28125 331.167969 109.179688 332.035156 110.105469 C 332.902344 111.035156 333.742188 111.992188 334.554688 112.980469 C 335.371094 113.96875 336.160156 114.988281 336.917969 116.035156 C 337.679688 117.082031 338.414062 118.15625 339.117188 119.257812 C 339.824219 120.363281 340.5 121.492188 341.148438 122.648438 C 341.796875 123.808594 342.417969 124.988281 343.007812 126.195312 C 343.597656 127.402344 344.15625 128.636719 344.6875 129.890625 C 345.214844 131.144531 345.714844 132.421875 346.183594 133.722656 C 346.652344 135.023438 347.085938 136.34375 347.492188 137.6875 C 347.898438 139.027344 348.273438 140.386719 348.617188 141.769531 C 348.957031 143.148438 349.269531 144.546875 349.546875 145.960938 C 349.824219 147.375 350.070312 148.808594 350.28125 150.253906 C 350.496094 151.699219 350.675781 153.160156 350.824219 154.636719 C 350.96875 156.109375 351.085938 157.597656 351.167969 159.097656 C 351.25 160.597656 351.296875 162.105469 351.3125 163.628906 C 351.328125 165.148438 351.3125 166.675781 351.261719 168.214844 C 351.210938 169.753906 351.125 171.296875 351.011719 172.847656 C 350.894531 174.402344 350.746094 175.957031 350.5625 177.519531 C 350.378906 179.082031 350.167969 180.644531 349.917969 182.210938 C 349.671875 183.78125 349.390625 185.347656 349.082031 186.917969 C 348.769531 188.488281 348.425781 190.058594 348.046875 191.625 C 347.671875 193.195312 347.265625 194.761719 346.828125 196.324219 C 346.386719 197.886719 345.917969 199.445312 345.417969 201 C 344.917969 202.554688 344.386719 204.101562 343.824219 205.644531 C 343.261719 207.183594 342.671875 208.71875 342.050781 210.242188 C 341.429688 211.769531 340.78125 213.285156 340.101562 214.789062 C 339.425781 216.292969 338.71875 217.785156 337.980469 219.269531 C 337.246094 220.75 336.484375 222.21875 335.695312 223.671875 C 334.90625 225.125 334.089844 226.5625 333.25 227.988281 C 332.40625 229.410156 331.539062 230.816406 330.648438 232.207031 C 329.753906 233.59375 328.839844 234.964844 327.898438 236.316406 C 326.957031 237.667969 325.992188 239 325.007812 240.308594 C 324.019531 241.621094 323.011719 242.90625 321.980469 244.175781 C 320.949219 245.441406 319.898438 246.683594 318.828125 247.902344 C 317.753906 249.125 316.664062 250.316406 315.554688 251.488281 C 314.441406 252.65625 313.3125 253.800781 312.167969 254.917969 C 311.019531 256.035156 309.859375 257.125 308.679688 258.183594 C 307.5 259.246094 306.304688 260.277344 305.09375 261.28125 C 303.882812 262.285156 302.660156 263.257812 301.421875 264.199219 C 300.183594 265.144531 298.933594 266.054688 297.671875 266.933594 C 296.410156 267.816406 295.136719 268.664062 293.855469 269.476562 C 292.570312 270.292969 291.277344 271.074219 289.976562 271.824219 C 288.671875 272.570312 287.363281 273.285156 286.046875 273.964844 C 284.730469 274.644531 283.40625 275.289062 282.078125 275.898438 C 280.746094 276.507812 279.414062 277.082031 278.074219 277.621094 C 276.738281 278.160156 275.398438 278.660156 274.054688 279.125 C 272.710938 279.589844 271.363281 280.019531 270.019531 280.410156 C 268.671875 280.800781 267.328125 281.152344 265.980469 281.46875 C 264.636719 281.785156 263.292969 282.0625 261.953125 282.300781 C 260.609375 282.539062 259.273438 282.742188 257.941406 282.90625 C 256.605469 283.070312 255.277344 283.195312 253.953125 283.28125 C 252.628906 283.367188 251.3125 283.414062 250.003906 283.425781 C 248.695312 283.433594 247.394531 283.40625 246.101562 283.335938 C 244.808594 283.269531 243.527344 283.164062 242.253906 283.019531 C 240.980469 282.875 239.71875 282.691406 238.46875 282.472656 C 237.21875 282.25 235.984375 281.992188 234.761719 281.695312 C 233.535156 281.398438 232.328125 281.0625 231.132812 280.691406 C 229.9375 280.320312 228.761719 279.910156 227.597656 279.460938 C 226.433594 279.015625 225.289062 278.53125 224.160156 278.011719 C 223.035156 277.492188 221.925781 276.9375 220.835938 276.34375 C 219.742188 275.753906 218.671875 275.125 217.621094 274.464844 C 216.570312 273.800781 215.542969 273.105469 214.535156 272.371094 C 213.527344 271.640625 212.542969 270.875 211.578125 270.078125 C 210.617188 269.277344 209.675781 268.445312 208.761719 267.582031 C 207.84375 266.71875 206.953125 265.820312 206.089844 264.894531 C 205.222656 263.964844 204.382812 263.007812 203.566406 262.019531 C 202.753906 261.03125 201.964844 260.011719 201.203125 258.964844 C 200.445312 257.917969 199.710938 256.84375 199.003906 255.738281 C 198.300781 254.636719 197.625 253.507812 196.976562 252.351562 C 196.328125 251.191406 195.707031 250.011719 195.117188 248.804688 C 194.527344 247.597656 193.96875 246.363281 193.4375 245.109375 C 192.910156 243.855469 192.410156 242.578125 191.941406 241.277344 C 191.472656 239.976562 191.035156 238.65625 190.632812 237.3125 C 190.226562 235.972656 189.851562 234.613281 189.507812 233.230469 C 189.167969 231.851562 188.855469 230.453125 188.578125 229.039062 C 188.300781 227.625 188.054688 226.191406 187.84375 224.746094 C 187.628906 223.300781 187.449219 221.839844 187.300781 220.363281 C 187.152344 218.890625 187.039062 217.402344 186.957031 215.902344 C 186.875 214.402344 186.828125 212.894531 186.8125 211.371094 C 186.796875 209.851562 186.8125 208.324219 186.863281 206.785156 C 186.914062 205.246094 186.996094 203.703125 187.113281 202.152344 C 187.230469 200.597656 187.378906 199.042969 187.5625 197.480469 C 187.742188 195.917969 187.957031 194.355469 188.207031 192.789062 C 188.453125 191.21875 188.734375 189.652344 189.042969 188.082031 C 189.355469 186.511719 189.699219 184.941406 190.074219 183.375 C 190.453125 181.804688 190.859375 180.238281 191.296875 178.675781 C 191.738281 177.113281 192.207031 175.554688 192.707031 174 C 193.207031 172.445312 193.738281 170.898438 194.300781 169.355469 C 194.859375 167.816406 195.453125 166.28125 196.074219 164.757812 C 196.695312 163.230469 197.34375 161.714844 198.023438 160.210938 C 198.699219 158.707031 199.40625 157.214844 200.140625 155.730469 C 200.878906 154.25 201.640625 152.78125 202.429688 151.328125 C 203.21875 149.875 204.03125 148.4375 204.875 147.011719 C 205.71875 145.589844 206.582031 144.183594 207.476562 142.792969 C 208.367188 141.40625 209.285156 140.035156 210.226562 138.683594 C 211.167969 137.332031 212.128906 136 213.117188 134.691406 C 214.105469 133.378906 215.113281 132.089844 216.144531 130.824219 C 217.175781 129.558594 218.226562 128.316406 219.296875 127.097656 C 220.371094 125.875 221.460938 124.683594 222.570312 123.511719 C 223.679688 122.34375 224.808594 121.199219 225.957031 120.082031 C 227.101562 118.964844 228.265625 117.875 229.445312 116.816406 C 230.625 115.753906 231.820312 114.722656 233.03125 113.71875 C 234.242188 112.714844 235.464844 111.742188 236.703125 110.800781 C 237.941406 109.855469 239.191406 108.945312 240.453125 108.066406 C 241.714844 107.183594 242.988281 106.335938 244.269531 105.523438 C 245.554688 104.707031 246.847656 103.925781 248.148438 103.175781 C 249.449219 102.429688 250.761719 101.714844 252.078125 101.035156 C 253.394531 100.355469 254.71875 99.710938 256.046875 99.101562 C 257.375 98.492188 258.710938 97.917969 260.046875 97.378906 C 261.386719 96.839844 262.726562 96.339844 264.070312 95.875 C 265.414062 95.410156 266.757812 94.980469 268.105469 94.589844 C 269.453125 94.199219 270.796875 93.847656 272.144531 93.53125 C 273.488281 93.214844 274.832031 92.9375 276.171875 92.699219 C 277.511719 92.460938 278.851562 92.257812 280.183594 92.09375 C 281.519531 91.929688 282.847656 91.804688 284.171875 91.71875 C 285.492188 91.632812 286.808594 91.585938 288.121094 91.574219 C 289.429688 91.566406 290.730469 91.59375 292.023438 91.664062 C 293.316406 91.730469 294.597656 91.835938 295.871094 91.980469 C 297.144531 92.125 298.40625 92.308594 299.65625 92.527344 C 300.902344 92.75 302.140625 93.007812 303.363281 93.304688 C 304.585938 93.601562 305.796875 93.9375 306.992188 94.308594 C 308.1875 94.679688 309.363281 95.089844 310.527344 95.539062 C 311.691406 95.984375 312.835938 96.46875 313.960938 96.988281 C 315.089844 97.507812 316.199219 98.0625 317.289062 98.65625 Z M 317.289062 98.65625 " fill-opacity="1" fill-rule="nonzero"/></g></g></g></svg>`;
    let title = document.createElement("span");
    title.textContent = "Hydro Code Editor";
    let headerButtons = document.createElement("div");
    headerButtons.className = "hydro-editor-header-buttons";
    let minimizeBtn = document.createElement("button");
    minimizeBtn.textContent = "−";
    let closeBtn = document.createElement("button");
    closeBtn.textContent = "×";
    headerButtons.appendChild(minimizeBtn);
    headerButtons.appendChild(closeBtn);
    header.appendChild(logoContainer);
    header.appendChild(title);
    header.appendChild(headerButtons);
    modal.appendChild(header);

    let content = document.createElement("div");
    content.className = "hydro-editor-content";

    let mainContent = document.createElement("div");
    mainContent.className = "hydro-editor-main-content";

    let sidebar = document.createElement("div");
    sidebar.className = "hydro-editor-sidebar";
    let settingsBtn = document.createElement("button");
    settingsBtn.textContent = "⚙";
    settingsBtn.title = "Settings";
    let playBtn = document.createElement("button");
    playBtn.textContent = "▶";
    playBtn.title = "Execute";
    sidebar.appendChild(settingsBtn);
    sidebar.appendChild(playBtn);

    let editorWrapper = document.createElement("div");
    editorWrapper.className = "hydro-editor-wrapper";

    let toolbar = document.createElement("div");
    toolbar.className = "hydro-editor-toolbar";
    let toolbarMenu = document.createElement("div");
    toolbarMenu.className = "hydro-editor-toolbar-menu";

    // File Menu
    let fileMenu = document.createElement("div");
    fileMenu.className = "hydro-editor-toolbar-menu-item";
    fileMenu.textContent = "File";
    let fileSubmenu = document.createElement("div");
    fileSubmenu.className = "hydro-editor-toolbar-submenu";
    let newTabBtn = document.createElement("button");
    newTabBtn.textContent = "New Tab";
    let saveBtn = document.createElement("button");
    saveBtn.textContent = "Save";
    let loadBtn = document.createElement("button");
    loadBtn.textContent = "Load";
    let loadUrlBtn = document.createElement("button");
    loadUrlBtn.textContent = "Load from URL";
    fileSubmenu.appendChild(newTabBtn);
    fileSubmenu.appendChild(saveBtn);
    fileSubmenu.appendChild(loadBtn);
    fileSubmenu.appendChild(loadUrlBtn);
    fileMenu.appendChild(fileSubmenu);

    // Edit Menu
    let editMenu = document.createElement("div");
    editMenu.className = "hydro-editor-toolbar-menu-item";
    editMenu.textContent = "Edit";
    let editSubmenu = document.createElement("div");
    editSubmenu.className = "hydro-editor-toolbar-submenu";
    let undoBtn = document.createElement("button");
    undoBtn.textContent = "Undo";
    let redoBtn = document.createElement("button");
    redoBtn.textContent = "Redo";
    let clearBtn = document.createElement("button");
    clearBtn.textContent = "Clear Tab";
    let formatBtn = document.createElement("button");
    formatBtn.textContent = "Format";
    editSubmenu.appendChild(undoBtn);
    editSubmenu.appendChild(redoBtn);
    editSubmenu.appendChild(clearBtn);
    editSubmenu.appendChild(formatBtn);
    editMenu.appendChild(editSubmenu);

    // Run Menu
    let runMenu = document.createElement("div");
    runMenu.className = "hydro-editor-toolbar-menu-item";
    runMenu.textContent = "Run";
    let runSubmenu = document.createElement("div");
    runSubmenu.className = "hydro-editor-toolbar-submenu";
    let executeBtn = document.createElement("button");
    executeBtn.textContent = "Execute";
    let lintBtn = document.createElement("button");
    lintBtn.textContent = "Lint";
    let debugBtn = document.createElement("button");
    debugBtn.textContent = "Debug";
    runSubmenu.appendChild(executeBtn);
    runSubmenu.appendChild(lintBtn);
    runSubmenu.appendChild(debugBtn);
    runMenu.appendChild(runSubmenu);

    // View Menu
    let viewMenu = document.createElement("div");
    viewMenu.className = "hydro-editor-toolbar-menu-item";
    viewMenu.textContent = "View";
    let viewSubmenu = document.createElement("div");
    viewSubmenu.className = "hydro-editor-toolbar-submenu";
    let pageInfoBtn = document.createElement("button");
    pageInfoBtn.textContent = "hydro-editor-Page Info";
    let loadScriptsBtn = document.createElement("button");
    loadScriptsBtn.textContent = "Load Scripts";
    let clearPageBtn = document.createElement("button");
    clearPageBtn.textContent = "Clear Page";
    viewSubmenu.appendChild(pageInfoBtn);
    viewSubmenu.appendChild(loadScriptsBtn);
    viewSubmenu.appendChild(clearPageBtn);
    viewMenu.appendChild(viewSubmenu);

    toolbarMenu.appendChild(fileMenu);
    toolbarMenu.appendChild(editMenu);
    toolbarMenu.appendChild(runMenu);
    toolbarMenu.appendChild(viewMenu);
    toolbar.appendChild(toolbarMenu);

    let tabBar = document.createElement("div");
    tabBar.className = "hydro-editor-tab-bar";
    let newTabBtnPlaceholder = document.createElement("button");
    newTabBtnPlaceholder.className = "hydro-editor-new-tab-btn";
    newTabBtnPlaceholder.textContent = "+";
    tabBar.appendChild(newTabBtnPlaceholder);

    let editorContainer = document.createElement("div");
    editorContainer.className = "hydro-editor-editor-container";

    let settingsPanel = document.createElement("div");
    settingsPanel.className = "hydro-editor-settings-panel";
    settingsPanel.innerHTML = `
      <h3>Editor Settings</h3>
      <label>Font Family</label>
      <select class="font-select">
        <option value="'Fira Code', monospace">Fira Code</option>
        <option value="'Source Code Pro', monospace">Source Code Pro</option>
        <option value="'Consolas', monospace">Consolas</option>
      </select>
      <label>Font Size</label>
      <input type="number" class="font-size" value="14" min="10" max="24">
      <label>Theme</label>
      <select class="theme-select">
        <option value="monokai">Monokai</option>
        <option value="default">Default</option>
      </select>
      <label>Tab Size</label>
      <input type="number" class="tab-size" value="2" min="1" max="8">
    `;

    editorWrapper.appendChild(toolbar);
    editorWrapper.appendChild(tabBar);
    editorWrapper.appendChild(editorContainer);
    editorWrapper.appendChild(settingsPanel);
    mainContent.appendChild(sidebar);
    mainContent.appendChild(editorWrapper);
    content.appendChild(mainContent);
    modal.appendChild(content);
    document.body.appendChild(modal);

    let editors = [];
    let tabs = [];
    let activeTabIndex = -1;
    let autocompleteTimeout = null;

    function createEditor(content = "") {
      const textarea = document.createElement("textarea");
      textarea.value = content;
      editorContainer.appendChild(textarea);
      try {
        const options = {
          mode: "javascript",
          lineNumbers: true,
          theme: "monokai",
          tabSize: 2,
          indentWithTabs: false,
          matchBrackets: true,
          autoCloseBrackets: true,
          hintOptions: {
            hint: window.hintFailed ? null : CodeMirror.hint.javascript,
            completeSingle: false,
            completeOnSingleClick: false
          },
          extraKeys: {
            "Ctrl-Space": window.hintFailed ? null : "autocomplete",
            ".": function (cm) {
              if (window.hintFailed) return CodeMirror.Pass;
              setTimeout(() => cm.showHint({ hint: CodeMirror.hint.javascript }), 0);
              return CodeMirror.Pass;
            }
          }
        };
        if (window.CodeMirror.lint && !window.lintFailed && window.JSHINT) {
          options.lint = {
            getAnnotations: CodeMirror.lint.javascript,
            async: false,
            options: { esversion: 6 }
          };
          options.gutters = ["CodeMirror-lint-markers"];
        } else {
          console.warn("Linting disabled: CodeMirror.lint or JSHint not available");
        }
        const editor = CodeMirror.fromTextArea(textarea, options);
        editor.getWrapperElement().style.display = "none";
        if (!window.hintFailed) {
          editor.on("keyup", (cm, event) => {
            if (window.hintFailed || cm.state.completionActive) return;
            if (event.key.length === 1 && /[a-zA-Z0-9_]/.test(event.key)) {
              clearTimeout(autocompleteTimeout);
              autocompleteTimeout = setTimeout(() => {
                const cur = cm.getCursor();
                const token = cm.getTokenAt(cur);
                if (token.string.length >= 1) {
                  try {
                    cm.showHint({ hint: CodeMirror.hint.javascript });
                  } catch (e) {
                    console.error("Autocomplete error:", e);
                  }
                }
              }, 100);
            }
          });
          CodeMirror.commands.autocomplete = function (cm) {
            try {
              cm.showHint({ hint: CodeMirror.hint.javascript, completeSingle: false });
            } catch (e) {
              console.error("Manual autocomplete error:", e);
            }
          };
        }
        editor.on("change", () => {
          ensureEditorVisible();
        });
        editor.on("focus", () => {
          ensureEditorVisible();
        });
        return editor;
      } catch (error) {
        console.error("Failed to create CodeMirror editor:", error);
        showCustomModal("Error", "Could not initialize the code editor: " + error.message);
        return null;
      }
    }

    function ensureEditorVisible() {
      if (activeTabIndex >= 0 && editors[activeTabIndex]) {
        const wrapper = editors[activeTabIndex].getWrapperElement();
        if (wrapper) {
          const display = window.getComputedStyle(wrapper).display;
          if (display === "none") {
            wrapper.style.display = "block";
            setTimeout(() => {
              editors[activeTabIndex].refresh();
            }, 0);
          }
        }
        const container = editorContainer.getBoundingClientRect();
        const modalDisplay = window.getComputedStyle(modal).display;
      }
    }

    function createTab(index, content = "") {
      const tab = document.createElement("div");
      tab.className = "hydro-editor-tab";
      tab.textContent = `Script ${index + 1}`;
      const closeBtn = document.createElement("span");
      closeBtn.className = "hydro-editor-tab-close";
      closeBtn.textContent = "×";
      tab.appendChild(closeBtn);
      tabBar.insertBefore(tab, newTabBtnPlaceholder);

      tab.addEventListener("click", () => {
        if (activeTabIndex !== index) {
          switchTab(index);
        }
      });

      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        removeTab(index);
      });

      return tab;
    }

    function switchTab(index) {
      if (index < 0 || index >= editors.length || !editors[index] || typeof editors[index].getWrapperElement !== "function") {
        console.error("Invalid tab index or editor:", index, editors[index]);
        activeTabIndex = editors.length > 0 ? 0 : -1;
        if (activeTabIndex >= 0 && editors[activeTabIndex]) {
          switchTab(activeTabIndex);
        }
        return;
      }
      if (activeTabIndex >= 0 && editors[activeTabIndex]) {
        editors[activeTabIndex].getWrapperElement().style.display = "none";
        tabs[activeTabIndex].classList.remove("active");
      }
      activeTabIndex = index;
      editors[index].getWrapperElement().style.display = "block";
      tabs[index].classList.add("active");
      setTimeout(() => {
        editors[index].refresh();
      }, 0);
    }

    function removeTab(index) {
      if (editors.length <= 1) {
        return;
      }
      if (!editors[index] || !tabs[index]) {
        console.error("Cannot remove tab: Invalid index", index);
        return;
      }
      editors[index].getWrapperElement().remove();
      tabs[index].remove();
      editors.splice(index, 1);
      tabs.splice(index, 1);
      for (let i = 0; i < tabs.length; i++) {
        tabs[i].firstChild.textContent = `Script ${i + 1}`;
      }
      if (activeTabIndex === index) {
        const newIndex = Math.max(0, index - 1);
        switchTab(newIndex);
      } else if (activeTabIndex > index) {
        activeTabIndex--;
      }
    }

    function addTab(content = "") {
      const index = editors.length;
      const editor = createEditor(content);
      if (!editor) {
        console.error(`Failed to create editor for tab ${index}. Skipping tab creation.`);
        return;
      }
      editors.push(editor);
      tabs.push(createTab(index, content));
      setTimeout(() => {
        switchTab(index);
      }, 0);
    }

    function executeCode() {
      if (activeTabIndex < 0 || !editors[activeTabIndex]) {
        showCustomModal("Warning", "No active tab to execute.");
        return;
      }
      const editor = editors[activeTabIndex];
      const code = editor.getValue();
      if (window.CodeMirror.lint && !window.lintFailed && window.JSHINT) {
        const annotations = editor.getOption("lint").getAnnotations(code, { esversion: 6 }, editor);
        if (annotations.some(ann => ann.severity === "error")) {
          showCustomModal("Warning", "Please fix errors in the code before executing.");
          return;
        }
      }
      try {
        new Function(code)();
      } catch (error) {
        console.error("Execution error:", error);
        showCustomModal("Error", "Error executing code: " + error.message);
      }
    }

    settingsBtn.addEventListener("click", () => {
      const wasHidden = settingsPanel.style.display !== "block";
      settingsPanel.style.display = wasHidden ? "block" : "none";
      if (wasHidden && activeTabIndex >= 0 && editors[activeTabIndex]) {
        setTimeout(() => {
          editors[activeTabIndex].refresh();
        }, 0);
      }
    });

    playBtn.addEventListener("click", executeCode);

    const fontSelect = settingsPanel.querySelector(".font-select");
    const fontSizeInput = settingsPanel.querySelector(".font-size");
    const themeSelect = settingsPanel.querySelector(".theme-select");
    const tabSizeInput = settingsPanel.querySelector(".tab-size");

    function applySettings() {
      editors.forEach((editor) => {
        if (editor) {
          editor.getWrapperElement().style.fontFamily = fontSelect.value;
          editor.getWrapperElement().style.fontSize = `${fontSizeInput.value}px`;
          editor.setOption("theme", themeSelect.value);
          const tabSize = parseInt(tabSizeInput.value);
          if (!isNaN(tabSize)) {
            editor.setOption("tabSize", tabSize);
            editor.setOption("indentUnit", tabSize);
          }
          editor.refresh();
        }
      });
    }

    fontSelect.addEventListener("change", applySettings);
    fontSizeInput.addEventListener("input", applySettings);
    themeSelect.addEventListener("change", applySettings);
    tabSizeInput.addEventListener("input", applySettings);

    newTabBtn.addEventListener("click", () => {
      addTab();
    });
    newTabBtnPlaceholder.addEventListener("click", () => {
      addTab();
    });

    saveBtn.addEventListener("click", () => {
      if (activeTabIndex < 0 || !editors[activeTabIndex]) {
        showCustomModal("Warning", "No active tab to save.");
        return;
      }
      const code = editors[activeTabIndex].getValue();
      const blob = new Blob([code], { type: "text/javascript" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `script${activeTabIndex + 1}.js`;
      a.click();
      URL.revokeObjectURL(url);
    });

    loadBtn.addEventListener("click", () => {
      if (activeTabIndex < 0 || !editors[activeTabIndex]) {
        showCustomModal("Warning", "No active tab to load into.");
        return;
      }
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".js,.txt";
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            editors[activeTabIndex].setValue(e.target.result);
          };
          reader.onerror = () => {
            console.error("Error reading file");
            showCustomModal("Error", "Could not read the file.");
          };
          reader.readAsText(file);
        }
      };
      input.click();
    });

    loadUrlBtn.addEventListener("click", () => {
      const modal = document.createElement("div");
      modal.className = "hydro-editor-custom-modal";
      modal.innerHTML = `
        <div class="custom-modal-content">
          <div class="custom-modal-header">
            <span>Load Script from URL</span>
            <button class="custom-modal-close">×</button>
          </div>
          <div class="custom-modal-body">
            <label>Enter URL:</label>
            <input type="text" class="url-input" placeholder="https://example.com/script.js">
          </div>
          <div class="custom-modal-footer">
            <button class="custom-modal-ok">Load</button>
            <button class="custom-modal-cancel">Cancel</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      const closeModal = () => {
        modal.remove();
      };

      modal.querySelector(".custom-modal-close").addEventListener("click", closeModal);
      modal.querySelector(".custom-modal-cancel").addEventListener("click", closeModal);
      modal.querySelector(".custom-modal-ok").addEventListener("click", () => {
        const urlInput = modal.querySelector(".url-input").value.trim();
        if (!urlInput) {
          showCustomModal("Error", "Please enter a valid URL.");
          return;
        }
        fetch(urlInput)
          .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.text();
          })
          .then(content => {
            addTab(`// Loaded from ${urlInput}\n${content}`);
            closeModal();
          })
          .catch(error => {
            console.error("Failed to load script from URL:", error);
            showCustomModal("Error", `Failed to load script: ${error.message}`);
            closeModal();
          });
      });
    });

    undoBtn.addEventListener("click", () => {
      if (activeTabIndex < 0 || !editors[activeTabIndex]) {
        showCustomModal("Warning", "No active tab to undo.");
        return;
      }
      editors[activeTabIndex].undo();
    });

    redoBtn.addEventListener("click", () => {
      if (activeTabIndex < 0 || !editors[activeTabIndex]) {
        showCustomModal("Warning", "No active tab to redo.");
        return;
      }
      editors[activeTabIndex].redo();
    });

    clearBtn.addEventListener("click", () => {
      if (activeTabIndex < 0 || !editors[activeTabIndex]) {
        showCustomModal("Warning", "No active tab to clear.");
        return;
      }
      const modal = document.createElement("div");
      modal.className = "hydro-editor-custom-modal";
      modal.innerHTML = `
        <div class="custom-modal-content">
          <div class="custom-modal-header">
            <span>Confirm</span>
            <button class="custom-modal-close">×</button>
          </div>
          <div class="custom-modal-body">Are you sure you want to clear the current tab?</div>
          <div class="custom-modal-footer">
            <button class="custom-modal-ok">Yes</button>
            <button class="custom-modal-cancel">No</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      const closeModal = () => {
        modal.remove();
      };

      modal.querySelector(".custom-modal-close").addEventListener("click", closeModal);
      modal.querySelector(".custom-modal-cancel").addEventListener("click", closeModal);
      modal.querySelector(".custom-modal-ok").addEventListener("click", () => {
        editors[activeTabIndex].setValue("");
        closeModal();
      });
    });

    formatBtn.addEventListener("click", () => {
      if (activeTabIndex < 0 || !editors[activeTabIndex]) {
        showCustomModal("Warning", "No active tab to format.");
        return;
      }
      const code = editors[activeTabIndex].getValue();
      try {
        let formatted = code
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
          .join("\n");
        let indentLevel = 0;
        formatted = formatted
          .split("\n")
          .map((line) => {
            if (line.includes("}")) indentLevel--;
            const indent = "  ".repeat(Math.max(0, indentLevel));
            if (line.includes("{")) indentLevel++;
            return indent + line;
          })
          .join("\n");
        editors[activeTabIndex].setValue(formatted);
      } catch (error) {
        console.error("Formatting error:", error);
        showCustomModal("Error", "Error formatting code: " + error.message);
      }
    });

    executeBtn.addEventListener("click", executeCode);

    lintBtn.addEventListener("click", () => {
      if (activeTabIndex < 0 || !editors[activeTabIndex]) {
        showCustomModal("Warning", "No active tab to lint.");
        return;
      }
      const editor = editors[activeTabIndex];
      const code = editor.getValue();
      if (window.CodeMirror.lint && !window.lintFailed && window.JSHINT) {
        const annotations = editor.getOption("lint").getAnnotations(code, { esversion: 6 }, editor);
        if (annotations.length === 0) {
          showCustomModal("Lint Results", "No errors or warnings found.");
        } else {
          const message = annotations.map(ann =>
            `${ann.severity.toUpperCase()} (Line ${ann.from.line + 1}): ${ann.message}`
          ).join("\n");
          showCustomModal("Lint Results", `<pre style="white-space: pre-wrap;">${message}</pre>`);
        }
      } else {
        const annotations = window.JSHINT(code, { esversion: 6 });
        if (annotations.length === 0) {
          showCustomModal("Lint Results", "No errors or warnings found (using fallback linter).");
        } else {
          const message = annotations.map(ann =>
            `${ann.severity.toUpperCase()} (Line ${ann.line}): ${ann.reason}`
          ).join("\n");
          showCustomModal("Lint Results", `<pre style="white-space: pre-wrap;">${message}</pre>`);
        }
      }
    });

    debugBtn.addEventListener("click", () => {
      let debug = `Debug Info:\n`;
      editors.forEach((editor, index) => {
        if (editor) debug += `Tab ${index + 1} Content: ${editor.getValue()}\n`;
      });
      debug += `Page URL: ${window.location.href}\nPage Title: ${document.title}\nPage Scripts: ${document.querySelectorAll("script").length}\nLint Available: ${!!window.CodeMirror.lint && !window.lintFailed && !!window.JSHINT}\nHint Available: ${!window.hintFailed}`;
      addTab(debug);
    });

    pageInfoBtn.addEventListener("click", () => {
      const scripts = Array.from(document.querySelectorAll("script"))
        .map((script, i) => `Script ${i + 1}: ${script.src || "Inline Script"}`)
        .join("\n");
      const info = `Page Info:\n- Title: ${document.title}\n- URL: ${window.location.href}\n- Script Count: ${document.scripts.length}\n- Scripts:\n${scripts}`;
      addTab(info);
    });

    loadScriptsBtn.addEventListener("click", () => {
      const scripts = Array.from(document.querySelectorAll("script"));
      if (scripts.length === 0) {
        showCustomModal("Info", "No scripts found on the page.");
        return;
      }
      scripts.forEach((script, index) => {
        if (script.src) {
          fetch(script.src)
            .then((response) => response.text())
            .then((content) => {
              addTab(`// Loaded from ${script.src}\n${content}`);
            })
            .catch((error) => {
              console.error(`Failed to load script ${index + 1}:`, error);
              addTab(`// Failed to load from ${script.src}\n// Error: ${error.message}`);
            });
        } else if (script.textContent.trim()) {
          addTab(script.textContent);
        }
      });
    });

    clearPageBtn.addEventListener("click", () => {
      const modal = document.createElement("div");
      modal.className = "hydro-editor-custom-modal";
      modal.innerHTML = `
        <div class="custom-modal-content">
          <div class="custom-modal-header">
            <span>Confirm</span>
            <button class="custom-modal-close">×</button>
          </div>
          <div class="custom-modal-body">Are you sure you want to clear the page content except for the Hydro Editor?</div>
          <div class="custom-modal-footer">
            <button class="custom-modal-ok">Yes</button>
            <button class="custom-modal-cancel">No</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      const closeModal = () => {
        modal.remove();
      };

      modal.querySelector(".custom-modal-close").addEventListener("click", closeModal);
      modal.querySelector(".custom-modal-cancel").addEventListener("click", closeModal);
      modal.querySelector(".custom-modal-ok").addEventListener("click", () => {
        const bodyChildren = Array.from(document.body.children);
        bodyChildren.forEach((child) => {
          if (child !== modal && !child.classList.contains("custom-modal")) {
            child.remove();
          }
        });
        closeModal();
      });
    });

    let isDragging = false,
      startX,
      startY,
      offsetLeft,
      offsetTop;
    header.addEventListener("mousedown", (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      offsetLeft = modal.offsetLeft;
      offsetTop = modal.offsetTop;
    });

    document.addEventListener("mousemove", (e) => {
      if (isDragging) {
        let dx = e.clientX - startX;
        let dy = e.clientY - startY;
        modal.style.left = `${offsetLeft + dx}px`;
        modal.style.top = `${offsetTop + dy}px`;
      }
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
    });

    let isMinimized = false;
    minimizeBtn.addEventListener("click", () => {
      isMinimized = !isMinimized;
      content.style.display = isMinimized ? "none" : "flex";
      minimizeBtn.textContent = isMinimized ? "+" : "−";
    });

    let isClosed = false;
    closeBtn.addEventListener("click", () => {
      isClosed = true;
      removeModal({ modal });
    });

    loadCodeMirror(() => {
      addTab();
    });

    return {
      modal,
      getOperationCancelled: () => isClosed,
    };
  }

  function removeModal({ modal }) {
    if (modal && modal.parentNode) {
      modal.parentNode.removeChild(modal);
    }
  }

  let modalElements = createModal();
})();