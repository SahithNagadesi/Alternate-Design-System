import { Outlet, Link, useLocation } from 'react-router-dom';

export default function App() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/cases', label: 'Cases' },
    { path: '/cases/new', label: 'Create Case' },
  ];

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">ADS 2</h1>
        <nav className="app-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
