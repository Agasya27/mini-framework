import { createElement } from '../core/createElement.js';

export function Button({ label, onClick, variant = 'primary' }) {
  return createElement(
    'button',
    {
      className: `btn btn--${variant}`,
      onClick,
    },
    label
  );
}
