import { useState, useEffect } from 'react';

const INTERACTION_TYPES = [
  { value: 'call', label: 'Call' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'note', label: 'Note' },
  { value: 'message', label: 'Message' },
];

export default function InteractionForm({ interaction, onSave, onCancel }) {
  const [type, setType] = useState('note');
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');
  const [occurredAt, setOccurredAt] = useState('');

  useEffect(() => {
    if (interaction) {
      setType(interaction.type || 'note');
      setSummary(interaction.summary || '');
      setDetails(interaction.details || '');
      setOccurredAt(
        interaction.occurred_at
          ? new Date(interaction.occurred_at).toISOString().slice(0, 16)
          : ''
      );
    } else {
      setType('note');
      setSummary('');
      setDetails('');
      setOccurredAt(new Date().toISOString().slice(0, 16));
    }
  }, [interaction]);

  function handleSubmit(e) {
    e.preventDefault();
    onSave({
      type,
      summary: summary.trim() || null,
      details: details.trim() || null,
      occurred_at: occurredAt ? new Date(occurredAt).toISOString() : new Date().toISOString(),
    });
  }

  return (
    <form className="interaction-form" onSubmit={handleSubmit}>
      <h3>{interaction ? 'Edit Interaction' : 'New Interaction'}</h3>

      <div className="form-row">
        <label htmlFor="interaction-type">Type</label>
        <select
          id="interaction-type"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {INTERACTION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <label htmlFor="interaction-summary">Summary</label>
        <input
          id="interaction-summary"
          type="text"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Brief summary…"
        />
      </div>

      <div className="form-row">
        <label htmlFor="interaction-details">Details</label>
        <textarea
          id="interaction-details"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={4}
          placeholder="Full details (optional)…"
        />
      </div>

      <div className="form-row">
        <label htmlFor="interaction-date">Date</label>
        <input
          id="interaction-date"
          type="datetime-local"
          value={occurredAt}
          onChange={(e) => setOccurredAt(e.target.value)}
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {interaction ? 'Update' : 'Save'}
        </button>
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
