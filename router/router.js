// Client-side router using HTML5 History API
// navigate() uses pushState — no page reload
// popstate handles browser back/forward
// Subscribers get notified on every route change

let subscribers = [];
let initialized = false;

export function initRouter() {
  if (initialized) return;
  initialized = true;
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
  return () => { subscribers = subscribers.filter(s => s !== callback); };
}

function notifySubscribers() {
  subscribers.forEach(fn => fn(getCurrentRoute()));
}
