(async () => {
  // Load user settings
  const config = await chrome.storage.sync.get([
    'sites',
    'modes',
    'pageJumpOverlap'
  ]);

  const {
    sites = [],
    modes = [],
    pageJumpOverlap = 10
  } = config;

  const hostname = window.location.hostname;

  // Check if current site is enabled
  const isSiteEnabled = sites.some(site =>
    hostname === site || hostname.endsWith('.' + site)
  );

  if (!isSiteEnabled) {
    console.log('[WASD/HJKL] Site not enabled:', hostname);
    return;
  }

  console.log('[WASD/HJKL] Active on:', hostname);

  // ===== KEY MAPPINGS =====
  const scrollKeys = {};
  if (modes.includes('wasd')) {
    scrollKeys['w'] = 'up';
    scrollKeys['s'] = 'down';
    scrollKeys['a'] = 'prev';
    scrollKeys['d'] = 'next';
  }
  if (modes.includes('hjkl')) {
    scrollKeys['k'] = 'up';
    scrollKeys['j'] = 'down';
    scrollKeys['h'] = 'prev';
    scrollKeys['l'] = 'next';
  }

  // ===== SMART NAVIGATION SYSTEM =====
  const NAV_SELECTORS = {
    next: [
      // Specific manga sites
      'a[title*="next" i]', 'a[aria-label*="next" i]',
      'button[title*="next" i]', 'button[aria-label*="next" i]',
      '.next-chapter', '.next-page', '#next', '.nextchap',
      'a:has(img[alt*="next" i])',
      // Generic patterns
      'a[rel="next"]', 'link[rel="next"]',
      'a[href*="next"]', 'a[href*="/next/"]',
      'a.nav-next', 'a.chapter-next', 'button.next',
      // Image-based navigation
      'a > img[src*="next"]', 'a > img[alt*="next"]',
      // Arrow symbols and text (must check manually)
      'a', 'button'
    ],
    prev: [
      // Specific manga sites
      'a[title*="prev" i]', 'a[title*="previous" i]',
      'a[aria-label*="prev" i]', 'a[aria-label*="previous" i]',
      'button[title*="prev" i]', 'button[aria-label*="prev" i]',
      '.prev-chapter', '.prev-page', '#prev', '.prevchap',
      'a:has(img[alt*="prev" i])',
      // Generic patterns
      'a[rel="prev"]', 'link[rel="prev"]',
      'a[href*="prev"]', 'a[href*="/prev/"]',
      'a.nav-prev', 'a.chapter-prev', 'button.prev',
      // Image-based navigation
      'a > img[src*="prev"]', 'a > img[alt*="prev"]',
      // Arrow symbols and text (must check manually)
      'a', 'button'
    ]
  };

  function findElement(selectors, direction) {
    // First try specific selectors
    for (let i = 0; i < selectors.length - 2; i++) {
      const selector = selectors[i];
      try {
        const element = document.querySelector(selector);
        if (element && isElementVisible(element)) {
          return element;
        }
      } catch (e) {
        continue;
      }
    }
    
    // Last resort: search all links/buttons for text content
    const searchTerms = direction === 'next' 
      ? ['next', '→', '»', '>', 'siguiente', '次']
      : ['prev', 'previous', '←', '«', '<', 'anterior', '前'];
    
    const elements = document.querySelectorAll('a, button');
    for (const el of elements) {
      if (!isElementVisible(el)) continue;
      
      const text = el.textContent.toLowerCase().trim();
      const title = (el.getAttribute('title') || '').toLowerCase();
      const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
      
      for (const term of searchTerms) {
        if (text.includes(term) || title.includes(term) || ariaLabel.includes(term)) {
          return el;
        }
      }
    }
    
    return null;
  }

  function isElementVisible(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return rect.width > 0 && 
           rect.height > 0 && 
           style.display !== 'none' && 
           style.visibility !== 'hidden' &&
           style.opacity !== '0';
  }

  function navigatePage(direction) {
    const selectors = NAV_SELECTORS[direction];
    const element = findElement(selectors, direction);
    
    if (element) {
      console.log(`[WASD/HJKL] Navigating ${direction}:`, element);
      try {
        element.click();
        return true;
      } catch (e) {
        if (element.tagName === 'A' && element.href) {
          window.location.href = element.href;
          return true;
        }
      }
    }
    
    console.warn(`[WASD/HJKL] No ${direction} button found`);
    return false;
  }

  // ===== PAGE JUMP =====
  function jumpPage(direction) {
    // Calculate overlap
    const overlapRatio = Math.min(1, Math.max(0, pageJumpOverlap / 100));
    const effectiveHeight = window.innerHeight * (1 - overlapRatio);
    
    // Calculate scroll amount
    const scrollAmount = direction === 'down' ? effectiveHeight : -effectiveHeight;
    const targetY = window.scrollY + scrollAmount;
    
    // Clamp to document bounds
    const maxScrollY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const finalY = Math.min(Math.max(targetY, 0), maxScrollY);
    
    // Jump instantly - no smooth animation
    window.scrollTo({
      top: finalY,
      behavior: 'instant'
    });
  }

  // ===== EVENT HANDLERS =====
  function handleKeyDown(e) {
    // Ignore if typing in input field
    if (e.target.tagName === 'INPUT' || 
        e.target.tagName === 'TEXTAREA' || 
        e.target.isContentEditable) {
      return;
    }

    const action = scrollKeys[e.key.toLowerCase()];
    if (!action) return;

    e.preventDefault();

    // Handle navigation (A/D or H/L)
    if (action === 'prev' || action === 'next') {
      navigatePage(action);
      return;
    }

    // Handle page jumping (W/S or K/J)
    if (action === 'up' || action === 'down') {
      jumpPage(action);
    }
  }

  // ===== INITIALIZE =====
  document.addEventListener('keydown', handleKeyDown);

  console.log('[WASD/HJKL] Initialized - Page overlap:', pageJumpOverlap + '%');
})();