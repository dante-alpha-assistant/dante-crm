import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchReminders } from '../lib/reminders';
import ReminderList from '../components/ReminderList';

export default function Reminders() {
  const [tab, setTab] = useState('overdue');
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReminders();
  }, [tab]);

  async function loadReminders() {
    setLoading(true);
    try {
      const data = await fetchReminders(tab);
      setReminders(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  function handleUpdate(updated, id) {
    if (!updated) {
      // Deleted
      setReminders((prev) => prev.filter((r) => r.id !== id));
    } else {
      // Refresh list since filter may change what's visible
      loadReminders();
    }
  }

  return (
    <div className="page">
      <Link to="/">← Dashboard</Link>
      <h1>Reminders</h1>

      <div className="tabs">
        <button
          className={`tab ${tab === 'overdue' ? 'tab-active' : ''}`}
          onClick={() => setTab('overdue')}
        >
          🔴 Overdue
        </button>
        <button
          className={`tab ${tab === 'upcoming' ? 'tab-active' : ''}`}
          onClick={() => setTab('upcoming')}
        >
          🔔 Upcoming (7 days)
        </button>
        <button
          className={`tab ${tab === 'completed' ? 'tab-active' : ''}`}
          onClick={() => setTab('completed')}
        >
          ✅ Completed
        </button>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <ReminderList
          reminders={reminders}
          onUpdate={handleUpdate}
          showContact
        />
      )}
    </div>
  );
}
