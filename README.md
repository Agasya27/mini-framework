# MiniFramework — Vanilla JS Frontend Framework

A fully functional, React-inspired frontend framework built from scratch using only Vanilla JavaScript (ES6+). No external dependencies. No magic. Just clean fundamentals.

## Project Overview

MiniFramework implements every core concept you'd find in a modern frontend library:

- **Virtual DOM** with efficient tree diffing
- **Hooks system** (`useState`, `useEffect`)
- **Functional component** model
- **Client-side router** via the History API
- **Key-based list reconciliation**
- **Declarative event handling**

The project also includes a **premium-quality demo app** — a multi-page Todo application built entirely with the framework.

## Features Implemented

| Feature | Status | Notes |
|---|---|---|
| `createElement` (Virtual DOM) | ✅ | Supports strings, numbers, arrays, nested vnodes |
| DOM renderer | ✅ | Converts vnodes → real DOM nodes |
| Diffing algorithm | ✅ | Patches only what changed |
| Key-based reconciliation | ✅ | Efficient list updates |
| `useState` hook | ✅ | Multiple hooks per component, functional updates |
| `useEffect` hook | ✅ | Dependency array, cleanup functions |
| Functional components | ✅ | Receive props, return vnodes |
| Nested components | ✅ | Full component tree support |
| Event handling | ✅ | `onClick`, `onInput`, `onKeydown`, etc. |
| Client-side router | ✅ | `pushState`, `popstate`, zero page reloads |
| Performance optimization | ✅ | No full re-renders, only patches changed nodes |

## How the Framework Works

### 1. Virtual DOM (`core/createElement.js`)

Instead of touching the real DOM directly, we build a lightweight JavaScript object tree:

```js
createElement('div', { className: 'card' },
  createElement('h1', null, 'Hello'),
  createElement('p', null, 'World')
)
// → { type: 'div', props: { className: 'card' }, children: [...] }
```

### 2. Diffing Algorithm (`core/diff.js`)

The `patch()` function compares old and new vnodes recursively:
- **Same type** → update only changed props, recurse into children
- **Different type** → replace the whole DOM node
- **Text change** → update `textContent`
- **Keyed lists** → map-based reconciliation (reorder without re-creating)

### 3. Hooks System (`hooks/useState.js`)

Each render pass is assigned a **cursor** that increments with each hook call. State is stored in a flat array indexed by call order — the same model React uses internally:

```js
function Counter() {
  const [count, setCount] = useState(0);  // reads from hooks[0]
  const [name, setName] = useState('');   // reads from hooks[1]
  // cursor resets to 0 on next render
}
```

### 4. Client-Side Router (`router/router.js`)

Navigation uses `window.history.pushState()` to change the URL without a page reload. A `popstate` listener handles the browser's back/forward buttons. Route change subscribers trigger re-renders:

```js
navigate('/todos')
// → pushState → notifies listeners → re-renders matched component
```

## Project Structure

```
mini-framework/
├── core/
│   ├── createElement.js   — Virtual DOM node factory
│   ├── renderer.js        — vnode → real DOM conversion
│   └── diff.js            — patch/reconciliation algorithm
├── hooks/
│   ├── useState.js        — state management + re-render trigger
│   └── useEffect.js       — side effects with dependency tracking
├── router/
│   └── router.js          — History API routing
├── components/
│   ├── Navbar.js          — Responsive navigation bar
│   ├── Button.js          — Reusable button component
│   └── TodoItem.js        — Individual todo row
├── pages/
│   ├── Home.js            — Landing page with hero + feature grid
│   ├── Todos.js           — Full todo app (add/delete/complete/filter)
│   └── About.js           — Interactive framework explanation
├── styles/
│   └── global.css         — Complete design system
├── framework.js           — Public API + createApp()
├── main.js                — App entry point
├── index.html             — HTML shell
└── vite.config.js         — Dev server config
```

## Setup & Running

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Then visit `http://localhost:3000/` in your browser.

## Demo App Pages

- **`/`** — Home page with framework overview, feature grid, and CTA
- **`/todos`** — Full todo app: add, complete, delete, filter (All/Active/Completed), persisted to `localStorage`
- **`/about`** — Interactive code walkthrough with tabs for each module

## Design

- Dark theme with indigo accent (`#6366f1`)
- Glassmorphism sticky navbar with backdrop blur
- DM Sans body font + Syne display font (Google Fonts)
- CSS animations on page transitions and todo items
- Fully responsive (mobile + desktop)
