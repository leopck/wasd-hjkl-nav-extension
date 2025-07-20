(async () => {
  const { sites = [], modes = [] } = await chrome.storage.sync.get(['sites', 'modes']);
  const hostname = window.location.hostname;

  if (!sites.some(site => hostname === site || hostname.endsWith('.' + site))) {
    console.log('[WASD/HJKL EXT] Site not matched, skipping:', hostname);
    return;
  }

  console.log('[WASD/HJKL EXT] Matched site:', hostname);
  console.log('[WASD/HJKL EXT] Enabled modes:', modes);

  const scrollKeys = {
    wasd: { w: [0, -1], s: [0, 1] },
    hjkl: { k: [0, -1], j: [0, 1] }
  };

  // Combine vertical scroll keys from both modes
  const verticalKeys = {};
  modes.forEach(mode => {
    if (scrollKeys[mode]) {
      Object.assign(verticalKeys, scrollKeys[mode]);
    }
  });

  // Smooth scrolling state
  const scrollState = {
    velocity: { x: 0, y: 0 },
    isScrolling: false,
    keys: new Set(),
    animationId: null
  };

  // Configuration
  const config = {
    acceleration: 0.5,    // How quickly speed builds up
    maxSpeed: 20,         // Maximum scroll speed
    friction: 0.9,        // How quickly scrolling stops (0.9 = smooth, 0.7 = quick stop)
    threshold: 0.1        // Minimum velocity before stopping
  };

  function updateVelocity() {
    // Apply acceleration based on pressed keys
    scrollState.keys.forEach(key => {
      const move = verticalKeys[key];
      if (move) {
        scrollState.velocity.x += move[0] * config.acceleration;
        scrollState.velocity.y += move[1] * config.acceleration;
      }
    });

    // Cap maximum speed
    const speed = Math.sqrt(scrollState.velocity.x ** 2 + scrollState.velocity.y ** 2);
    if (speed > config.maxSpeed) {
      const scale = config.maxSpeed / speed;
      scrollState.velocity.x *= scale;
      scrollState.velocity.y *= scale;
    }
  }

  function animateScroll() {
    if (scrollState.keys.size > 0) {
      updateVelocity();
    } else {
      // Apply friction when no keys pressed
      scrollState.velocity.x *= config.friction;
      scrollState.velocity.y *= config.friction;
    }

    // Stop if velocity is too small
    if (Math.abs(scrollState.velocity.x) < config.threshold && 
        Math.abs(scrollState.velocity.y) < config.threshold && 
        scrollState.keys.size === 0) {
      scrollState.velocity.x = 0;
      scrollState.velocity.y = 0;
      scrollState.isScrolling = false;
      cancelAnimationFrame(scrollState.animationId);
      return;
    }

    // Apply the scroll
    window.scrollBy(scrollState.velocity.x, scrollState.velocity.y);

    // Continue animation
    scrollState.animationId = requestAnimationFrame(animateScroll);
  }

  function startScrolling() {
    if (!scrollState.isScrolling) {
      scrollState.isScrolling = true;
      animateScroll();
    }
  }

  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)
      return;

    // Trigger real arrow keys for horizontal navigation
    if (modes.includes('wasd') && e.key === 'a' || modes.includes('hjkl') && e.key === 'h') {
      e.preventDefault();
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'ArrowLeft',
        code: 'ArrowLeft',
        keyCode: 37,
        which: 37,
        bubbles: true
      }));
      return;
    }

    if (modes.includes('wasd') && e.key === 'd' || modes.includes('hjkl') && e.key === 'l') {
      e.preventDefault();
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        code: 'ArrowRight',
        keyCode: 39,
        which: 39,
        bubbles: true
      }));
      return;
    }

    // Handle vertical scrolling
    if (verticalKeys[e.key] && !scrollState.keys.has(e.key)) {
      e.preventDefault();
      scrollState.keys.add(e.key);
      startScrolling();
    }
  });

  document.addEventListener('keyup', (e) => {
    if (verticalKeys[e.key]) {
      scrollState.keys.delete(e.key);
    }
  });

  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    if (scrollState.animationId) {
      cancelAnimationFrame(scrollState.animationId);
    }
  });
})();