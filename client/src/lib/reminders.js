const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function fetchReminders(filter, contactId) {
  const params = new URLSearchParams();
  if (filter) params.set('filter', filter);
  if (contactId) params.set('contact_id', contactId);
  const res = await fetch(`${API}/api/reminders?${params}`);
  if (!res.ok) throw new Error('Failed to fetch reminders');
  return res.json();
}

export async function fetchOverdueCount() {
  const res = await fetch(`${API}/api/reminders/counts`);
  if (!res.ok) throw new Error('Failed to fetch counts');
  const data = await res.json();
  return data.overdue;
}

export async function createReminder(contactId, reminder) {
  const res = await fetch(`${API}/api/contacts/${contactId}/reminders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reminder),
  });
  if (!res.ok) throw new Error('Failed to create reminder');
  return res.json();
}

export async function updateReminder(id, updates) {
  const res = await fetch(`${API}/api/reminders/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update reminder');
  return res.json();
}

export async function deleteReminder(id) {
  const res = await fetch(`${API}/api/reminders/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete reminder');
}
