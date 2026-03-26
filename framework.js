// Public API — re-exports everything and bootstraps the app

import { createElement, flattenChildren } from './core/createElement.js';
import { render, mount, applyProps } from './core/renderer.js';
import { patch, diffProps } from './core/diff.js';
import { useState, resetHooks, setRerenderFn, clearHooks } from './hooks/useState.js';
import { useEffect, flushEffects, cleanupAllEffects } from './hooks/useEffect.js';
import { initRouter, navigate, getCurrentRoute, onRouteChange } from './router/router.js';

export {
  createElement,
  flattenChildren,
  render,
  mount,
  patch,
  useState,
  useEffect,
  navigate,
  getCurrentRoute,
  onRouteChange,
};

export function createApp(rootComponent, container) {
  let oldVnode = null;

  function rerender() {
    resetHooks(); // MUST reset before every render
    const newVnode = rootComponent();

    if (!oldVnode) {
      // First render — mount fresh
      const dom = render(newVnode);
      container.innerHTML = '';
      container.appendChild(dom);
    } else {
      // Subsequent renders — diff and patch
      patch(container, oldVnode, newVnode, 0);
    }

    oldVnode = newVnode;
    flushEffects(); // run side effects after DOM update
  }

  // Wire rerender to useState
  setRerenderFn(rerender);

  // Wire rerender to route changes
  onRouteChange(() => {
    cleanupAllEffects();
    clearHooks();
    oldVnode = null; // force full re-mount on route change
    rerender();
  });

  initRouter();
  rerender(); // initial render
}
