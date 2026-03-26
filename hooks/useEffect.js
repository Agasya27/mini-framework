// Side effects queued during render, flushed after DOM update
// Tracks dependency arrays — only re-runs if deps changed
// Cleanup runs before next effect or on unmount

let effectQueue = []; // effects registered this render
let prevEffects = []; // effects from last render (for dep comparison)

export function useEffect(callback, deps) {
  const index = effectQueue.length;
  effectQueue.push({
    callback,
    deps,
    prevDeps: prevEffects[index]?.deps,
    cleanup: prevEffects[index]?.cleanup,
  });
}

export function flushEffects() {
  const newEffects = effectQueue.map((effect, i) => {
    const depsChanged = !effect.prevDeps || effect.deps == null ||
      effect.deps.some((d, j) => d !== effect.prevDeps[j]);

    if (depsChanged) {
      // Run cleanup of previous effect
      if (typeof effect.cleanup === 'function') effect.cleanup();
      const cleanup = effect.callback();
      return { deps: effect.deps, cleanup: typeof cleanup === 'function' ? cleanup : null };
    }
    // Deps unchanged — keep previous cleanup
    return { deps: effect.prevDeps, cleanup: effect.cleanup };
  });

  prevEffects = newEffects;
  effectQueue = []; // reset queue for next render
}

export function cleanupAllEffects() {
  prevEffects.forEach(e => { if (typeof e.cleanup === 'function') e.cleanup(); });
  prevEffects = [];
  effectQueue = [];
}
