# 🔀 Custom WASD/HJKL Navigation Extension

Effortlessly navigate websites using the keyboard layouts you love: **WASD** and **HJKL**.

This extension enables smooth, physics-based scrolling with acceleration, friction, and momentum. It also maps keys like `A/D` or `H/L` to real `ArrowLeft`/`ArrowRight` key events, allowing full interaction with pages that support native arrow navigation.

---

## 🎯 Features

- ✅ Scroll using **WASD** or **HJKL** keys
- ✅ Inertial smooth scrolling (with acceleration and deceleration)
- ✅ True `ArrowLeft` / `ArrowRight` key dispatch for full website compatibility
- ✅ Per-site enablement — only works on domains you specify
- ✅ Enable either **WASD**, **HJKL**, or both
- ✅ Works on subdomains and subpages automatically
- ✅ Lightweight and fast — runs only on matched websites

---

## 🖥️ How It Works

- Hold down `W/S` or `K/J` to scroll up/down with acceleration
- Use `A/D` or `H/L` to simulate real arrow key navigation (for manga readers, slideshows, etc.)
- Friction gradually slows scrolling after release, for a fluid feel

---

## ⚙️ Installation

### 📦 Chrome Web Store

> Coming soon — or manually load:

### 🧪 Manual Install (Chrome / Edge)

1. Clone or download this repository
2. Go to `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked**
5. Select the extension folder

---

## 🛠️ Settings

1. Click the extension icon
2. Enter the list of websites (one per line), e.g.: manga.example.org
3. Tick the box to enable **WASD** and/or **HJKL**
4. Hit **Save**

✅ All subpages and subdomains are supported automatically  
✅ No need to include `https://` or full URLs

---

## 💡 Example Use Cases

- Manga readers and web comics (like [skydemonorder.com](https://skydemonorder.com))
- Slide viewers or presentation tools
- Blogs or article sites where you prefer keyboard navigation
- Vim-style fans who want `hjkl` movement on the web

---

## 📷 Preview

<img src="icons/icon128.png" width="96" alt="Extension Icon">

---

## 📁 Repository Structure

```
custom-wasd-hjkl-extension/
├── manifest.json
├── content.js
├── options.html
├── options.js
└── README.md
```

---

## 🔐 Permissions

- `storage`: Save your enabled sites and preferences
- `activeTab`: Match against current site hostname
- `<all_urls>` (in content script): Allows checking which sites match your list

This extension does **not** track your activity or send any data externally.

---

## 📄 License

MIT License © 2025 Stanley Phoong

---

## 🙌 Credits

Inspired by gamers, Vim users, and anyone who prefers keyboard-centric browsing.

---
