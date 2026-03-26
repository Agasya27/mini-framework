# MiniFramework — Technical Explanation

## 1. Why Build a Framework From Scratch?

Modern frontend development is dominated by frameworks like React, Vue, and Svelte. They are remarkably powerful, but their power comes at a cost: abstraction. When something goes wrong with a reconciliation bug or a stale closure inside a useEffect, the developer is left staring at a black box. Understanding what actually happens when you call `setState` — how that ripples through a virtual DOM, gets diffed against the previous tree, and results in precisely targeted DOM mutations — is the kind of knowledge that separates engineers who use tools from engineers who understand them.

React itself is not magic. At its core, it is a function that takes a description of UI (the virtual DOM), compares it to the last description it computed, and applies the minimum set of changes to the real DOM. The hooks system is an indexed array with a cursor that resets before every render. The router is the browser's own History API wrapped in a subscriber pattern. None of these ideas are mystical. They are elegant, well-considered engineering decisions that become obvious once you implement them yourself.

This project builds every one of those pieces from scratch — virtual DOM construction, diffing, functional component rendering, cursor-based hooks, side effect scheduling, and SPA routing — in roughly 500 lines of plain JavaScript with zero dependencies. The goal is not to replace React. The goal is to understand it so deeply that React's design choices feel inevitable rather than arbitrary.

---

## 2. Architecture Overview

Every interactive framework fundamentally solves the same problem: how do you keep a piece of UI in sync with mutable state without rewriting the entire DOM on every change? MiniFramework answers that question with a unidirectional data flow that mirrors React's.

```
User Action (click, input)
        │
        ▼
   setState(newValue)
        │
        ▼
  scheduleRender()  ←─── called by setState setter
        │
        ▼
   resetHooks()     ←─── cursor back to zero
        │
        ▼
  rootComponent()   ←─── pure function called fresh
        │ produces
        ▼
   new vnode tree
        │
        ▼
  patch(parent, oldVnode, newVnode)
        │ applies minimal
        ▼
   real DOM mutations
        │
        ▼
  flushEffects()    ←─── runs useEffect callbacks
        │
        ▼
  oldVnode = newVnode  ←─── save for next diff
```

Each step is a pure function or has clearly bounded side effects. `resetHooks` sets an integer to zero. `rootComponent` is a plain JS function. `patch` is a recursive tree walk. `flushEffects` iterates an array. Because each layer has a single responsibility, the whole system is easy to reason about — and to debug — in isolation.

---

## 3. Virtual DOM — How and Why

The real DOM is slow to query and expensive to mutate. More importantly, it is stateful and mutable, which makes it difficult to reason about as a data structure. The virtual DOM sidesteps this by letting you describe UI as a plain JavaScript object tree — a "vnode" — that is cheap to create, cheap to compare, and entirely separate from the browser's rendering machinery.

A vnode produced by `createElement` looks like this:

```js
{
  type: 'div',          // HTML tag name, or a function for components
  props: { className: 'card', onClick: handleClick },
  children: [
    { type: '__text__', value: 'Hello' },
    { type: 'span', props: { className: 'badge' }, children: [...] }
  ],
  key: null             // optional, used for keyed reconciliation
}
```

`createElement` is the entry point. It normalizes the children array by flattening nested arrays (so you can do `[...items].map(...)` inside a component and pass the result as children), converting string and number primitives into text vnodes with `type: '__text__'`, and filtering out `null`, `undefined`, and `false` — which is how conditional rendering like `isLoggedIn && createElement('span', null, 'Welcome')` works cleanly.

The `render` function in `renderer.js` converts a vnode tree into a real DOM tree. For text vnodes it calls `document.createTextNode`. For functional components it calls the component function with its props and recursively renders the result. For element vnodes it calls `document.createElement`, applies each prop (mapping `className`, style objects, event listeners, and boolean attributes to their correct DOM equivalents), then recursively renders and appends each child. This function is only called on the first render of any given node; after that, `patch` takes over and surgically updates existing DOM nodes rather than recreating them.

