document.addEventListener('DOMContentLoaded', async () => {
  const {
    sites = [],
    modes = [],
    pageJumpOverlap = 10
  } = await chrome.storage.sync.get([
    'sites',
    'modes',
    'pageJumpOverlap'
  ]);

  // Populate sites
  document.getElementById('siteList').value = sites.join('\n');

  // Populate modes
  document.getElementById('mode-wasd').checked = modes.includes('wasd');
  document.getElementById('mode-hjkl').checked = modes.includes('hjkl');

  // Setup slider
  const slider = document.getElementById('overlap-slider');
  const display = document.getElementById('overlap-value');
  slider.value = pageJumpOverlap;
  display.textContent = pageJumpOverlap + '%';

  slider.addEventListener('input', () => {
    display.textContent = slider.value + '%';
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
    pageJumpOverlap: parseInt(document.getElementById('overlap-slider').value, 10)
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