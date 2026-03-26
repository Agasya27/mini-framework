import { createElement } from '../core/createElement.js';
import { getCurrentRoute, navigate } from '../router/router.js';
import { useState } from '../hooks/useState.js';

// ── Icons ─────────────────────────────────────────────────────────────────────
const LOGO_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`;

const MOON_SVG = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

const SUN_SVG = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;

const MENU_SVG = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;

const CLOSE_SVG = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

const LINKS = [
  { path: '/',       label: 'Home'  },
  { path: '/todos',  label: 'Tasks' },
  { path: '/about',  label: 'Docs'  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export function Navbar() {
  const route = getCurrentRoute();

  // hook 0 — mobile menu
  const [open, setOpen] = useState(false);

  // hook 1 — theme (read from html attribute so it stays in sync with the
  //           inline anti-flash script on page load)
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme || 'dark'
  );

  function go(path) {
    if (open) setOpen(false);
    navigate(path);
  }

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('mini-theme', next);
    setTheme(next);
  }

  const isDark = theme === 'dark';

  return createElement(
    'header',
    { className: 'navbar' },

    // Logo ─────────────────────────────────────────────────────────────────
    createElement(
      'div',
      { className: 'navbar__logo', onClick: () => go('/') },
      createElement('span', { className: 'navbar__logo-icon', innerHTML: LOGO_SVG }),
      'MiniFramework'
    ),

    // Desktop nav links ────────────────────────────────────────────────────
    createElement(
      'nav',
      { className: 'navbar__nav' },
      ...LINKS.map(({ path, label }) =>
        createElement('a', {
          key: path,
          href: path,
          className: 'nav-link' + (route === path ? ' nav-link--active' : ''),
          onClick: (e) => { e.preventDefault(); go(path); },
        }, label)
      )
    ),

    // Right cluster — theme toggle + hamburger ─────────────────────────────
    createElement(
      'div',
      { className: 'navbar__right' },

      // Theme toggle (always visible)
      createElement(
        'button',
        {
          className: 'theme-toggle',
          onClick: toggleTheme,
          title: isDark ? 'Switch to light mode' : 'Switch to dark mode',
        },
        createElement('span', { innerHTML: isDark ? MOON_SVG : SUN_SVG })
      ),

      // Hamburger (mobile only)
      createElement(
        'button',
        {
          className: 'navbar__hamburger',
          onClick: () => setOpen(prev => !prev),
        },
        createElement('span', { innerHTML: open ? CLOSE_SVG : MENU_SVG })
      )
    ),

    // Mobile dropdown ──────────────────────────────────────────────────────
    open ? createElement(
      'div',
      { className: 'mobile-menu' },
      ...LINKS.map(({ path, label }) =>
        createElement('a', {
          key: path,
          href: path,
          className: 'mobile-nav-link' + (route === path ? ' mobile-nav-link--active' : ''),
          onClick: (e) => { e.preventDefault(); go(path); },
        }, label)
      )
    ) : null
  );
}
