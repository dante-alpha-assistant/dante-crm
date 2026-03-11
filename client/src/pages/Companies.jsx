import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCompanies() {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) setCompanies(data || []);
      setLoading(false);
    }
    fetchCompanies();
  }, []);

  if (loading) return <p>Loading companies...</p>;

  return (
    <div className="page">
      <h1>Companies</h1>
      <a href="/">← Dashboard</a>
      {companies.length === 0 ? (
        <p>No companies yet.</p>
      ) : (
        <ul>
          {companies.map((c) => (
            <li key={c.id}>
              <strong>{c.name}</strong> {c.domain && `— ${c.domain}`}
              {c.industry && ` (${c.industry})`}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