Event listeners get special treatment: when `applyProps` registers an `onClick` or `onInput`, it also stores the handler reference in `el.__events[eventName]`. This seemingly minor bookkeeping detail is what makes memory-safe event listener replacement possible during diffing. Without it, you would have no way to call `removeEventListener` with the exact same function reference that was originally added.

---

## 4. The Diffing Algorithm — Reconciliation

The diffing algorithm — `patch` in `core/diff.js` — is where the framework earns its keep. Given a parent DOM node, an old vnode, and a new vnode, it applies the minimum set of DOM mutations to bring the real DOM into alignment with the new vnode. It handles six distinct cases.

**Case 1** covers new nodes with no prior vnode: the node is simply created with `render` and appended. **Case 2** covers removed nodes: the corresponding real DOM node is identified by its positional index in the parent's `childNodes` and removed. **Case 3** handles text-node updates: if both vnodes are text nodes and their values differ, `textContent` is set directly — no node is replaced. **Case 4** handles type mismatches: if `oldVnode.type !== newVnode.type` (for example, a `div` became a `span`), the old node is replaced entirely with a freshly rendered new node. **Case 5** handles functional components: the component function is called with the new props to get a result vnode, and `patch` recurses on the result rather than the component vnode itself — this ensures that the underlying DOM element, not the component abstraction, is being diffed. **Case 6** is the most important: when old and new vnodes share the same element type, `diffProps` is called to update only changed attributes and event listeners, and then the children are reconciled.

`diffProps` is a careful two-pass operation. In the first pass it iterates old props and removes any that are absent from the new props — removing event listeners via `removeEventListener` (using the stored `el.__events` reference), clearing class names, and removing attributes. Without this pass, stale event listeners would accumulate silently on DOM nodes across re-renders, and old attributes would never be cleaned up. In the second pass it sets new or changed props, again using `el.__events` to swap out event listeners correctly.

For child reconciliation, the framework uses two strategies. Positional reconciliation is used when no children carry a `key` prop: old and new children are zipped by index and each pair is recursively patched. This works correctly for stable lists but produces incorrect results when items are inserted at the top or reordered, because each position's vnode effectively changes type relative to what was there before. Key-based reconciliation handles this case.

Consider a todo app where you add a new item to the front of the list. Without keys, the diff sees that position 0's vnode changed from `{ id: 'a', text: 'Buy milk' }` to `{ id: 'b', text: 'New task' }`, and patches in place, then sees a new node at position 1. Every existing item gets its DOM node touched unnecessarily. With keys, the algorithm builds a map of `key → { vnode, domNode }` from the old children, then for each new child looks up its key in that map. Matched nodes get their props patched in place; unmatched old nodes are removed; new keys without a match are rendered fresh. After this pass, the DOM nodes are reordered to match the new order using `insertBefore`. The net result is that adding a todo to the top of a 100-item list touches exactly one DOM node — the new one — regardless of list length.

The pseudocode for the key-based algorithm is:

```
build oldKeyMap: key → { vnode, dom }
for each newChild in newChildren:
  if oldKeyMap has newChild.key:
    diffProps(old.dom, old.vnode.props, newChild.props)
    reconcile children of old.dom
    oldKeyMap.delete(newChild.key)
    newDoms.push(old.dom)
  else:
    newDoms.push(render(newChild))   // fresh node
for each { dom } remaining in oldKeyMap:
  parent.removeChild(dom)            // gone from new tree
reorder parent.childNodes to match newDoms order
```

---

## 5. The Hooks System — useState

React's hooks system feels almost magical until you understand the implementation. The magic is a cursor — an integer called `hookIndex` — and an array called `hooks`, both stored at module scope in `useState.js`. Before every render, the framework calls `resetHooks()`, which sets `hookIndex` back to zero. Each call to `useState` inside a component reads the slot at `hooks[hookIndex]`, initializes it if it is undefined (first render only), increments the cursor, and returns the current value and a setter. By the time the component function returns, the cursor has advanced once per `useState` call, carving out a stable, ordered set of slots.

After two `useState` calls inside a component on a second render, the array looks like:

