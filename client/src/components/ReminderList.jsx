import { useState } from 'react';
import { updateReminder, deleteReminder } from '../lib/reminders';
import { Link } from 'react-router-dom';

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function isOverdue(reminder) {
  if (reminder.completed_at) return false;
  const now = new Date();
  if (reminder.snoozed_until && new Date(reminder.snoozed_until) > now) return false;
  return new Date(reminder.due_at) < now;
}

function isSnoozed(reminder) {
  if (reminder.completed_at) return false;
  return reminder.snoozed_until && new Date(reminder.snoozed_until) > new Date();
}

export default function ReminderList({ reminders, onUpdate, showContact = false }) {
  const [snoozeId, setSnoozeId] = useState(null);
  const [customDate, setCustomDate] = useState('');

  async function markDone(id) {
    const updated = await updateReminder(id, { completed_at: new Date().toISOString() });
    onUpdate(updated, id);
  }

  async function handleSnooze(id, snooze) {
    const updated = await updateReminder(id, { snooze });
    setSnoozeId(null);
    setCustomDate('');
    onUpdate(updated, id);
  }

  async function handleDelete(id) {
    await deleteReminder(id);
    onUpdate(null, id);
  }

  async function handleCustomSnooze(id) {
    if (!customDate) return;
    await handleSnooze(id, new Date(customDate).toISOString());
  }

  if (!reminders.length) {
    return <p className="empty-state">No reminders</p>;
  }

  return (
    <div className="reminder-list">
      {reminders.map((r) => (
        <div
          key={r.id}
          className={`reminder-item ${isOverdue(r) ? 'reminder-overdue' : ''} ${isSnoozed(r) ? 'reminder-snoozed' : ''} ${r.completed_at ? 'reminder-done' : ''}`}
        >
          <div className="reminder-row">
            <span className="reminder-icon">
              {r.completed_at ? '✅' : isOverdue(r) ? '🔴' : isSnoozed(r) ? '💤' : '🔔'}
            </span>
            <div className="reminder-content">
              <span className="reminder-title">{r.title}</span>
              {showContact && r.contacts && (
                <Link to={`/contacts/${r.contacts.id}`} className="reminder-contact">
                  {r.contacts.name}
                </Link>
              )}
              <span className="reminder-due">
                Due: {formatDate(r.due_at)}
                {isSnoozed(r) && (
                  <span className="reminder-snooze-info"> · Snoozed until {formatDate(r.snoozed_until)}</span>
                )}
              </span>
            </div>
            {!r.completed_at && (
              <div className="reminder-actions">
                <button className="btn btn-sm btn-primary" onClick={() => markDone(r.id)}>
                  Done
                </button>
                <button className="btn btn-sm" onClick={() => setSnoozeId(snoozeId === r.id ? null : r.id)}>
                  Snooze
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(r.id)}>
                  ✕
                </button>
              </div>
            )}
          </div>
          {snoozeId === r.id && (
            <div className="snooze-options">
              <button className="btn btn-sm" onClick={() => handleSnooze(r.id, 'tomorrow')}>
                Tomorrow
              </button>
              <button className="btn btn-sm" onClick={() => handleSnooze(r.id, 'next_week')}>
                Next Week
              </button>
              <div className="snooze-custom">
                <input
                  type="datetime-local"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                />
                <button className="btn btn-sm" onClick={() => handleCustomSnooze(r.id)}>
                  Set
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
