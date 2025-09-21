document.addEventListener('DOMContentLoaded', async () => {
  const {
    sites = [],
    modes = [],
    behaviorSmooth = true,
    behaviorPageJump = false,
    behaviorEdgePadding = false,
    behaviorHorizontal = true,
    pageJumpOverlap = 10,
    smoothAcceleration = 0.7,
    smoothMaxSpeed = 25
  } = await chrome.storage.sync.get([
    'sites',
    'modes',
    'behaviorSmooth',
    'behaviorPageJump',
    'behaviorEdgePadding',
    'behaviorHorizontal',
    'pageJumpOverlap',
    'smoothAcceleration',
    'smoothMaxSpeed'
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

  // Helper to setup slider + display
  function setupSlider(sliderId, valueId, value, unit = '') {
    const slider = document.getElementById(sliderId);
    const display = document.getElementById(valueId);
    slider.value = value;
    display.textContent = value + unit;

    slider.addEventListener('input', () => {
      display.textContent = slider.value + unit;
    });
  }

  // Setup all sliders
  setupSlider('overlap-slider', 'overlap-value', pageJumpOverlap, '%');
  setupSlider('acceleration-slider', 'acceleration-value', smoothAcceleration);
  setupSlider('speed-slider', 'speed-value', smoothMaxSpeed);

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
      .filter(Boolean)
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
    pageJumpOverlap: parseInt(document.getElementById('overlap-slider').value, 10),
    smoothAcceleration: parseFloat(document.getElementById('acceleration-slider').value),
    smoothMaxSpeed: parseInt(document.getElementById('speed-slider').value, 10)
  };

  // Save to chrome.storage.sync
  chrome.storage.sync.set(settings, () => {
    const statusDiv = document.getElementById('status');
    if (chrome.runtime.lastError) {
      statusDiv.textContent = '❌ Error: ' + chrome.runtime.lastError.message;
      statusDiv.style.color = '#ef476f';
      statusDiv.style.background = '#ffebee';
    } else {
      statusDiv.textContent = '✅ Settings saved successfully!';
      statusDiv.style.color = '#06d6a0';
      statusDiv.style.background = '#e8f5e9';
    }
    statusDiv.classList.add('show');

    // Auto-hide after 3 seconds
    setTimeout(() => {
      statusDiv.classList.remove('show');
    }, 3000);
  });
});