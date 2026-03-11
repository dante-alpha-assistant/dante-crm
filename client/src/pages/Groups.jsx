import { useEffect, useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import '../styles/groups.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

const GROUP_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
  '#a855f7', '#d946ef',
];

function GroupModal({ group, onSave, onClose }) {
  const [name, setName] = useState(group?.name || '');
  const [color, setColor] = useState(group?.color || GROUP_COLORS[0]);
  const [description, setDescription] = useState(group?.description || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await onSave({ name: name.trim(), color, description: description.trim() || null });
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{group ? 'Edit Group' : 'New Group'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Investors, Friends, Mentors"
              autoFocus
            />
          </div>
          <div className="form-field">
            <label>Color</label>
            <div className="color-picker">
              {GROUP_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-swatch ${color === c ? 'selected' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
          <div className="form-field">
            <label>Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this group for?"
              rows={2}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={!name.trim() || saving}>
              {saving ? 'Saving...' : group ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddMembersModal({ groupId, existingMemberIds, onClose, onAdded }) {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/contacts?limit=100&search=${encodeURIComponent(search)}`)
      .then((r) => r.json())
      .then((json) => {
        const available = (json.data || []).filter(
          (c) => !existingMemberIds.includes(c.id)
        );
        setContacts(available);
      })
      .catch(() => setContacts([]))
      .finally(() => setLoading(false));
  }, [search, existingMemberIds]);

  const toggleContact = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAdd = async () => {
    if (selected.length === 0) return;
    setAdding(true);
    try {
      await fetch(`${API_BASE}/api/groups/${groupId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_ids: selected }),
      });
      onAdded();
    } catch {
      // ignore
    }
    setAdding(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <h2>Add Members</h2>
        <div className="search-box modal-search">
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className="member-list">
          {loading ? (
            <div className="loading-state"><div className="spinner" /><p>Loading...</p></div>
          ) : contacts.length === 0 ? (
            <div className="dropdown-empty">No contacts found</div>
          ) : (
            contacts.map((c) => (
              <label key={c.id} className="member-item">
                <input
                  type="checkbox"
                  checked={selected.includes(c.id)}
                  onChange={() => toggleContact(c.id)}
                />
                <div className="member-info">
                  <div className="avatar-sm">
                    {c.avatar_url ? <img src={c.avatar_url} alt="" /> : <span>{(c.name || '?')[0].toUpperCase()}</span>}
                  </div>
                  <div>
                    <strong>{c.name}</strong>
                    {c.email && <span className="member-email">{c.email}</span>}
                  </div>
                </div>
              </label>
            ))
          )}
        </div>
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            disabled={selected.length === 0 || adding}
            onClick={handleAdd}
          >
            {adding ? 'Adding...' : `Add ${selected.length} contact${selected.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);

  const fetchGroup = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/groups/${id}`);
      const data = await res.json();
      setGroup(data);
    } catch {
      setGroup(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchGroup(); }, [fetchGroup]);

  const handleUpdateGroup = async (body) => {
    await fetch(`${API_BASE}/api/groups/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setEditModal(false);
    fetchGroup();
  };

  const handleRemoveMember = async (contactId) => {
    await fetch(`${API_BASE}/api/groups/${id}/members/${contactId}`, { method: 'DELETE' });
    fetchGroup();
  };

  const handleBulkRemove = async () => {
    if (selectedMembers.length === 0) return;
    await fetch(`${API_BASE}/api/groups/${id}/members/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact_ids: selectedMembers }),
    });
    setSelectedMembers([]);
    fetchGroup();
  };

  const handleDeleteGroup = async () => {
    if (!confirm('Delete this group? Members will not be deleted.')) return;
    await fetch(`${API_BASE}/api/groups/${id}`, { method: 'DELETE' });
    navigate('/groups');
  };

  const toggleMember = (mid) => {
    setSelectedMembers((prev) =>
      prev.includes(mid) ? prev.filter((x) => x !== mid) : [...prev, mid]
    );
  };

  const toggleAllMembers = () => {
    if (!group) return;
    if (selectedMembers.length === group.members.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(group.members.map((m) => m.id));
    }
  };

  if (loading) {
    return <div className="page groups-page"><div className="loading-state"><div className="spinner" /><p>Loading group...</p></div></div>;
  }

  if (!group) {
    return <div className="page groups-page"><p>Group not found.</p><Link to="/groups">← Back to Groups</Link></div>;
  }

  const members = group.members || [];

  return (
    <div className="page groups-page">
      <div className="group-detail-header">
        <div>
          <Link to="/groups" className="back-link">← Groups</Link>
          <div className="group-title-row">
            <span className="group-dot-lg" style={{ backgroundColor: group.color || '#6366f1' }} />
            <h1>{group.name}</h1>
            <span className="count">({members.length})</span>
          </div>
          {group.description && <p className="group-desc">{group.description}</p>}
        </div>
        <div className="group-detail-actions">
          <button className="btn-secondary" onClick={() => setEditModal(true)}>Edit</button>
          <button className="btn-primary" onClick={() => setAddModal(true)}>+ Add Members</button>
          <button className="btn-danger" onClick={handleDeleteGroup}>Delete</button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedMembers.length > 0 && (
        <div className="bulk-bar">
          <span>{selectedMembers.length} selected</span>
          <button className="btn-secondary btn-sm" onClick={handleBulkRemove}>Remove from Group</button>
          <button className="btn-secondary btn-sm" onClick={() => setSelectedMembers([])}>Deselect</button>
        </div>
      )}

      {members.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h2>No members yet</h2>
          <p>Add contacts to this group to organize your network.</p>
          <button className="cta-btn" onClick={() => setAddModal(true)}>+ Add Members</button>
        </div>
      ) : (
        <div className="contacts-table-wrap">
          <table className="contacts-table">
            <thead>
              <tr>
                <th className="check-col">
                  <input
                    type="checkbox"
                    checked={selectedMembers.length === members.length && members.length > 0}
                    onChange={toggleAllMembers}
                  />
                </th>
                <th>Name</th>
                <th>Company</th>
                <th>Role</th>
                <th>Tags</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((c) => (
                <tr key={c.id} className={selectedMembers.includes(c.id) ? 'row-selected' : ''}>
                  <td className="check-col">
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(c.id)}
                      onChange={() => toggleMember(c.id)}
                    />
                  </td>
                  <td className="contact-name">
                    <div className="avatar">
                      {c.avatar_url ? <img src={c.avatar_url} alt="" /> : <span>{(c.name || '?')[0].toUpperCase()}</span>}
                    </div>
                    <div>
                      <strong>{c.name}</strong>
                      {c.email && <div className="email">{c.email}</div>}
                    </div>
                  </td>
                  <td>{c.company || '—'}</td>
                  <td>{c.role || '—'}</td>
                  <td className="tags-cell">
                    {(c.tags || []).map((tag) => (
                      <span key={tag} className="tag-chip" style={{ backgroundColor: '#6366f1' }}>{tag}</span>
                    ))}
                  </td>
                  <td>
                    <button className="btn-text btn-danger-text" onClick={() => handleRemoveMember(c.id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editModal && <GroupModal group={group} onSave={handleUpdateGroup} onClose={() => setEditModal(false)} />}
      {addModal && (
        <AddMembersModal
          groupId={id}
          existingMemberIds={members.map((m) => m.id)}
          onClose={() => setAddModal(false)}
          onAdded={() => { setAddModal(false); fetchGroup(); }}
        />
      )}
    </div>
  );
}

export default function Groups() {
  const { id } = useParams();
  if (id) return <GroupDetail />;
  return <GroupsList />;
}

function GroupsList() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/groups`);
      const data = await res.json();
      setGroups(Array.isArray(data) ? data : []);
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const handleCreate = async (body) => {
    await fetch(`${API_BASE}/api/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setShowModal(false);
    fetchGroups();
  };

  return (
    <div className="page groups-page">
      <div className="contacts-header">
        <div>
          <Link to="/" className="back-link">← Dashboard</Link>
          <h1>Groups</h1>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ New Group</button>
      </div>

      {loading ? (
        <div className="loading-state"><div className="spinner" /><p>Loading groups...</p></div>
      ) : groups.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📂</div>
          <h2>No groups yet</h2>
          <p>Create groups to organize your contacts — Investors, Friends, Mentors, Clients.</p>
          <button className="cta-btn" onClick={() => setShowModal(true)}>+ Create Group</button>
        </div>
      ) : (
        <div className="groups-grid">
          {groups.map((g) => (
            <Link to={`/groups/${g.id}`} key={g.id} className="group-card">
              <div className="group-card-header">
                <span className="group-dot" style={{ backgroundColor: g.color || '#6366f1' }} />
                <h3>{g.name}</h3>
              </div>
              {g.description && <p className="group-card-desc">{g.description}</p>}
              <div className="group-card-footer">
                <span>{g.member_count || 0} member{(g.member_count || 0) !== 1 ? 's' : ''}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && <GroupModal onSave={handleCreate} onClose={() => setShowModal(false)} />}
    </div>
  );
}
