import { createElement } from './core/createElement.js';
import { createApp, getCurrentRoute, navigate } from './framework.js';
import { Navbar } from './components/Navbar.js';
import { Home } from './pages/Home.js';
import { Todos } from './pages/Todos.js';
import { About } from './pages/About.js';

function NotFound() {
  return createElement(
    'div',
    { className: 'page page-enter', style: { textAlign: 'center', paddingTop: '4rem' } },
    createElement('h1', { className: 'page-title' }, '404'),
    createElement('p', { className: 'page-subtitle' }, 'Page not found.'),
    createElement(
      'button',
      { className: 'btn btn--primary', style: { marginTop: '1.5rem' }, onClick: () => navigate('/') },
      'Go Home'
    )
  );
}

function App() {
  const route = getCurrentRoute();

  let page;
  if (route === '/todos') page = createElement(Todos, null);
  else if (route === '/about') page = createElement(About, null);
  else if (route === '/' || route === '') page = createElement(Home, null);
  else page = createElement(NotFound, null);

  return createElement(
    'div',
    null,
    createElement(Navbar, null),
    createElement(
      'main',
      { className: 'page-wrapper' },
      page
    ),
    createElement(
      'footer',
      { className: 'footer' },
      createElement('span', null, '⚡ MiniFramework v1.0'),
      createElement('span', null, 'Built with pure Vanilla JS · Zero dependencies')
    )
  );
}

createApp(App, document.getElementById('app'));
