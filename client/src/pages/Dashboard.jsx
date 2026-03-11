import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchReminders } from '../lib/reminders';
import ReminderList from '../components/ReminderList';

export default function Dashboard() {
  const [overdue, setOverdue] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const [overdueData, upcomingData] = await Promise.all([
        fetchReminders('overdue'),
        fetchReminders('upcoming'),
      ]);
      setOverdue(overdueData);
      setUpcoming(upcomingData);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  function handleUpdate() {
    loadDashboard();
  }

  return (
    <div className="page">
      <h1>Dashboard</h1>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <>
          {overdue.length > 0 && (
            <section className="dashboard-section">
              <h2>🔴 Overdue Reminders ({overdue.length})</h2>
              <ReminderList reminders={overdue} onUpdate={handleUpdate} showContact />
            </section>
          )}

          <section className="dashboard-section">
            <h2>🔔 Upcoming (7 days)</h2>
            {upcoming.length > 0 ? (
              <ReminderList reminders={upcoming} onUpdate={handleUpdate} showContact />
            ) : (
              <p className="empty-state">No upcoming reminders</p>
            )}
          </section>

          <div className="dashboard-links">
            <Link to="/reminders" className="btn">View All Reminders →</Link>
          </div>
        </>
      )}
    </div>
  );
}
