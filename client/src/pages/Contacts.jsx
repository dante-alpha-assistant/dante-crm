import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContacts() {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) setContacts(data || []);
      setLoading(false);
    }
    fetchContacts();
  }, []);

  if (loading) return <p>Loading contacts...</p>;

  return (
    <div className="page">
      <h1>Contacts</h1>
      <Link to="/">← Dashboard</Link>
      {contacts.length === 0 ? (
        <p>No contacts yet. Add your first contact to get started.</p>
      ) : (
        <ul>
          {contacts.map((c) => (
            <li key={c.id}>
              <Link to={`/contacts/${c.id}`} className="contact-link">
                <strong>{c.name}</strong> {c.email && `— ${c.email}`}
                {c.company && ` @ ${c.company}`}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
