document.addEventListener('DOMContentLoaded', async () => {
  const {
    sites = [],
    modes = [],
    behaviorSmooth = true,
    behaviorPageJump = false,
    behaviorEdgePadding = false,
    behaviorHorizontal = true,
    pageJumpOverlap = 10
  } = await chrome.storage.sync.get([
    'sites',
    'modes',
    'behaviorSmooth',
    'behaviorPageJump',
    'behaviorEdgePadding',
    'behaviorHorizontal',
    'pageJumpOverlap'
  ]);

  // Populate sites
  document.getElementById('siteList').value = sites.join('\n');

  // Populate modes
  document.getElementById('mode-wasd').checked = modes.includes('wasd');
  document.getElementById('mode-hjkl').checked = modes.includes('hjkl');

  // Populate behaviors
  document.getElementById('behavior-smooth').checked = behaviorSmooth;
  document.getElementById('behavior-pagejump').checked = behaviorPageJump;
  document.getElementById('behavior-edgepadding').checked = behaviorEdgePadding;
  document.getElementById('behavior-horizontal').checked = behaviorHorizontal;

  // Populate overlap slider
  const slider = document.getElementById('overlap-slider');
  const valueDisplay = document.getElementById('overlap-value');
  slider.value = pageJumpOverlap;
  valueDisplay.textContent = pageJumpOverlap + '%';

  // Update display when slider moves
  slider.addEventListener('input', () => {
    valueDisplay.textContent = slider.value + '%';
  });
});

document.getElementById('save').addEventListener('click', () => {
  const rawInput = document.getElementById('siteList').value;

  // Parse and normalize site list
  const siteSet = new Set(
    rawInput
      .split('\n')
      .map(s => s.trim())
      .filter(s => s)
      .map(s => {
        try {
          if (!s.match(/^https?:\/\//i)) s = 'https://' + s;
          const url = new URL(s);
          return url.hostname;
        } catch {
          console.warn('Invalid URL:', s);
          return null;
        }
      })
      .filter(Boolean) // remove nulls
  );

  // Collect selected modes
  const modes = [];
  if (document.getElementById('mode-wasd').checked) modes.push('wasd');
  if (document.getElementById('mode-hjkl').checked) modes.push('hjkl');

  // Collect all settings
  const settings = {
    sites: [...siteSet],
    modes,
    behaviorSmooth: document.getElementById('behavior-smooth').checked,
    behaviorPageJump: document.getElementById('behavior-pagejump').checked,
    behaviorEdgePadding: document.getElementById('behavior-edgepadding').checked,
    behaviorHorizontal: document.getElementById('behavior-horizontal').checked,
    pageJumpOverlap: parseInt(document.getElementById('overlap-slider').value, 10)
  };

  // Save to chrome.storage.sync
  chrome.storage.sync.set(settings, () => {
    const statusDiv = document.getElementById('status');
    if (chrome.runtime.lastError) {
      statusDiv.textContent = '❌ Error: ' + chrome.runtime.lastError.message;
      statusDiv.style.color = 'red';
      statusDiv.style.background = '#ffebee';
    } else {
      statusDiv.textContent = '✅ Settings saved successfully!';
      statusDiv.style.color = 'green';
      statusDiv.style.background = '#e8f5e9';
      // Auto-hide after 3 seconds
      setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.style.background = 'none';
      }, 3000);
    }
  });
});