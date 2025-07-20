document.addEventListener('DOMContentLoaded', async () => {
  const { sites = [], modes = [] } = await chrome.storage.sync.get(['sites', 'modes']);
  document.getElementById('siteList').value = sites.join('\n');

  document.getElementById('mode-wasd').checked = modes.includes('wasd');
  document.getElementById('mode-hjkl').checked = modes.includes('hjkl');
});

document.getElementById('save').addEventListener('click', () => {
  const rawInput = document.getElementById('siteList').value;

  const siteList = rawInput
    .split('\n')
    .map(s => {
      try {
        if (!s.match(/^https?:\/\//)) s = 'https://' + s;
        const url = new URL(s);
        return url.hostname;
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  const modes = [];
  if (document.getElementById('mode-wasd').checked) modes.push('wasd');
  if (document.getElementById('mode-hjkl').checked) modes.push('hjkl');

  chrome.storage.sync.set({ sites: siteList, modes });
  alert('Settings saved!');
});
