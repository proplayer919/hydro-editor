import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.19/+esm';

// Constants
const isSchoolLink = window.location.hostname.includes('1v1.school');
const searchSize = 300;
const threshold = 4.5;

// Settings
const settings = {
  aimbot: false,
  aimbotSpeed: 0.15,
  esp: true,
  wireframe: true,
  showHelp() {
    dialogEl.style.display = dialogEl.style.display === '' ? 'none' : '';
  }
};

// GUI
function initGui() {
  const gui = new GUI();
  const controllers = {};
  for (const key in settings) {
    controllers[key] = gui.add(settings, key).name(fromCamel(key)).listen();
  }
  controllers.aimbotSpeed.min(0.05).max(0.5).step(0.01);
}

// Utility Functions
function fromCamel(text) {
  const result = text.replace(/([A-Z])/g, ' $1');
  return result.charAt(0).toUpperCase() + result.slice(1);
}

function showMsg(name, bool) {
  msgEl.innerText = `${name}: ${bool ? 'ON' : 'OFF'}`;
  msgEl.style.display = 'none';
  void msgEl.offsetWidth;
  msgEl.style.display = '';
}

// DOM Setup
let dialogEl, msgEl, rangeEl;

function setupDom() {
  const el = document.createElement('div');
  el.innerHTML = `
        <style>
            .dialog {
                position: absolute;
                left: 50%;
                top: 50%;
                padding: 20px;
                background: #1e294a;
                color: #fff;
                transform: translate(-50%, -50%);
                text-align: center;
                z-index: 999999;
                font-family: sans-serif;
            }
            .dialog * {
                color: #fff;
            }
            .close {
                position: absolute;
                right: 5px;
                top: 5px;
                width: 20px;
                height: 20px;
                opacity: 0.5;
                cursor: pointer;
            }
            .close:before, .close:after {
                content: ' ';
                position: absolute;
                left: 50%;
                top: 50%;
                width: 100%;
                height: 20%;
                transform: translate(-50%, -50%) rotate(-45deg);
                background: #fff;
            }
            .close:after {
                transform: translate(-50%, -50%) rotate(45deg);
            }
            .close:hover {
                opacity: 1;
            }
            .msg {
                position: absolute;
                left: 10px;
                top: 10px;
                background: #1e294a;
                color: #fff;
                font-family: sans-serif;
                font-weight: bolder;
                padding: 15px;
                animation: msg 0.5s forwards, msg 0.5s reverse forwards 3s;
                z-index: 999999;
                pointer-events: none;
            }
            @keyframes msg {
                from { transform: translate(-120%, 0); }
                to { transform: none; }
            }
            .range {
                position: absolute;
                left: 50%;
                top: 50%;
                width: ${searchSize}px;
                height: ${searchSize}px;
                max-width: 100%;
                max-height: 100%;
                border: 1px solid white;
                transform: translate(-50%, -50%);
            }
            .range-active {
                border: 2px solid red;
            }
        </style>
        <div class="dialog" style="display: none;">
            <div class="close" onclick="this.parentNode.style.display='none';"></div>
            <big>1v1.LOL Aimbot, ESP & Wireframe</big>
            <br><br>
            [T] to toggle aimbot<br>
            [M] to toggle ESP<br>
            [N] to toggle wireframe<br>
            [H] to show/hide help<br>
            [/] to show/hide control panel
        </div>
        <div class="msg" style="display: none;"></div>
        <div class="range" style="display: none;"></div>
    `;
  while (el.children.length > 0) {
    document.body.appendChild(el.children[0]);
  }
  dialogEl = document.querySelector('.dialog');
  msgEl = document.querySelector('.msg');
  rangeEl = document.querySelector('.range');
}

// WebGL Proxies
const WebGL = WebGL2RenderingContext.prototype;

