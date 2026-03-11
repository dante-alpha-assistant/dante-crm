import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <div className="page">
      <h1>Dante CRM</h1>
      <p>Welcome to your personal CRM.</p>
      <nav>
        <Link to="/contacts">Contacts</Link>
        {' | '}
        <Link to="/companies">Companies</Link>
        {' | '}
        <Link to="/groups">Groups</Link>
      </nav>
    </div>
  );
}
