import { createElement } from '../core/createElement.js';

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function TodoItem({ todo, onToggle, onDelete }) {
  return createElement(
    'div',
    {
      key: todo.id,
      className: 'todo-item todo-item--enter',
    },
    createElement(
      'div',
      {
        className: 'todo-checkbox' + (todo.done ? ' todo-checkbox--checked' : ''),
        onClick: () => onToggle(todo.id),
      },
      todo.done ? createElement('span', { className: 'todo-checkmark' }, '✓') : null
    ),
    createElement(
      'span',
      { className: 'todo-text' + (todo.done ? ' todo-text--done' : '') },
      todo.text
    ),
    createElement(
      'span',
      { className: 'todo-date' },
      formatDate(todo.createdAt)
    ),
    createElement(
      'button',
      {
        className: 'todo-delete delete-btn',
        onClick: () => onDelete(todo.id),
      },
      '×'
    )
  );
}
