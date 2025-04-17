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
      <div class="hydro-editor-custom-modal-content">
        <div class="hydro-editor-custom-modal-header">
          <span>${title}</span>
          <button class="hydro-editor-custom-modal-close">×</button>
        </div>
        <div class="hydro-editor-custom-modal-body">${message}</div>
        <div class="hydro-editor-custom-modal-footer">
          <button class="hydro-editor-custom-modal-ok">OK</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const closeModal = () => {
      modal.remove();
    };

    modal.querySelector(".hydro-editor-custom-modal-close").addEventListener("click", closeModal);
    modal.querySelector(".hydro-editor-custom-modal-ok").addEventListener("click", closeModal);
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
                z-index: 10000;
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
                flex-direction: row;
            }
            .hydro-editor-console-panel {
                width: 300px;
                background-color: #1e1e1e;
                border-left: 2px solid #3c3c3c;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                flex-shrink: 0;
            }
            .hydro-editor-console-header {
                background: #252526;
                padding: 8px 10px;
                border-bottom: 2px solid #3c3c3c;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 13px;
                color: #cccccc;
                font-weight: 600;
            }
            .hydro-editor-console-clear-btn {
                background: none;
                border: none;
                color: #cccccc;
                cursor: pointer;
                font-size: 13px;
                padding: 4px 8px;
                border-radius: 3px;
            }
            .hydro-editor-console-clear-btn:hover {
                color: #ffffff;
                background-color: #4a4a4a;
            }
            .hydro-editor-console-output {
                flex: 1;
                background-color: #1e1e1e;
                color: #d4d4d4;
                font-family: 'Fira Code', 'Consolas', monospace;
                font-size: 13px;
                line-height: 1.5;
                padding: 10px;
                overflow-y: auto;
                white-space: pre-wrap;
                border: none;
                resize: none;
            }
            .hydro-editor-console-output:focus {
                outline: none;
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
                min-width: 0;
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
                overflow-y: auto;
                background-color: #1e1e1e;
                position: relative;
            }
            .CodeMirror {
                height: auto !important;
                min-height: 100%;
                width: 100% !important;
                background-color: #1e1e1e;
                color: #d4d4d4;
                font-family: 'Fira Code', 'Consolas', monospace;
                font-size: 14px;
                line-height: 1.6;
                text-rendering: optimizeLegibility;
            }
            .CodeMirror-scroll {
                overflow-y: auto !important;
                max-height: 100%;
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
    logoContainer.innerHTML = `<img width="50" src="https://raw.githubusercontent.com/proplayer919/hydro-editor/refs/heads/main/logo.svg" alt="Hydro Editor Logo">`;
    let title = document.createElement("span");
    title.textContent = "Hydro Editor v1.2 - Made by proplayer919";
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
    let clearConsoleBtn = document.createElement("button");
    clearConsoleBtn.textContent = "🗑";
    clearConsoleBtn.title = "Clear Console";
    sidebar.appendChild(settingsBtn);
    sidebar.appendChild(playBtn);
    sidebar.appendChild(clearConsoleBtn);

    let editorWrapper = document.createElement("div");
    editorWrapper.className = "hydro-editor-wrapper";

    let consolePanel = document.createElement("div");
    consolePanel.className = "hydro-editor-console-panel";
    let consoleHeader = document.createElement("div");
    consoleHeader.className = "hydro-editor-console-header";
    consoleHeader.innerHTML = `<span>Console</span>`;
    let consoleClearBtn = document.createElement("button");
    consoleClearBtn.className = "hydro-editor-console-clear-btn";
    consoleClearBtn.textContent = "Clear";
    consoleHeader.appendChild(consoleClearBtn);
    let consoleOutput = document.createElement("pre");
    consoleOutput.className = "hydro-editor-console-output";
    consoleOutput.textContent = "";
    consolePanel.appendChild(consoleHeader);
    consolePanel.appendChild(consoleOutput);

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
    pageInfoBtn.textContent = "Page Info";
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
    mainContent.appendChild(consolePanel);
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
          theme: localStorage.getItem("editorTheme") || "monokai",
          tabSize: parseInt(localStorage.getItem("editorTabSize")) || 2,
          indentWithTabs: false,
          matchBrackets: true,
          autoCloseBrackets: true,
          lineWrapping: true,
          styleActiveLine: true,
          scrollbarStyle: "native",
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

    function setupConsoleCapture(consoleOutputElement) {
      const originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info
      };

      // Buffer to store console output during execution
      let outputBuffer = [];

      // Function to capture console output temporarily
      function captureConsole() {
        outputBuffer = []; // Reset buffer for new execution

        console.log = function (...args) {
          outputBuffer.push({ type: "log", message: args.join(" "), timestamp: new Date().toLocaleTimeString() });
          originalConsole.log.apply(console, args);
        };
        console.error = function (...args) {
          outputBuffer.push({ type: "error", message: args.join(" "), timestamp: new Date().toLocaleTimeString() });
          originalConsole.error.apply(console, args);
        };
        console.warn = function (...args) {
          outputBuffer.push({ type: "warn", message: args.join(" "), timestamp: new Date().toLocaleTimeString() });
          originalConsole.warn.apply(console, args);
        };
        console.info = function (...args) {
          outputBuffer.push({ type: "info", message: args.join(" "), timestamp: new Date().toLocaleTimeString() });
          originalConsole.info.apply(console, args);
        };

        // Return function to restore console and append output
        return function restoreConsole() {
          // Restore original console methods
          console.log = originalConsole.log;
          console.error = originalConsole.error;
          console.warn = originalConsole.warn;
          console.info = originalConsole.info;

          // Append buffered output to console panel
          outputBuffer.forEach(({ type, message, timestamp }) => {
            let formattedMessage = `[${timestamp}] ${message}`;
            if (type === "error") {
              formattedMessage = `[${timestamp}] ERROR: ${message}`;
            } else if (type === "warn") {
              formattedMessage = `[${timestamp}] WARN: ${message}`;
            } else if (type === "info") {
              formattedMessage = `[${timestamp}] INFO: ${message}`;
            }
            consoleOutputElement.textContent += formattedMessage + "\n";
          });
          consoleOutputElement.scrollTop = consoleOutputElement.scrollHeight; // Auto-scroll to bottom
        };
      }

      // Function to clear the console
      function clearConsole() {
        consoleOutputElement.textContent = "";
      }

      return { captureConsole, clearConsole };
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
        // Set up console capture
        const restoreConsole = consoleCapture.captureConsole();

        // Execute the code
        const script = document.createElement("script");
        script.textContent = `
            (function() {
                try {
                    ${code}
                } catch (e) {
                    console.error(e.message);
                }
            })();
        `;
        script.type = "module";

        document.body.appendChild(script);
        document.body.removeChild(script); // Remove script after execution

        // Restore console and display output
        restoreConsole();
      } catch (error) {
        consoleCapture.clearConsole(); // Clear console on error
        consoleOutput.textContent += `[${new Date().toLocaleTimeString()}] ERROR: Execution error: ${error.message}\n`;
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
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

    const consoleCapture = setupConsoleCapture(consoleOutput); // Initialize console capture

    clearConsoleBtn.addEventListener("click", () => {
      consoleCapture.clearConsole();
    });

    consoleClearBtn.addEventListener("click", () => {
      consoleCapture.clearConsole();
    });

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
        <div class="hydro-editor-custom-modal-content">
          <div class="hydro-editor-custom-modal-header">
            <span>Load Script from URL</span>
            <button class="hydro-editor-custom-modal-close">×</button>
          </div>
          <div class="hydro-editor-custom-modal-body">
            <label>Enter URL:</label>
            <input type="text" class="url-input" placeholder="https://example.com/script.js">
          </div>
          <div class="hydro-editor-custom-modal-footer">
            <button class="hydro-editor-custom-modal-ok">Load</button>
            <button class="hydro-editor-custom-modal-cancel">Cancel</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      const closeModal = () => {
        modal.remove();
      };

      modal.querySelector(".hydro-editor-custom-modal-close").addEventListener("click", closeModal);
      modal.querySelector(".hydro-editor-custom-modal-cancel").addEventListener("click", closeModal);
      modal.querySelector(".hydro-editor-custom-modal-ok").addEventListener("click", () => {
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
        <div class="hydro-editor-custom-modal-content">
          <div class="hydro-editor-custom-modal-header">
            <span>Confirm</span>
            <button class="hydro-editor-custom-modal-close">×</button>
          </div>
          <div class="hydro-editor-custom-modal-body">Are you sure you want to clear the current tab?</div>
          <div class="hydro-editor-custom-modal-footer">
            <button class="hydro-editor-custom-modal-ok">Yes</button>
            <button class="hydro-editor-custom-modal-cancel">No</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      const closeModal = () => {
        modal.remove();
      };

      modal.querySelector(".hydro-editor-custom-modal-close").addEventListener("click", closeModal);
      modal.querySelector(".hydro-editor-custom-modal-cancel").addEventListener("click", closeModal);
      modal.querySelector(".hydro-editor-custom-modal-ok").addEventListener("click", () => {
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
        <div class="hydro-editor-custom-modal-content">
          <div class="hydro-editor-custom-modal-header">
            <span>Confirm</span>
            <button class="hydro-editor-custom-modal-close">×</button>
          </div>
          <div class="hydro-editor-custom-modal-body">Are you sure you want to clear the page content except for the Hydro Editor?</div>
          <div class="hydro-editor-custom-modal-footer">
            <button class="hydro-editor-custom-modal-ok">Yes</button>
            <button class="hydro-editor-custom-modal-cancel">No</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      const closeModal = () => {
        modal.remove();
      };

      modal.querySelector(".hydro-editor-custom-modal-close").addEventListener("click", closeModal);
      modal.querySelector(".hydro-editor-custom-modal-cancel").addEventListener("click", closeModal);
      modal.querySelector(".hydro-editor-custom-modal-ok").addEventListener("click", () => {
        const bodyChildren = Array.from(document.body.children);
        bodyChildren.forEach((child) => {
          if (child !== modal && !child.classList.contains("hydro-editor-modal")) {
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

  createModal();
})();