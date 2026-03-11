import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { fetchReminders, createReminder } from '../lib/reminders';
import InteractionTimeline from '../components/InteractionTimeline';
import InteractionForm from '../components/InteractionForm';
import ReminderForm from '../components/ReminderForm';
import ReminderList from '../components/ReminderList';

export default function ContactDetail() {
  const { id } = useParams();
  const [contact, setContact] = useState(null);
  const [interactions, setInteractions] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [editingInteraction, setEditingInteraction] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    setLoading(true);
    const [contactRes, interactionsRes, remindersData] = await Promise.all([
      supabase.from('contacts').select('*').eq('id', id).single(),
      supabase
        .from('interactions')
        .select('*')
        .eq('contact_id', id)
        .order('occurred_at', { ascending: false }),
      fetchReminders(null, id),
    ]);
    if (!contactRes.error) setContact(contactRes.data);
    if (!interactionsRes.error) setInteractions(interactionsRes.data || []);
    setReminders(remindersData || []);
    setLoading(false);
  }

  async function handleSave(interaction) {
    if (editingInteraction) {
      const { data, error } = await supabase
        .from('interactions')
        .update(interaction)
        .eq('id', editingInteraction.id)
        .select()
        .single();
      if (!error) {
        setInteractions((prev) =>
          prev.map((i) => (i.id === data.id ? data : i))
        );
      }
    } else {
      const { data, error } = await supabase
        .from('interactions')
        .insert({ ...interaction, contact_id: id })
        .select()
        .single();
      if (!error) {
        setInteractions((prev) => [data, ...prev]);
      }
    }
    setShowForm(false);
    setEditingInteraction(null);
  }

  async function handleDelete(interactionId) {
    const { error } = await supabase
      .from('interactions')
      .delete()
      .eq('id', interactionId);
    if (!error) {
      setInteractions((prev) => prev.filter((i) => i.id !== interactionId));
    }
  }

  function handleEdit(interaction) {
    setEditingInteraction(interaction);
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingInteraction(null);
  }

  async function handleReminderSave(reminder) {
    try {
      const created = await createReminder(id, reminder);
      setReminders((prev) => [...prev, created]);
      setShowReminderForm(false);
    } catch (err) {
      console.error(err);
    }
  }

  function handleReminderUpdate(updated, reminderId) {
    if (!updated) {
      setReminders((prev) => prev.filter((r) => r.id !== reminderId));
    } else {
      setReminders((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );
    }
  }

  if (loading) return <p>Loading…</p>;
  if (!contact) return <p>Contact not found. <Link to="/contacts">← Back</Link></p>;

  const pendingReminders = reminders.filter((r) => !r.completed_at);
  const completedReminders = reminders.filter((r) => r.completed_at);

  return (
    <div className="page">
      <Link to="/contacts">← Contacts</Link>

      <div className="contact-header">
        <h1>{contact.name}</h1>
        {contact.email && <p className="contact-meta">{contact.email}</p>}
        {contact.phone && <p className="contact-meta">{contact.phone}</p>}
        {contact.company && <p className="contact-meta">@ {contact.company}</p>}
      </div>

      {/* Reminders Section */}
      <div className="reminders-section">
        <div className="interactions-header">
          <h2>🔔 Reminders {pendingReminders.length > 0 && `(${pendingReminders.length})`}</h2>
          <button
            className="btn btn-primary"
            onClick={() => setShowReminderForm(!showReminderForm)}
          >
            + Add Reminder
          </button>
        </div>

        {showReminderForm && (
          <ReminderForm
            onSave={handleReminderSave}
            onCancel={() => setShowReminderForm(false)}
          />
        )}

        <ReminderList reminders={pendingReminders} onUpdate={handleReminderUpdate} />

        {completedReminders.length > 0 && (
          <details className="completed-reminders">
            <summary>Completed ({completedReminders.length})</summary>
            <ReminderList reminders={completedReminders} onUpdate={handleReminderUpdate} />
          </details>
        )}
      </div>

      {/* Interactions Section */}
      <div className="interactions-section">
        <div className="interactions-header">
          <h2>Interactions</h2>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingInteraction(null);
              setShowForm(true);
            }}
          >
            + Add Interaction
          </button>
        </div>

        {showForm && (
          <InteractionForm
            interaction={editingInteraction}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}

        <InteractionTimeline
          interactions={interactions}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
