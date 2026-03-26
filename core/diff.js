import { render } from './renderer.js';
import { applyProps } from './renderer.js';

// patch(parent, oldVnode, newVnode, index) — applies minimal DOM mutations
export function patch(parent, oldVnode, newVnode, index = 0) {
  const domNode = parent.childNodes[index];

  // CASE 1: New node added — nothing existed before
  if (!oldVnode) {
    parent.appendChild(render(newVnode));
    return;
  }

  // CASE 2: Node removed — nothing exists in new tree
  if (!newVnode) {
    if (domNode) parent.removeChild(domNode);
    return;
  }

  // CASE 3: Text node update
  if (oldVnode.type === '__text__' && newVnode.type === '__text__') {
    if (oldVnode.value !== newVnode.value) {
      if (domNode) domNode.textContent = newVnode.value;
    }
    return;
  }

  // CASE 4: Different type — replace entirely
  if (oldVnode.type !== newVnode.type) {
    if (domNode) parent.replaceChild(render(newVnode), domNode);
    else parent.appendChild(render(newVnode));
    return;
  }

  // CASE 5: Functional component — re-render and diff result
  if (typeof newVnode.type === 'function') {
    const oldResult = oldVnode.__result;
    const newResult = newVnode.type({ ...newVnode.props, children: newVnode.children });
    newVnode.__result = newResult;
    patch(parent, oldResult || oldVnode, newResult, index);
    return;
  }

  // CASE 6: Same element type — diff props and children
  if (domNode) {
    diffProps(domNode, oldVnode.props, newVnode.props);

    // Choose reconciliation strategy based on whether keys are present
    const hasKeys = newVnode.children.some(c => c && c.key != null);
    if (hasKeys) {
      keyedReconcile(domNode, oldVnode.children, newVnode.children);
    } else {
      positionalReconcile(domNode, oldVnode.children, newVnode.children);
    }
  }
}

export function diffProps(el, oldProps, newProps) {
  oldProps = oldProps || {};
  newProps = newProps || {};

  // Remove old props not in new props
  Object.keys(oldProps).forEach(key => {
    if (key === 'key') return;
    if (!(key in newProps)) {
      if (key.startsWith('on')) {
        const event = key.slice(2).toLowerCase();
        if (el.__events?.[event]) {
          el.removeEventListener(event, el.__events[event]);
          delete el.__events[event];
        }
      } else if (key === 'className') {
        el.className = '';
      } else {
        el.removeAttribute(key);
      }
    }
  });

  // Set new or changed props
  Object.entries(newProps).forEach(([key, value]) => {
    if (key === 'key') return;

    if (key === 'className') {
      if (el.className !== value) el.className = value;
      return;
    }
    if (key === 'innerHTML') { if (el.innerHTML !== value) el.innerHTML = value; return; }
    if (key === 'value') { if (el.value !== String(value)) el.value = String(value); return; }
    if (key === 'style' && typeof value === 'object') {
      // Reset style then re-apply
      el.style.cssText = '';
      Object.assign(el.style, value);
      return;
    }
    if (key.startsWith('on') && typeof value === 'function') {
      const event = key.slice(2).toLowerCase();
      if (el.__events?.[event]) el.removeEventListener(event, el.__events[event]);
      el.addEventListener(event, value);
      if (!el.__events) el.__events = {};
      el.__events[event] = value;
      return;
    }
    if (typeof value === 'boolean') {
      if (value) el.setAttribute(key, '');
      else el.removeAttribute(key);
      return;
    }
    if (el.getAttribute(key) !== String(value)) {
      el.setAttribute(key, value);
    }
  });
}

// Positional reconciliation — simple, index-based
function positionalReconcile(parent, oldChildren, newChildren) {
  const max = Math.max(oldChildren.length, newChildren.length);
  for (let i = 0; i < max; i++) {
    patch(parent, oldChildren[i] || null, newChildren[i] || null, i);
  }
}

// Key-based reconciliation — efficient list reordering
// Build a map of key → { vnode, domNode } from old children
// Then reorder/add/remove based on new children's key order
function keyedReconcile(parent, oldChildren, newChildren) {
  const oldKeyMap = new Map();
  oldChildren.forEach((child, i) => {
    if (child?.key != null) {
      oldKeyMap.set(child.key, { vnode: child, dom: parent.childNodes[i] });
    }
  });

  const newDoms = newChildren.map(newChild => {
    if (!newChild) return null;
    const old = oldKeyMap.get(newChild.key);
    if (old) {
      // Patch existing node in place (we'll reorder after)
      diffProps(old.dom, old.vnode.props, newChild.props);
      // Patch children of this node
      const hasKeys = newChild.children.some(c => c && c.key != null);
      if (hasKeys) {
        keyedReconcile(old.dom, old.vnode.children, newChild.children);
      } else {
        positionalReconcile(old.dom, old.vnode.children, newChild.children);
      }
      oldKeyMap.delete(newChild.key);
      return old.dom;
    } else {
      // New key — create fresh
      return render(newChild);
    }
  });

  // Remove nodes with keys no longer in new tree
  oldKeyMap.forEach(({ dom }) => {
    if (dom.parentNode === parent) parent.removeChild(dom);
  });

  // Reorder DOM to match new children order
  newDoms.forEach((dom, i) => {
    if (!dom) return;
    const current = parent.childNodes[i];
    if (current !== dom) {
      parent.insertBefore(dom, current || null);
    }
  });
}
