// Cursor-based state — mirrors React's rules of hooks exactly
// hookIndex resets to 0 before every render
// Each useState call claims one slot in the hooks array

let hooks = [];
let hookIndex = 0;
let rerenderFn = null; // set by framework.js

export function resetHooks() { hookIndex = 0; }
export function setRerenderFn(fn) { rerenderFn = fn; }

export function useState(initialValue) {
  const currentIndex = hookIndex++;

  // Initialise slot if first render — support lazy initializer functions
  if (hooks[currentIndex] === undefined) {
    hooks[currentIndex] = typeof initialValue === 'function' ? initialValue() : initialValue;
  }

  const setState = (newValue) => {
    const next = typeof newValue === 'function' ? newValue(hooks[currentIndex]) : newValue;
    if (next !== hooks[currentIndex]) {
      hooks[currentIndex] = next;
      rerenderFn?.(); // trigger re-render
    }
  };

  return [hooks[currentIndex], setState];
}

export function clearHooks() { hooks = []; hookIndex = 0; }
