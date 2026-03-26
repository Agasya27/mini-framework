import { createElement } from '../core/createElement.js';
import { useState, useEffect } from '../framework.js';

const ICON_COPY = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>`;
const ICON_CHECK = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17l-5-5"/></svg>`;

const TABS = {
  createElement: {
    label: 'createElement',
    file: 'core/createElement.js',
    source: `// Creates a virtual DOM node — a plain JS object describing UI
export function createElement(type, props, ...children) {
  return {
    type,          // string ('div') or Function (component)
    props: props || {},
    children: flattenChildren(children),
    key: props?.key ?? null,
  };
}

// Flatten nested arrays, convert primitives to text vnodes
export function flattenChildren(children) {
  return children.flat(Infinity).map(child => {
    if (child === null || child === undefined || child === false) return null;
    if (typeof child === 'string' || typeof child === 'number') {
      return { type: '__text__', value: String(child) };
    }
    return child;
  }).filter(Boolean);
}`,
  },
  useState: {
    label: 'useState',
    file: 'hooks/useState.js',
    source: `// Cursor-based state — mirrors React's rules of hooks exactly
// hookIndex resets to 0 before every render

let hooks = [];
let hookIndex = 0;
let rerenderFn = null;

export function resetHooks() { hookIndex = 0; }
export function setRerenderFn(fn) { rerenderFn = fn; }

export function useState(initialValue) {
  const currentIndex = hookIndex++;

  // Support lazy initializer functions
  if (hooks[currentIndex] === undefined) {
    hooks[currentIndex] = typeof initialValue === 'function'
      ? initialValue()
      : initialValue;
  }

  const setState = (newValue) => {
    const next = typeof newValue === 'function'
      ? newValue(hooks[currentIndex])
      : newValue;
    if (next !== hooks[currentIndex]) {
      hooks[currentIndex] = next;
      rerenderFn?.();
    }
  };

  return [hooks[currentIndex], setState];
}`,
  },
  diff: {
    label: 'diff',
    file: 'core/diff.js',
    source: `// patch(parent, oldVnode, newVnode, index) — minimal DOM mutations

export function patch(parent, oldVnode, newVnode, index = 0) {
  const domNode = parent.childNodes[index];

  if (!oldVnode) { parent.appendChild(render(newVnode)); return; }
  if (!newVnode) { if (domNode) parent.removeChild(domNode); return; }

  // Text node update
  if (oldVnode.type === '__text__' && newVnode.type === '__text__') {
    if (oldVnode.value !== newVnode.value) domNode.textContent = newVnode.value;
    return;
  }

  // Different type — replace entirely
  if (oldVnode.type !== newVnode.type) {
    parent.replaceChild(render(newVnode), domNode); return;
  }

  // Functional component — re-render and diff result
  if (typeof newVnode.type === 'function') {
    const oldResult = oldVnode.__result;
    const newResult = newVnode.type({ ...newVnode.props, children: newVnode.children });
    newVnode.__result = newResult;
    patch(parent, oldResult || oldVnode, newResult, index);
    return;
  }

  // Same element type — diff props and children
  diffProps(domNode, oldVnode.props, newVnode.props);
  const hasKeys = newVnode.children.some(c => c?.key != null);
  hasKeys
    ? keyedReconcile(domNode, oldVnode.children, newVnode.children)
    : positionalReconcile(domNode, oldVnode.children, newVnode.children);
}`,
  },
  router: {
    label: 'router',
    file: 'router/router.js',
    source: `// Client-side router using HTML5 History API
let subscribers = [];

export function initRouter() {
  window.addEventListener('popstate', () => notifySubscribers());
}

export function navigate(path) {
  if (window.location.pathname === path) return;
  history.pushState(null, '', path);
  notifySubscribers();
}

export function getCurrentRoute() {
  return window.location.pathname;
}

export function onRouteChange(callback) {
  subscribers.push(callback);
  // Returns unsubscribe function
  return () => { subscribers = subscribers.filter(s => s !== callback); };
}

function notifySubscribers() {
  subscribers.forEach(fn => fn(getCurrentRoute()));
}`,
  },
};

const ARCH_CARDS = [
  { file: 'core/createElement.js', desc: 'Produces a plain JS object (vnode) describing a UI node — type, props, children, and optional key.', color: 'primary' },
  { file: 'core/renderer.js', desc: 'Converts a vnode tree into real DOM nodes. Handles text, elements, and functional components recursively.', color: 'violet' },
  { file: 'core/diff.js', desc: 'Compares two vnode trees and applies the minimum DOM mutations — positional and key-based reconciliation.', color: 'amber' },
  { file: 'hooks/useState.js', desc: 'Cursor-based state stored in a module-level array. Hook order must stay stable — same constraint as React.', color: 'primary' },
  { file: 'hooks/useEffect.js', desc: 'Queues side effects during render, flushes after DOM update. Tracks deps array, runs cleanup on change.', color: 'violet' },
  { file: 'router/router.js', desc: 'Wraps the History API. pushState on navigate, popstate for back/forward, subscriber pattern for updates.', color: 'amber' },
];

export function About() {
  const [activeTab, setActiveTab] = useState('createElement');
  const [copied, setCopied] = useState(false);

  // Cleanup the timer if we navigate away before 1800ms
  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(id);
  }, [copied]);

  function copyCode() {
    navigator.clipboard?.writeText(TABS[activeTab].source).then(() => {
      setCopied(true);
    });
  }

  const tab = TABS[activeTab];

  return createElement(
    'div',
    { className: 'page page-enter' },

    createElement(
      'h1',
      { className: 'page-title' },
      'How it ',
      createElement('span', { className: 'gradient-text' }, 'Works')
    ),
    createElement(
      'p',
      { className: 'page-subtitle' },
      'Browse the source of each module — no abstraction, no magic.'
    ),

    // Tab bar
    createElement(
      'div',
      { className: 'tab-bar' },
      Object.entries(TABS).map(([key, t]) =>
        createElement(
          'button',
          {
            key,
            className: 'tab-btn' + (activeTab === key ? ' tab-btn--active' : ''),
            onClick: () => setActiveTab(key),
          },
          t.label
        )
      )
    ),

    // Code block with filename + copy button
    createElement(
      'div',
      { className: 'code-block' },
      createElement(
        'div',
        { className: 'code-block__header' },
        createElement('span', { className: 'code-block__filename' }, tab.file),
        createElement(
          'button',
          {
            className: 'code-copy-btn' + (copied ? ' code-copy-btn--done' : ''),
            onClick: copyCode,
          },
          createElement('span', { innerHTML: copied ? ICON_CHECK : ICON_COPY }),
          copied ? 'Copied!' : 'Copy'
        )
      ),
      createElement(
        'pre',
        null,
        createElement('code', null, tab.source)
      )
    ),

    // Architecture section
    createElement('h2', { className: 'arch-title' }, 'Architecture'),
    createElement(
      'div',
      { className: 'arch-grid' },
      ARCH_CARDS.map(card =>
        createElement(
          'div',
          { key: card.file, className: `arch-card arch-card--${card.color}` },
          createElement('div', { className: 'arch-card__file' }, card.file),
          createElement('p', { className: 'arch-card__desc' }, card.desc)
        )
      )
    )
  );
}