function setupWebGLProxies() {
  // Proxy for getContext
  HTMLCanvasElement.prototype.getContext = new Proxy(HTMLCanvasElement.prototype.getContext, {
    apply(target, thisArgs, args) {
      if (args[1]) {
        args[1].preserveDrawingBuffer = true;
      }
      return Reflect.apply(...arguments);
    }
  });

  // Proxy for shaderSource
  WebGL.shaderSource = new Proxy(WebGL.shaderSource, {
    apply(target, thisArgs, args) {
      let [shader, src] = args;
      if (src.includes('gl_Position')) {
        if (src.includes('OutlineEnabled')) {
          shader.isPlayerShader = true;
        }
        src = src.replace('void main', `
                    out float vDepth;
                    uniform bool enabled;
                    uniform float threshold;
                    void main
                `).replace('return;', `
                    vDepth = gl_Position.z;
                    if (enabled && vDepth > threshold) {
                        gl_Position.z = 1.0;
                    }
                `);
      } else if (src.includes('SV_Target0')) {
        src = src.replace('void main', `
                    in float vDepth;
                    uniform bool enabled;
                    uniform float threshold;
                    void main
                `).replace('return;', `
                    if (enabled && vDepth > threshold) {
                        SV_Target0 = vec4(1.0, 0.0, 0.0, 1.0);
                    }
                `);
      }
      args[1] = src;
      return Reflect.apply(...arguments);
    }
  });

  // Proxy for attachShader
  WebGL.attachShader = new Proxy(WebGL.attachShader, {
    apply(target, thisArgs, [program, shader]) {
      if (shader.isPlayerShader) program.isPlayerProgram = true;
      return Reflect.apply(...arguments);
    }
  });

  // Proxy for getUniformLocation
  WebGL.getUniformLocation = new Proxy(WebGL.getUniformLocation, {
    apply(target, thisArgs, [program, name]) {
      const result = Reflect.apply(...arguments);
      if (result) {
        result.name = name;
        result.program = program;
      }
      return result;
    }
  });

  // Proxy for uniform4fv
  WebGL.uniform4fv = new Proxy(WebGL.uniform4fv, {
    apply(target, thisArgs, [uniform]) {
      const name = uniform && uniform.name;
      if (name === 'hlslcc_mtx4x4unity_ObjectToWorld' || name === 'hlslcc_mtx4x4unity_ObjectToWorld[0]') {
        uniform.program.isUIProgram = true;
      }
      return Reflect.apply(...arguments);
    }
  });

  // Proxy for drawElements and drawElementsInstanced
  let movementX = 0, movementY = 0, count = 0, gl;
  const handler = {
    apply(target, thisArgs, args) {
      const program = thisArgs.getParameter(thisArgs.CURRENT_PROGRAM);
      if (!program.uniforms) {
        program.uniforms = {
          enabled: thisArgs.getUniformLocation(program, 'enabled'),
          threshold: thisArgs.getUniformLocation(program, 'threshold')
        };
      }
      const couldBePlayer = (isSchoolLink || program.isPlayerProgram) && args[1] > 3000;
      program.uniforms.enabled && thisArgs.uniform1i(program.uniforms.enabled, (settings.esp || settings.aimbot) && couldBePlayer);
      program.uniforms.threshold && thisArgs.uniform1f(program.uniforms.threshold, threshold);
      args[0] = settings.wireframe && !program.isUIProgram && args[1] > 6 ? thisArgs.LINES : args[0];
      if (couldBePlayer) {
        gl = thisArgs;
      }
      return Reflect.apply(...arguments);
    }
  };
  WebGL.drawElements = new Proxy(WebGL.drawElements, handler);
  WebGL.drawElementsInstanced = new Proxy(WebGL.drawElementsInstanced, handler);

  // Proxy for requestAnimationFrame
  window.requestAnimationFrame = new Proxy(window.requestAnimationFrame, {
    apply(target, thisArgs, args) {
      args[0] = new Proxy(args[0], {
        apply() {
          update();
          return Reflect.apply(...arguments);
        }
      });
      return Reflect.apply(...arguments);
    }
  });

  // Update function for aimbot
  function update() {
    const isPlaying = document.querySelector('canvas').style.cursor === 'none';
    rangeEl.style.display = isPlaying && settings.aimbot ? '' : 'none';

    if (settings.aimbot && gl) {
      const width = Math.min(searchSize, gl.canvas.width);
      const height = Math.min(searchSize, gl.canvas.height);
      const pixels = new Uint8Array(width * height * 4);
      const centerX = gl.canvas.width / 2;
      const centerY = gl.canvas.height / 2;
      const x = Math.floor(centerX - width / 2);
      const y = Math.floor(centerY - height / 2);
      gl.readPixels(x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i] === 255 && pixels[i + 1] === 0 && pixels[i + 2] === 0 && pixels[i + 3] === 255) {
          const idx = i / 4;
          const dx = idx % width;
          const dy = (idx - dx) / width;
          movementX += (x + dx - centerX);
          movementY += -(y + dy - centerY);
          count++;
        }
      }
    }

    if (count > 0 && isPlaying) {
      const f = settings.aimbotSpeed / count;
      movementX *= f;
      movementY *= f;
      window.dispatchEvent(new MouseEvent('mousemove', { movementX, movementY }));
      rangeEl.classList.add('range-active');
    } else {
      rangeEl.classList.remove('range-active');
    }

    movementX = 0;
    movementY = 0;
    count = 0;
    gl = null;
  }
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  setupDom();
  initGui();
  setupWebGLProxies();
});

// Key Events
window.addEventListener('keyup', (event) => {
  if (document.activeElement && document.activeElement.value !== undefined) return;

  const keyToSetting = {
    'KeyM': 'esp',
    'KeyN': 'wireframe',
    'KeyT': 'aimbot'
  };

  if (keyToSetting[event.code]) {
    settings[keyToSetting[event.code]] = !settings[keyToSetting[event.code]];
    showMsg(fromCamel(keyToSetting[event.code]), settings[keyToSetting[event.code]]);
  }

  switch (event.code) {
    case 'KeyH':
      settings.showHelp();
      break;
    case 'Slash':
      document.querySelector('.lil-gui').classList.toggle('hidden');
      break;
  }
});