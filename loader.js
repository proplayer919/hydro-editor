const SCRIPT_URL = 'https://raw.githubusercontent.com/proplayer919/hydro-editor/refs/heads/main/hydro.js';

async function loadAndRunScript() {
  try {
    const response = await fetch(SCRIPT_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch script: ${response.statusText}`);
    }
    const scriptContent = await response.text();
    const scriptElement = document.createElement('script');
    scriptElement.textContent = scriptContent;
    document.body.appendChild(scriptElement);
    console.log('Script loaded and executed successfully.');
  } catch (error) {
    console.error('Error loading script:', error);
  }
}

loadAndRunScript();