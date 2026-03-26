import { createElement } from '../core/createElement.js';
import { navigate } from '../router/router.js';

// ── Icons ─────────────────────────────────────────────────────────────────────
const ICON_ARROW = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
const ICON_CODE = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`;
const ICON_TASK = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M9 3v4M15 3v4"/><path d="M7 15l2 2 4-4"/></svg>`;
const ICON_CHECK_SM = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17l-5-5"/></svg>`;

const ICON_LAYERS = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`;
const ICON_ZAP = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
const ICON_MAP = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>`;

// ── Todo preview items (static mockup data) ────────────────────────────────────
const PREVIEW_ITEMS = [
  { text: 'Design the virtual DOM tree', done: true,  date: 'Mar 25' },
  { text: 'Build cursor-based hooks',    done: true,  date: 'Mar 26' },
  { text: 'Implement key-based diffing', done: true,  date: 'Mar 26' },
  { text: 'Wire up the SPA router',      done: false, date: 'Mar 27' },
  { text: 'Ship the todo demo app',      done: false, date: 'Mar 27' },
];

// ── Component ─────────────────────────────────────────────────────────────────
export function Home() {
  return createElement(
    'div',
    { className: 'page page-enter' },

    // ── Split hero ──────────────────────────────────────────────────────────
    createElement(
      'section',
      { className: 'hero' },

      // Left — copy
      createElement(
        'div',
        { className: 'hero__left' },

        createElement(
          'h1',
          { className: 'hero__title' },
          'Internals,',
          createElement('br', null),
          createElement('span', { className: 'gradient-text' }, 'from scratch.')
        ),

        createElement(
          'p',
          { className: 'hero__sub' },
          'Virtual DOM diffing, cursor-based hooks, and SPA routing — hand-built in ~500 lines of pure Vanilla JS. No magic. No dependencies. Code you can actually read.'
        ),

        createElement(
          'div',
          { className: 'hero__cta' },
          createElement(
            'button',
            { className: 'btn btn--primary', onClick: () => navigate('/todos') },
            createElement('span', { className: 'btn__icon', innerHTML: ICON_ARROW }),
            'Open Tasks App'
          ),
          createElement(
            'button',
            { className: 'btn btn--ghost', onClick: () => navigate('/about') },
            createElement('span', { className: 'btn__icon', innerHTML: ICON_CODE }),
            'Explore Internals'
          )
        )
      ),

      // Right — Todo app preview panel
      createElement(
        'div',
        { className: 'hero__right' },
        createElement(
          'div',
          { className: 'todo-preview' },

          // ── Top bar ────────────────────────────────────────────────────────
          createElement(
            'div',
            { className: 'todo-preview__topbar' },
            createElement(
              'div',
              { className: 'todo-preview__titlerow' },
              createElement('span', { className: 'todo-preview__icon', innerHTML: ICON_TASK }),
              createElement('span', { className: 'todo-preview__title' }, 'My Tasks')
            ),
            createElement('span', { className: 'todo-preview__badge' }, '3 / 5')
          ),

          // ── Progress bar ───────────────────────────────────────────────────
          createElement(
            'div',
            { className: 'todo-preview__progress' },
            createElement(
              'div',
              { className: 'todo-preview__progress-track' },
              createElement('div', { className: 'todo-preview__progress-fill' })
            ),
            createElement('span', { className: 'todo-preview__progress-label' }, '60% complete')
          ),

          // ── Item list ─────────────────────────────────────────────────────
          createElement(
            'div',
            { className: 'todo-preview__list' },
            ...PREVIEW_ITEMS.map((item, i) =>
              createElement(
                'div',
                { key: String(i), className: 'todo-preview__item' + (item.done ? ' todo-preview__item--done' : '') },
                createElement(
                  'span',
                  { className: 'todo-preview__check' + (item.done ? ' todo-preview__check--done' : ''), innerHTML: item.done ? ICON_CHECK_SM : '' }
                ),
                createElement(
                  'div',
                  { className: 'todo-preview__body' },
                  createElement('span', { className: 'todo-preview__text' }, item.text),
                  createElement('span', { className: 'todo-preview__date' }, item.date)
                )
              )
            )
          ),

          // ── Footer ────────────────────────────────────────────────────────
          createElement(
            'div',
            { className: 'todo-preview__footer' },
            createElement('span', null, '2 tasks remaining'),
            createElement('span', { className: 'todo-preview__clear' }, 'Clear done')
          )
        )
      )
    ),

    // ── Stats bar — full-bleed editorial strip ──────────────────────────────
    createElement(
      'div',
      { className: 'stats-bar' },
      createElement(
        'div',
        { className: 'stats-bar__item' },
        createElement('div', { className: 'stats-bar__num' }, '0'),
        createElement('div', { className: 'stats-bar__label' }, 'Dependencies')
      ),
      createElement('div', { className: 'stats-bar__divider' }),
      createElement(
        'div',
        { className: 'stats-bar__item' },
        createElement('div', { className: 'stats-bar__num' }, '~500'),
        createElement('div', { className: 'stats-bar__label' }, 'Lines of Code')
      ),
      createElement('div', { className: 'stats-bar__divider' }),
      createElement(
        'div',
        { className: 'stats-bar__item' },
        createElement('div', { className: 'stats-bar__num' }, '6'),
        createElement('div', { className: 'stats-bar__label' }, 'Core Modules')
      )
    ),

    // ── Section label ──────────────────────────────────────────────────────
    createElement(
      'div',
      { className: 'section-header' },
      createElement('p', { className: 'section-eyebrow' }, 'What\'s inside'),
      createElement('h2', { className: 'section-title' }, 'Every piece, hand-rolled'),
      createElement(
        'p',
        { className: 'section-sub' },
        'Nothing imported. No abstraction to hide behind. Just clean, readable modules.'
      )
    ),

    // ── Feature grid ──────────────────────────────────────────────────────
    createElement(
      'div',
      { className: 'feature-grid' },
      FeatureCard({
        iconHtml: ICON_LAYERS,
        color: 'indigo',
        title: 'Virtual DOM',
        desc: 'createElement() builds plain JS object trees. render() converts them to real DOM. patch() diffs two trees and applies the minimum mutations — O(n).',
        tag: 'core/diff.js',
        delay: 0,
      }),
      FeatureCard({
        iconHtml: ICON_ZAP,
        color: 'violet',
        title: 'Hooks',
        desc: 'useState stores state in a cursor-indexed array — same ordering rule as React. useEffect queues after DOM updates with full dependency tracking and cleanup.',
        tag: 'hooks/useState.js',
        delay: 60,
      }),
      FeatureCard({
        iconHtml: ICON_MAP,
        color: 'purple',
        title: 'SPA Router',
        desc: 'History API pushState with a subscriber pattern. Zero page reloads, correct back/forward, route-based re-mount — under 40 lines of code.',
        tag: 'router/router.js',
        delay: 120,
      })
    ),

    // ── CTA band ──────────────────────────────────────────────────────────
    createElement(
      'div',
      { className: 'cta-band' },
      createElement(
        'div',
        { className: 'cta-band__text' },
        createElement('h3', { className: 'cta-band__title' }, 'Experience zero abstraction overhead.'),
        createElement(
          'p',
          { className: 'cta-band__sub' },
          'A full CRUD todo app — persistence, filters, animations — all running on this framework.'
        )
      ),
      createElement(
        'button',
        { className: 'btn btn--primary', onClick: () => navigate('/todos') },
        createElement('span', { className: 'btn__icon', innerHTML: ICON_ARROW }),
        'Open Tasks App'
      )
    )
  );
}

function FeatureCard({ iconHtml, color, title, desc, tag, delay }) {
  return createElement(
    'div',
    {
      className: `feature-card feature-card--${color}`,
      style: { animationDelay: `${delay}ms` },
    },
    createElement(
      'div',
      { className: 'feature-card__top' },
      createElement('div', { className: 'feature-card__icon', innerHTML: iconHtml }),
      createElement('span', { className: 'feature-card__tag' }, tag)
    ),
    createElement('h3', { className: 'feature-card__title' }, title),
    createElement('p', { className: 'feature-card__desc' }, desc)
  );
}
