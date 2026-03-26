import { createElement } from '../core/createElement.js';
import { useState, useEffect } from '../framework.js';

// ── SVG Icons ────────────────────────────────────────────────────────────────
const ICON_PLUS = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><path d="M12 5v14M5 12h14"/></svg>`;

const ICON_TRASH = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>`;

const ICON_CHECK = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17l-5-5"/></svg>`;

const ICON_EMPTY = `<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 12l2 2 4-4"/></svg>`;

const ICON_SPARKLE = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.4 2.4-7.4L2 9.4h7.6L12 2z"/></svg>`;

// ── Helpers ──────────────────────────────────────────────────────────────────
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Component ─────────────────────────────────────────────────────────────────
export function Todos() {
  const [todos, setTodos] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mini-todos') || '[]'); }
    catch { return []; }
  });
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    localStorage.setItem('mini-todos', JSON.stringify(todos));
  }, [todos]);

  function addTodo() {
    const text = input.trim();
    if (!text) return;
    setTodos(prev => [
      { id: generateId(), text, done: false, createdAt: new Date().toISOString() },
      ...prev,
    ]);
    setInput('');
  }

  function toggleTodo(id) {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  }

  function deleteTodo(id) {
    setTodos(prev => prev.filter(t => t.id !== id));
  }

  function clearCompleted() {
    setTodos(prev => prev.filter(t => !t.done));
  }

  const total = todos.length;
  const doneCount = todos.filter(t => t.done).length;
  const activeCount = total - doneCount;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const filtered = todos.filter(t => {
    if (filter === 'active') return !t.done;
    if (filter === 'done') return t.done;
    return true;
  });

  return createElement(
    'div',
    { className: 'page page-enter' },

    // ── Header ──────────────────────────────────────────────────────────────
    createElement(
      'div',
      { className: 'todos-header' },
      createElement(
        'div',
        { className: 'todos-header__left' },
        createElement('h1', { className: 'todos-title' }, 'My Tasks'),
        createElement(
          'p',
          { className: 'todos-subtitle' },
          total === 0
            ? 'Nothing here yet — add your first task'
            : `${activeCount} remaining · ${doneCount} completed`
        )
      ),
      total > 0 ? createElement(
        'div',
        { className: 'todos-badge' },
        createElement('span', { className: 'todos-badge__icon', innerHTML: ICON_SPARKLE }),
        doneCount + '/' + total
      ) : null
    ),

    // ── Progress ─────────────────────────────────────────────────────────────
    total > 0 ? createElement(
      'div',
      { className: 'progress-wrap' },
      createElement(
        'div',
        { className: 'progress-track' },
        createElement('div', {
          className: 'progress-fill',
          style: { width: pct + '%' },
        })
      ),
      createElement('span', { className: 'progress-label' }, pct + '% complete')
    ) : null,

    // ── Input ────────────────────────────────────────────────────────────────
    createElement(
      'div',
      { className: 'input-card' },
      createElement(
        'div',
        { className: 'input-row' },
        createElement(
          'div',
          { className: 'input-field-wrap' },
          createElement('span', { className: 'input-icon', innerHTML: ICON_PLUS }),
          createElement('input', {
            className: 'todo-input',
            type: 'text',
            placeholder: 'What needs to be done?',
            value: input,
            onInput: (e) => setInput(e.target.value),
            onKeydown: (e) => { if (e.key === 'Enter') addTodo(); },
          })
        ),
        createElement(
          'button',
          { className: 'btn btn--add', onClick: addTodo },
          createElement('span', { className: 'btn-icon', innerHTML: ICON_PLUS }),
          createElement('span', { className: 'btn-label' }, 'Add Task')
        )
      )
    ),

    // ── Filters ──────────────────────────────────────────────────────────────
    createElement(
      'div',
      { className: 'filter-row' },
      createElement(
        'div',
        { className: 'filter-tabs' },
        FilterTab({ label: 'All', value: 'all', count: total, current: filter, setFilter }),
        FilterTab({ label: 'Active', value: 'active', count: activeCount, current: filter, setFilter }),
        FilterTab({ label: 'Done', value: 'done', count: doneCount, current: filter, setFilter })
      ),
      doneCount > 0 ? createElement(
        'button',
        { className: 'clear-btn', onClick: clearCompleted },
        'Clear done'
      ) : null
    ),

    // ── List + Footer (wrapped in tonal container) ────────────────────────
    createElement(
      'div',
      { className: 'todo-list-wrap' },
      filtered.length > 0
        ? createElement(
            'div',
            { className: 'todo-list' },
            ...filtered.map(todo =>
              createElement(
                'div',
                { key: todo.id, className: 'todo-item' + (todo.done ? ' todo-item--done' : '') },
                // Checkbox
                createElement(
                  'button',
                  {
                    className: 'todo-checkbox' + (todo.done ? ' todo-checkbox--checked' : ''),
                    onClick: () => toggleTodo(todo.id),
                    title: todo.done ? 'Mark incomplete' : 'Mark complete',
                  },
                  todo.done ? createElement('span', { className: 'check-icon', innerHTML: ICON_CHECK }) : null
                ),
                // Body: text + meta row
                createElement(
                  'div',
                  { className: 'todo-item__body' },
                  createElement('span', { className: 'todo-text' }, todo.text),
                  createElement('span', { className: 'todo-meta' }, fmtDate(todo.createdAt))
                ),
                // Delete
                createElement(
                  'button',
                  {
                    className: 'delete-btn',
                    onClick: () => deleteTodo(todo.id),
                    title: 'Delete task',
                  },
                  createElement('span', { innerHTML: ICON_TRASH })
                )
              )
            )
          )
        : EmptyState(filter, total),

      // Footer inside the container
      total > 0 ? createElement(
        'div',
        { className: 'todo-footer' },
        createElement(
          'span',
          { className: 'todo-footer__count' },
          activeCount + ' task' + (activeCount !== 1 ? 's' : '') + ' remaining'
        )
      ) : null
    )
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function FilterTab({ label, value, count, current, setFilter }) {
  const isActive = current === value;
  return createElement(
    'button',
    {
      className: 'filter-tab' + (isActive ? ' filter-tab--active' : ''),
      onClick: () => setFilter(value),
    },
    label,
    createElement('span', { className: 'filter-tab__count' }, String(count))
  );
}

function EmptyState(filter, total) {
  const isFiltered = filter !== 'all' && total > 0;
  return createElement(
    'div',
    { className: 'empty-state' },
    createElement('span', { className: 'empty-state__icon', innerHTML: ICON_EMPTY }),
    createElement(
      'h3',
      { className: 'empty-state__title' },
      isFiltered ? 'Nothing here' : 'Your list is clear'
    ),
    createElement(
      'p',
      { className: 'empty-state__sub' },
      isFiltered
        ? `No ${filter} tasks right now.`
        : 'Add your first task above to get started.'
    )
  );
}