```js
// hooks module-level array — annotated after 2nd render of Todos component
hooks = [
  // index 0 — claimed by: const [todos, setTodos] = useState(...)
  [ { id: 'abc', text: 'Buy milk', done: false, createdAt: '...' } ],

  // index 1 — claimed by: const [input, setInput] = useState('')
  'Buy milk',

  // index 2 — claimed by: const [filter, setFilter] = useState('all')
  'all',
];
hookIndex = 0; // reset, ready for next render
```

This is why the rules of hooks exist. If you call `useState` conditionally — say, only inside an `if` block — the cursor skips a slot on the render where the condition is false. Every subsequent `useState` call reads from the wrong slot, producing corrupted state. The rule "never call hooks inside conditionals or loops" is not a stylistic convention: it is a direct consequence of the cursor mechanism.

The setter returned by `useState` captures `currentIndex` in its closure. When called, it checks whether the new value is a function (supporting the `setState(prev => next)` functional update form that avoids stale closure bugs), compares the result to the current stored value with strict equality, updates the slot if changed, and calls `rerenderFn` — the `rerender` function registered by `createApp`. This triggers the full render cycle again from the top.

---

## 6. useEffect — Side Effects and Cleanup

Components are meant to be pure functions: given the same props and state, they produce the same vnode. But real applications need to interact with the world — fetching data, setting timers, writing to localStorage, subscribing to external events. These are side effects, and they do not belong inside the render function because render must be synchronous and idempotent. `useEffect` provides a designated escape hatch.

During render, `useEffect` calls push descriptors into an `effectQueue` array. After `patch` has completed and the DOM reflects the new vnode, `flushEffects` processes the queue. For each effect it compares the new dependency array to the previous one using shallow (reference) equality. If any dependency changed, or if there is no previous dependency array (first render), or if `deps` was not passed at all, it runs the callback. Before running it, it calls any cleanup function returned by the previous run of that same effect. The cleanup pattern exists to prevent memory leaks and stale closures: if an effect sets a timer or subscribes to a WebSocket, the cleanup cancels the timer or closes the socket before the next version of that effect runs. In the About page, for example, a `useEffect` with `[copied]` as its dependency starts a 1800ms timer whenever `copied` becomes `true`, and returns `() => clearTimeout(id)` as cleanup — ensuring that if the user navigates away before the timer fires, the pending callback does not attempt to call `setCopied` on an unmounted component.

When the route changes, `cleanupAllEffects` is called before the new component tree mounts. This runs every active cleanup function and resets both the `effectQueue` and `prevEffects` arrays. Without this, effects from the previous page would still be holding references and running their callbacks into the next page's lifecycle, causing subtle bugs that are extremely difficult to trace.

---

## 7. The Router

Browsers have had a native API for client-side navigation since HTML5: the History API. `history.pushState(state, title, url)` changes the URL bar and pushes an entry onto the session history stack without issuing a network request. The `popstate` event fires when the user clicks back or forward. These two primitives are sufficient to build a fully functional single-page application router.

`router.js` wraps them in a minimal subscriber pattern. `initRouter` registers the `popstate` listener once. `navigate` calls `pushState` and then calls `notifySubscribers` directly, because `pushState` does not fire `popstate` programmatically — only browser-initiated navigation does. `onRouteChange` pushes a callback into the subscribers array and returns a function that removes it, enabling clean unsubscription. `getCurrentRoute` reads `window.location.pathname`, which always reflects the current URL regardless of how navigation happened.

Route changes trigger a full remount of the component tree rather than an incremental patch. This is a deliberate design choice. Hook state is stored in a flat array indexed by call order. If you navigated from the Todos page (with its three `useState` calls) to the About page (with its two `useState` calls) and tried to reuse hook slots, slot indices would misalign and state would bleed across components. The clean solution is `clearHooks`, `cleanupAllEffects`, and setting `oldVnode = null` so that the next render triggers a fresh `render` call rather than `patch`. It is slightly less efficient than a perfectly tuned incremental approach, but it is correct, simple, and safe.

---

## 8. Component System Design

