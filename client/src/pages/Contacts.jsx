import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../styles/contacts.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);

  // Filters & search
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const limit = 50;

  // Reference data
  const [allTags, setAllTags] = useState([]);
  const [groups, setGroups] = useState([]);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const tagRef = useRef(null);

  // Selection & bulk actions
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState(null); // 'add_to_group' | 'add_tags' | null
  const [bulkGroupId, setBulkGroupId] = useState('');
  const [bulkTagInput, setBulkTagInput] = useState('');
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch tags & groups on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/contacts/tags`)
      .then((r) => r.json())
      .then(setAllTags)
      .catch(() => {});

    fetch(`${API_BASE}/api/groups`)
      .then((r) => r.json())
      .then((data) => setGroups(Array.isArray(data) ? data : data.data || []))
      .catch(() => {});
  }, []);

  // Close tag dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (tagRef.current && !tagRef.current.contains(e.target)) {
        setTagDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Fetch contacts
  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (selectedTags.length) params.set('tags', selectedTags.join(','));
      if (selectedGroup) params.set('group_id', selectedGroup);
      params.set('sort', sortBy);
      params.set('order', sortOrder);
      params.set('page', page);
      params.set('limit', limit);

      const res = await fetch(`${API_BASE}/api/contacts?${params}`);
      const json = await res.json();
      setContacts(json.data || []);
      setTotal(json.total || 0);
      setPages(json.pages || 0);
    } catch {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedTags, selectedGroup, sortBy, sortOrder, page]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Clear selection when data changes
  useEffect(() => {
    setSelectedIds([]);
  }, [contacts]);

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedTags([]);
    setSelectedGroup('');
    setSortBy('created_at');
    setSortOrder('desc');
    setPage(1);
  };

  const hasFilters = debouncedSearch || selectedTags.length > 0 || selectedGroup;

  const handleSort = (col) => {
    if (sortBy === col) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const sortIcon = (col) => {
    if (sortBy !== col) return '↕';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Tag colors
  const tagColors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
    '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
  ];
  const getTagColor = (tag) => tagColors[Math.abs(hashStr(tag)) % tagColors.length];
  function hashStr(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return h;
  }

  // Selection helpers
  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === contacts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(contacts.map((c) => c.id));
    }
  };

  // Bulk actions
  const executeBulkAction = async (action) => {
    if (selectedIds.length === 0) return;
    setBulkProcessing(true);

    try {
      if (action === 'delete') {
        if (!confirm(`Delete ${selectedIds.length} contact(s)? This cannot be undone.`)) {
          setBulkProcessing(false);
          return;
        }
        await fetch(`${API_BASE}/api/contacts/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contact_ids: selectedIds, action: 'delete' }),
        });
        setSelectedIds([]);
        fetchContacts();
      } else if (action === 'add_to_group') {
        setBulkAction('add_to_group');
      } else if (action === 'add_tags') {
        setBulkAction('add_tags');
      }
    } catch {
      // ignore
    }
    setBulkProcessing(false);
  };

  const confirmBulkGroup = async () => {
    if (!bulkGroupId) return;
    setBulkProcessing(true);
    try {
      await fetch(`${API_BASE}/api/contacts/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_ids: selectedIds, action: 'add_to_group', group_id: bulkGroupId }),
      });
      setBulkAction(null);
      setBulkGroupId('');
      setSelectedIds([]);
      fetchContacts();
    } catch {
      // ignore
    }
    setBulkProcessing(false);
  };

  const confirmBulkTags = async () => {
    const tags = bulkTagInput.split(',').map((t) => t.trim()).filter(Boolean);
    if (tags.length === 0) return;
    setBulkProcessing(true);
    try {
      await fetch(`${API_BASE}/api/contacts/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_ids: selectedIds, action: 'add_tags', tags }),
      });
      setBulkAction(null);
      setBulkTagInput('');
      setSelectedIds([]);
      fetchContacts();
      // Refresh tags
      fetch(`${API_BASE}/api/contacts/tags`).then((r) => r.json()).then(setAllTags).catch(() => {});
    } catch {
      // ignore
    }
    setBulkProcessing(false);
  };

  return (
    <div className="page contacts-page">
      <div className="contacts-header">
        <div>
          <Link to="/" className="back-link">← Dashboard</Link>
          <h1>Contacts {!loading && <span className="count">({total})</span>}</h1>
        </div>
        <Link to="/groups" className="btn-nav">Groups →</Link>
      </div>

      {/* Search & Filters Bar */}
      <div className="contacts-toolbar">
        <div className="search-box">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-group" ref={tagRef}>
          <button
            className={`filter-btn ${selectedTags.length ? 'active' : ''}`}
            onClick={() => setTagDropdownOpen((v) => !v)}
          >
            Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
          </button>
          {tagDropdownOpen && (
            <div className="dropdown tag-dropdown">
              {allTags.length === 0 ? (
                <div className="dropdown-empty">No tags yet</div>
              ) : (
                allTags.map((tag) => (
                  <label key={tag} className="dropdown-item">
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag)}
                      onChange={() => toggleTag(tag)}
                    />
                    <span className="tag-chip-sm" style={{ backgroundColor: getTagColor(tag) }}>
                      {tag}
                    </span>
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        <select
          className="filter-select"
          value={selectedGroup}
          onChange={(e) => { setSelectedGroup(e.target.value); setPage(1); }}
        >
          <option value="">All Groups</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>

        {hasFilters && (
          <button className="clear-btn" onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </div>

      {/* Active tag filters */}
      {selectedTags.length > 0 && (
        <div className="active-tags">
          {selectedTags.map((tag) => (
            <span key={tag} className="tag-chip" style={{ backgroundColor: getTagColor(tag) }}>
              {tag}
              <button onClick={() => toggleTag(tag)}>×</button>
            </span>
          ))}
        </div>
      )}

      {/* Bulk action bar */}
      {selectedIds.length > 0 && (
        <div className="bulk-bar">
          <span className="bulk-count">{selectedIds.length} selected</span>
          <button className="bulk-btn" onClick={() => executeBulkAction('add_to_group')} disabled={bulkProcessing}>
            Add to Group
          </button>
          <button className="bulk-btn" onClick={() => executeBulkAction('add_tags')} disabled={bulkProcessing}>
            Add Tags
          </button>
          <button className="bulk-btn bulk-btn-danger" onClick={() => executeBulkAction('delete')} disabled={bulkProcessing}>
            Delete
          </button>
          <button className="bulk-btn-cancel" onClick={() => setSelectedIds([])}>
            Deselect
          </button>
        </div>
      )}

      {/* Bulk action sub-modals */}
      {bulkAction === 'add_to_group' && (
        <div className="bulk-sub-bar">
          <select value={bulkGroupId} onChange={(e) => setBulkGroupId(e.target.value)} className="filter-select">
            <option value="">Select group...</option>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <button className="bulk-btn" onClick={confirmBulkGroup} disabled={!bulkGroupId || bulkProcessing}>
            {bulkProcessing ? 'Adding...' : 'Confirm'}
          </button>
          <button className="bulk-btn-cancel" onClick={() => setBulkAction(null)}>Cancel</button>
        </div>
      )}
      {bulkAction === 'add_tags' && (
        <div className="bulk-sub-bar">
          <input
            type="text"
            className="bulk-tag-input"
            placeholder="Enter tags (comma-separated)"
            value={bulkTagInput}
            onChange={(e) => setBulkTagInput(e.target.value)}
            autoFocus
          />
          <button className="bulk-btn" onClick={confirmBulkTags} disabled={!bulkTagInput.trim() || bulkProcessing}>
            {bulkProcessing ? 'Adding...' : 'Confirm'}
          </button>
          <button className="bulk-btn-cancel" onClick={() => setBulkAction(null)}>Cancel</button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading contacts...</p>
        </div>
      ) : contacts.length === 0 && !hasFilters ? (
        <div className="empty-state">
          <div className="empty-icon">👤</div>
          <h2>No contacts yet</h2>
          <p>Start building your network. Add your first contact to get started.</p>
          <button className="cta-btn">+ Add Contact</button>
        </div>
      ) : contacts.length === 0 && hasFilters ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h2>No results found</h2>
          <p>Try adjusting your search or filters.</p>
          <button className="cta-btn" onClick={clearFilters}>Clear filters</button>
        </div>
      ) : (
        <>
          <div className="contacts-table-wrap">
            <table className="contacts-table">
              <thead>
                <tr>
                  <th className="check-col">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === contacts.length && contacts.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="sortable" onClick={() => handleSort('name')}>
                    Name {sortIcon('name')}
                  </th>
                  <th>Company</th>
                  <th>Role</th>
                  <th>Tags</th>
                  <th className="sortable" onClick={() => handleSort('last_interaction')}>
                    Last Interaction {sortIcon('last_interaction')}
                  </th>
                  <th className="sortable" onClick={() => handleSort('created_at')}>
                    Created {sortIcon('created_at')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <tr key={c.id} className={selectedIds.includes(c.id) ? 'row-selected' : ''}>
                    <td className="check-col">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(c.id)}
                        onChange={() => toggleSelect(c.id)}
                      />
                    </td>
                    <td className="contact-name">
                      <div className="avatar">
                        {c.avatar_url ? (
                          <img src={c.avatar_url} alt="" />
                        ) : (
                          <span>{(c.name || '?')[0].toUpperCase()}</span>
                        )}
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
                        <span
                          key={tag}
                          className="tag-chip"
                          style={{ backgroundColor: getTagColor(tag) }}
                        >
                          {tag}
                        </span>
                      ))}
                    </td>
                    <td>{formatDate(c.last_interaction_at)}</td>
                    <td>{formatDate(c.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                ← Prev
              </button>
              <span>
                Page {page} of {pages}
              </span>
              <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
