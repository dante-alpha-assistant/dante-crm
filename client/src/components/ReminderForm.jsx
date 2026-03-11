import { useState } from 'react';

export default function ReminderForm({ onSave, onCancel }) {
  const [title, setTitle] = useState('');
  const [dueAt, setDueAt] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !dueAt) return;
    onSave({ title: title.trim(), due_at: new Date(dueAt).toISOString() });
    setTitle('');
    setDueAt('');
  }

  return (
    <form className="interaction-form" onSubmit={handleSubmit}>
      <h3>New Reminder</h3>
      <div className="form-row">
        <label>Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Follow up about proposal…"
          required
        />
      </div>
      <div className="form-row">
        <label>Due Date & Time</label>
        <input
          type="datetime-local"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
          required
        />
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary">Save Reminder</button>
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