In MiniFramework, a component is just a function. It takes props, calls hooks if needed, and returns a vnode. There is no class to extend, no lifecycle method to override, no decorator to apply. The renderer determines whether a vnode's `type` is a string (a native HTML element) or a function (a component), and acts accordingly: for functions it calls `vnode.type({ ...vnode.props, children: vnode.children })` and recurses on the result.

This design keeps the diffing algorithm honest. In Case 5 of `patch`, a functional component vnode is handled by calling the function again with the new props and recursively diffing the returned result vnodes. The old result is stored on the vnode object itself as `vnode.__result` during initial render, so that on the next diff pass the algorithm has both the old and new output to compare. The component function is never compared to itself — what matters is the shape of its output. Two renders that produce `{ type: 'div', ... }` will diff the `div` nodes against each other, not recreate them. Components are effectively transparent to the diffing layer.

---

## 9. Event Handling and Memory Management

Every event listener registered through props is stored in a dictionary on the DOM element itself, at `el.__events[eventName]`. This might look like unnecessary bookkeeping, but it solves a real problem: `removeEventListener` only works if you pass it the exact same function reference that was originally passed to `addEventListener`. Since component functions produce new closure instances on every render, the handler reference changes each time. Without storing the original, you would call `removeEventListener` with the new function, have it silently fail, and accumulate a new duplicate listener — a classic memory leak.

`diffProps` uses `el.__events` in two places. When an event prop is present in both old and new vnodes, it removes the old listener before adding the new one. When an event prop exists in the old vnode but is absent from the new one — meaning the event handler was conditionally removed — it removes the listener entirely and deletes the entry from `el.__events`. This ensures that at any point in time, each event name on a given element has at most one active listener, and the framework's total listener count grows only with the size of the live DOM tree, not with the number of renders that have occurred.

---

## 10. Performance Characteristics

MiniFramework is not going to win benchmarks against optimized production frameworks, but its performance profile is sound. It never rebuilds DOM from scratch using `innerHTML = ''` on re-renders (only on initial mount). The `diffProps` function compares attribute values before calling `setAttribute`, and class names before setting `el.className`, avoiding unnecessary style recalculations. The `patch` function terminates each case early with `return` rather than falling through, so the common fast path — a text node value change, or a prop update with no structural change — is inexpensive.

For list rendering, the key-based reconciliation algorithm operates in O(n) time relative to list length for the map-building and DOM-reordering passes, and only touches DOM nodes that actually changed. The `useState` setter includes a strict equality check (`if (next !== hooks[currentIndex])`): if you call `setState` with the same primitive value or the same object reference, no re-render is scheduled. This prevents redundant renders from event handlers that fire on every keystroke but often produce no meaningful state change.

---

## 11. What I Would Add Next

The most impactful next step would be a JSX transform — either a Babel plugin or Vite's built-in JSX pipeline — to replace `createElement('div', { className: 'card' }, ...)` with `<div className="card">...</div>`. The output is identical; the authoring experience is dramatically better. Beyond that, `useMemo` and `useCallback` would allow components to memoize expensive computations and stable function references across renders. A Context API would let deeply nested components read shared state without prop-drilling through every intermediate layer. Server-side rendering would require separating the vnode construction from the DOM-dependent renderer, producing HTML strings on the server and hydrating them on the client. Furthest out is concurrent rendering — interruptible render passes that yield to the browser's event loop, which is the foundation of React 18's features — though this would require a substantially more complex scheduler than the synchronous call stack used here.

---

## 12. Conclusion

Building a framework from scratch is one of the most effective ways to develop genuine intuition about the tools that modern frontend development depends on. Every design decision in MiniFramework — the cursor-based hooks array, the six-case patch function, the `el.__events` dictionary, the full remount on route change — reflects a real tradeoff between simplicity, correctness, and performance. Understanding why these choices were made makes you a better user of React, Vue, or any other framework, because you can reason about what they are doing underneath rather than treating them as oracles. The ~500 lines here are not a toy; they are a working, correct implementation of the ideas that power production applications used by millions of people. The magic was always just engineering.
