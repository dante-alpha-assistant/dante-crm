import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { fetchOverdueCount } from '../lib/reminders';

export default function Nav() {
  const [overdueCount, setOverdueCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    loadCount();
    // Refresh count every 60 seconds
    const interval = setInterval(loadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  // Refresh count on navigation
  useEffect(() => {
    loadCount();
  }, [location.pathname]);

  async function loadCount() {
    try {
      const count = await fetchOverdueCount();
      setOverdueCount(count);
    } catch (err) {
      console.error('Failed to fetch overdue count:', err);
    }
  }

  function isActive(path) {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  }

  return (
    <nav className="main-nav">
      <div className="nav-brand">
        <Link to="/">Dante CRM</Link>
      </div>
      <div className="nav-links">
        <Link to="/contacts" className={isActive('/contacts') ? 'nav-active' : ''}>
          Contacts
        </Link>
        <Link to="/companies" className={isActive('/companies') ? 'nav-active' : ''}>
          Companies
        </Link>
        <Link to="/reminders" className={`nav-reminders ${isActive('/reminders') ? 'nav-active' : ''}`}>
          Reminders
          {overdueCount > 0 && (
            <span className="nav-badge">{overdueCount}</span>
          )}
        </Link>
      </div>
    </nav>
  );
}
