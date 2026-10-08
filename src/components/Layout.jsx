// Shows the menu, the current page, and short messages.
import { NavLink, Outlet } from 'react-router-dom';
import { useLibrary } from '../context/LibraryContext.jsx';
import { Toast } from './uiComponents.jsx';

// These links take visitors to the main parts of the library app.
const NAV_ITEMS = [
  { index: '01', label: 'Dashboard', to: '/', end: true },
  { index: '02', label: 'Book Management', to: '/books', staffOnly: true },
  // Staff record stock here; members use it to borrow books.
  { index: '03', label: 'Transactions', to: '/transactions' },
  { index: '04', label: 'Online Books', to: '/online' },
  { index: '05', label: 'Membership', to: '/members' },
];

export default function Layout() {
  const { isAuthenticated, isStaff } = useLibrary();

  // Signed-out visitors only see Membership.
  const items = !isAuthenticated
    ? NAV_ITEMS.filter((item) => item.to === '/members')
    : NAV_ITEMS.filter((item) => !item.staffOnly || isStaff);

  return (
    <div className="app-shell">
      <nav className="sidebar" aria-label="Main navigation">
        <div className="brand">
          <div className="brand-row">
            <img className="brand-logo" src={`${import.meta.env.BASE_URL}logo-mark.svg`} alt="Lesotho Community Library crest" />
            <div className="brand-text">
              <span className="brand-mark">Lesotho Library Community</span>
              <span className="brand-sub">
                {isAuthenticated ? 'Catalog & Circulation' : 'Please log in to continue'}
              </span>
            </div>
          </div>
        </div>

        <ul className="nav-list">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-tab${isActive ? ' active' : ''}`}
              >
                <span className="tab-index">{item.index}</span>
                <span>
                  {!isAuthenticated && item.to === '/members' ? 'Log In / Sign Up' : item.label}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="sidebar-foot">
          <span>&copy; 2026 Lesotho Community Library. All rights reserved</span>
        </div>
      </nav>

      <main className="main">
        {/* The selected page appears here. */}
        <Outlet />
      </main>

      <Toast />
    </div>
  );
}
