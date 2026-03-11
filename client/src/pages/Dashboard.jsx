export default function Dashboard() {
  return (
    <div className="page">
      <h1>Dante CRM</h1>
      <p>Welcome to your personal CRM.</p>
      <nav>
        <a href="/contacts">Contacts</a>
        {' | '}
        <a href="/companies">Companies</a>
      </nav>
    </div>
  );
}
