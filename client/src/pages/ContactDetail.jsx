import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import InteractionTimeline from '../components/InteractionTimeline';
import InteractionForm from '../components/InteractionForm';

export default function ContactDetail() {
  const { id } = useParams();
  const [contact, setContact] = useState(null);
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInteraction, setEditingInteraction] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    setLoading(true);
    const [contactRes, interactionsRes] = await Promise.all([
      supabase.from('contacts').select('*').eq('id', id).single(),
      supabase
        .from('interactions')
        .select('*')
        .eq('contact_id', id)
        .order('occurred_at', { ascending: false }),
    ]);
    if (!contactRes.error) setContact(contactRes.data);
    if (!interactionsRes.error) setInteractions(interactionsRes.data || []);
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

  if (loading) return <p>Loading…</p>;
  if (!contact) return <p>Contact not found. <Link to="/contacts">← Back</Link></p>;

  return (
    <div className="page">
      <Link to="/contacts">← Contacts</Link>

      <div className="contact-header">
        <h1>{contact.name}</h1>
        {contact.email && <p className="contact-meta">{contact.email}</p>}
        {contact.phone && <p className="contact-meta">{contact.phone}</p>}
        {contact.company && <p className="contact-meta">@ {contact.company}</p>}
      </div>

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
