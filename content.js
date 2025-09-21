(async () => {
  // Load all user settings
  const config = await chrome.storage.sync.get([
    'sites', 'modes',
    'behaviorSmooth', 'behaviorPageJump',
    'behaviorEdgePadding', 'behaviorHorizontal',
    'pageJumpOverlap',
    'smoothAcceleration',
    'smoothMaxSpeed'
  ]);

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
  } = config;

  const hostname = window.location.hostname;

  // Check if current site is enabled
  const isSiteEnabled = sites.some(site =>
    hostname === site || hostname.endsWith('.' + site)
  );

  if (!isSiteEnabled) {
    console.log('[WASD/HJKL EXT] Site not matched, skipping:', hostname);
    return;
  }

  console.log('[WASD/HJKL EXT] Matched site:', hostname);
  console.log('[WASD/HJKL EXT] Config:', config);

  // ===== KEY MAPPINGS =====
  const scrollKeys = {};
  if (modes.includes('wasd')) {
    scrollKeys['w'] = [0, -1]; // up
    scrollKeys['s'] = [0, 1];  // down
    if (behaviorHorizontal) {
      scrollKeys['a'] = 'ArrowLeft';
      scrollKeys['d'] = 'ArrowRight';
    }
  }
  if (modes.includes('hjkl')) {
    scrollKeys['k'] = [0, -1]; // up
    scrollKeys['j'] = [0, 1];  // down
    if (behaviorHorizontal) {
      scrollKeys['h'] = 'ArrowLeft';
      scrollKeys['l'] = 'ArrowRight';
    }
  }

  // ===== HELPER: Get scroll boundaries with optional padding =====
  function getScrollLimits() {
    const padding = behaviorEdgePadding ? window.innerHeight * 0.05 : 0; // 5% padding
    return {
      maxScrollY: Math.max(0, document.documentElement.scrollHeight - window.innerHeight - padding),
      minScrollY: padding
    };
  }

  // Clamp scroll position to respect padding
  function clampScroll() {
    const { minScrollY, maxScrollY } = getScrollLimits();
    let y = window.scrollY;

    if (y < minScrollY) window.scrollTo(window.scrollX, minScrollY);
    else if (y > maxScrollY) window.scrollTo(window.scrollX, maxScrollY);
  }

  // ===== PAGE JUMP ENGINE =====
  const pressedJumpKeys = new Set();

  function handlePageJump(key) {
    if (pressedJumpKeys.has(key)) return; // debounce: prevent multiple jumps while holding
    pressedJumpKeys.add(key);

    const direction = scrollKeys[key];
    if (!Array.isArray(direction)) return;

    // Calculate scroll amount with overlap
    const overlapRatio = Math.min(1, Math.max(0, (pageJumpOverlap || 10) / 100)); // clamp 0-100%
    const effectiveHeight = window.innerHeight * (1 - overlapRatio); // e.g., 90% if overlap=10%

    const scrollAmount = direction[1] * effectiveHeight;
    let targetY = window.scrollY + scrollAmount;

    // Apply edge padding if enabled
    if (behaviorEdgePadding) {
      const { minScrollY, maxScrollY } = getScrollLimits();
      targetY = Math.min(Math.max(targetY, minScrollY), maxScrollY);
    } else {
      // Basic document bounds clamp
      const maxScrollY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      targetY = Math.min(Math.max(targetY, 0), maxScrollY);
    }

    // Animate scroll
    window.scrollTo({
      top: targetY,
      behavior: 'smooth'
    });
  }

  // ===== SMOOTH SCROLLING ENGINE =====
  const smoothScrollState = {
    velocity: { x: 0, y: 0 },
    isScrolling: false,
    keys: new Set(),
    animationId: null
  };

  const smoothConfig = {
    acceleration: smoothAcceleration || 0.7,
    maxSpeed: smoothMaxSpeed || 25,
    friction: 0.88,
    threshold: 0.15
  };

  function updateVelocity() {
    smoothScrollState.keys.forEach(key => {
      const move = scrollKeys[key];
      if (Array.isArray(move)) {
        smoothScrollState.velocity.x += move[0] * smoothConfig.acceleration;
        smoothScrollState.velocity.y += move[1] * smoothConfig.acceleration;
      }
    });

    // Cap speed
    const speed = Math.hypot(smoothScrollState.velocity.x, smoothScrollState.velocity.y);
    if (speed > smoothConfig.maxSpeed) {
      const scale = smoothConfig.maxSpeed / speed;
      smoothScrollState.velocity.x *= scale;
      smoothScrollState.velocity.y *= scale;
    }
  }

  function animateSmoothScroll() {
    if (smoothScrollState.keys.size > 0) {
      updateVelocity();
    } else {
      smoothScrollState.velocity.x *= smoothConfig.friction;
      smoothScrollState.velocity.y *= smoothConfig.friction;
    }

    // Stop if negligible
    if (Math.abs(smoothScrollState.velocity.x) < smoothConfig.threshold &&
        Math.abs(smoothScrollState.velocity.y) < smoothConfig.threshold &&
        smoothScrollState.keys.size === 0) {
      smoothScrollState.velocity.x = 0;
      smoothScrollState.velocity.y = 0;
      smoothScrollState.isScrolling = false;
      cancelAnimationFrame(smoothScrollState.animationId);
      return;
    }

    window.scrollBy(smoothScrollState.velocity.x, smoothScrollState.velocity.y);

    // Apply edge padding during smooth scroll
    if (behaviorEdgePadding) {
      clampScroll();
    }

    smoothScrollState.animationId = requestAnimationFrame(animateSmoothScroll);
  }

  function startSmoothScrolling() {
    if (!smoothScrollState.isScrolling) {
      smoothScrollState.isScrolling = true;
      animateSmoothScroll();
    }
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

    // === HANDLE ARROW KEYS (A/D/H/L → ArrowLeft/ArrowRight) ===
    if (typeof action === 'string') {
      e.preventDefault();
      e.stopPropagation(); // Prevent site from handling original key

      const arrowKey = action; // "ArrowLeft" or "ArrowRight"
      const keyCode = arrowKey === 'ArrowLeft' ? 37 : 39;

      // Create and dispatch keydown
      const keydownEvent = new KeyboardEvent('keydown', {
        key: arrowKey,
        code: arrowKey,
        keyCode: keyCode,
        which: keyCode,
        bubbles: true,
        cancelable: true
      });
      document.dispatchEvent(keydownEvent);

      // Dispatch keyup after a tiny delay (mimic real key press)
      setTimeout(() => {
        const keyupEvent = new KeyboardEvent('keyup', {
          key: arrowKey,
          code: arrowKey,
          keyCode: keyCode,
          which: keyCode,
          bubbles: true,
          cancelable: true
        });
        document.dispatchEvent(keyupEvent);
      }, 50); // 50ms delay — feels natural

      return;
    }

    // === HANDLE SCROLL KEYS (W/S/K/J) ===
    e.preventDefault();

    // Page Jump Mode
    if (behaviorPageJump) {
      handlePageJump(e.key.toLowerCase());
    }

    // Smooth Mode
    if (behaviorSmooth) {
      const key = e.key.toLowerCase();
      if (!smoothScrollState.keys.has(key)) {
        smoothScrollState.keys.add(key);
        startSmoothScrolling();
      }
    }
  }

  function handleKeyUp(e) {
    const key = e.key.toLowerCase();
    pressedJumpKeys.delete(key); // release jump key

    if (behaviorSmooth) {
      smoothScrollState.keys.delete(key); // release smooth key
    }
  }

  // ===== INIT & CLEANUP =====
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (smoothScrollState.animationId) {
      cancelAnimationFrame(smoothScrollState.animationId);
    }
  });

  // Initial clamp if edge padding is on
  if (behaviorEdgePadding) {
    clampScroll();
  }

})();