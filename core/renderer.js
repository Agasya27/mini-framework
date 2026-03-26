import { createElement } from './createElement.js';

// render(vnode) → real DOM node
export function render(vnode) {
  // Handle text nodes
  if (vnode.type === '__text__') return document.createTextNode(vnode.value);

  // Handle functional components — call them with props, render result
  if (typeof vnode.type === 'function') {
    const result = vnode.type({ ...vnode.props, children: vnode.children });
    const dom = render(result);
    vnode.__result = result;
    return dom;
  }

  const el = document.createElement(vnode.type);

  // Apply props
  applyProps(el, vnode.props);

  // Render and append children
  vnode.children.forEach(child => el.appendChild(render(child)));

  return el;
}

export function mount(vnode, container) {
  container.innerHTML = '';
  container.appendChild(render(vnode));
}

export function applyProps(el, props) {
  Object.entries(props || {}).forEach(([key, value]) => {
    if (key === 'key') return; // internal, not a real DOM prop
    if (key === 'className') { el.className = value; return; }
    if (key === 'style' && typeof value === 'object') {
      Object.assign(el.style, value); return;
    }
    if (key.startsWith('on') && typeof value === 'function') {
      const event = key.slice(2).toLowerCase();
      el.addEventListener(event, value);
      // Store for cleanup during diffing
      if (!el.__events) el.__events = {};
      el.__events[event] = value;
      return;
    }
    if (key === 'innerHTML') { el.innerHTML = value; return; }
    if (key === 'value') { el.value = value; return; }
    if (typeof value === 'boolean') {
      if (value) el.setAttribute(key, '');
      return;
    }
    el.setAttribute(key, value);
  });
}
