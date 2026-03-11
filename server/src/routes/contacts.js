import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

// List contacts with search, filter, sort, pagination
router.get('/', async (req, res, next) => {
  try {
    const {
      search,
      tags,       // comma-separated tag names
      group_id,
      sort = 'created_at',
      order = 'desc',
      page = 1,
      limit = 50,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * pageSize;

    // Allowed sort columns
    const sortColumns = {
      name: 'name',
      last_interaction: 'last_interaction_at',
      created: 'created_at',
      created_at: 'created_at',
    };
    const sortCol = sortColumns[sort] || 'created_at';
    const ascending = order === 'asc';

    // If filtering by group, we need to join through contact_group_members
    let contactIds = null;
    if (group_id) {
      const { data: members, error: groupErr } = await supabase
        .from('contact_group_members')
        .select('contact_id')
        .eq('group_id', group_id);
      if (groupErr) throw groupErr;
      contactIds = members.map((m) => m.contact_id);
      if (contactIds.length === 0) {
        return res.json({ data: [], total: 0, page: pageNum, limit: pageSize, pages: 0 });
      }
    }

    // Build the query — select contacts with latest interaction date
    let query = supabase
      .from('contacts')
      .select('*, interactions(occurred_at)', { count: 'exact' });

    // Full-text search across name, email, company, notes
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(
        `name.ilike.${term},email.ilike.${term},company.ilike.${term},notes.ilike.${term}`
      );
    }

    // Filter by tags (contacts must have ALL specified tags)
    if (tags) {
      const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);
      if (tagList.length > 0) {
        query = query.contains('tags', tagList);
      }
    }

    // Filter by group membership
    if (contactIds) {
      query = query.in('id', contactIds);
    }

    // Sort
    query = query.order(sortCol, { ascending });

    // Pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    // Compute last_interaction_at from the nested interactions
    const contacts = (data || []).map((c) => {
      const interactions = c.interactions || [];
      let lastInteractionAt = null;
      if (interactions.length > 0) {
        lastInteractionAt = interactions.reduce((latest, i) => {
          return i.occurred_at > latest ? i.occurred_at : latest;
        }, interactions[0].occurred_at);
      }
      const { interactions: _unused, ...rest } = c;
      return { ...rest, last_interaction_at: lastInteractionAt };
    });

    // If sorting by last_interaction, sort in JS (Supabase can't sort by nested)
    if (sort === 'last_interaction') {
      contacts.sort((a, b) => {
        const aDate = a.last_interaction_at || '';
        const bDate = b.last_interaction_at || '';
        return ascending ? aDate.localeCompare(bDate) : bDate.localeCompare(aDate);
      });
    }

    const total = count || 0;
    res.json({
      data: contacts,
      total,
      page: pageNum,
      limit: pageSize,
      pages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    next(err);
  }
});

// Get unique tags
router.get('/tags', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('tags');
    if (error) throw error;

    // Flatten and deduplicate
    const tagSet = new Set();
    (data || []).forEach((c) => {
      if (Array.isArray(c.tags)) {
        c.tags.forEach((t) => tagSet.add(t));
      }
    });

    res.json([...tagSet].sort());
  } catch (err) {
    next(err);
  }
});

// Get single contact
router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Create contact
router.post('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .insert(req.body)
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// Update contact
router.patch('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Bulk actions on contacts
// Body: { contact_ids: [...], action: "add_to_group" | "add_tags" | "remove_tags" | "delete", group_id?: "...", tags?: [...] }
router.post('/bulk', async (req, res, next) => {
  try {
    const { contact_ids, action, group_id, tags } = req.body;

    if (!contact_ids || contact_ids.length === 0) {
      return res.status(400).json({ error: 'contact_ids required' });
    }

    switch (action) {
      case 'add_to_group': {
        if (!group_id) return res.status(400).json({ error: 'group_id required' });
        const rows = contact_ids.map((cid) => ({ group_id, contact_id: cid }));
        const { error } = await supabase
          .from('contact_group_members')
          .upsert(rows, { onConflict: 'contact_id,group_id', ignoreDuplicates: true });
        if (error) throw error;
        return res.json({ ok: true, action, affected: contact_ids.length });
      }

      case 'add_tags': {
        if (!tags || tags.length === 0) return res.status(400).json({ error: 'tags required' });
        // Fetch current tags for each contact, merge, then update
        const { data: contacts, error: fErr } = await supabase
          .from('contacts')
          .select('id, tags')
          .in('id', contact_ids);
        if (fErr) throw fErr;

        const updates = (contacts || []).map((c) => {
          const existing = Array.isArray(c.tags) ? c.tags : [];
          const merged = [...new Set([...existing, ...tags])];
          return supabase
            .from('contacts')
            .update({ tags: merged, updated_at: new Date().toISOString() })
            .eq('id', c.id);
        });
        await Promise.all(updates);
        return res.json({ ok: true, action, affected: contact_ids.length });
      }

      case 'remove_tags': {
        if (!tags || tags.length === 0) return res.status(400).json({ error: 'tags required' });
        const { data: contacts, error: fErr } = await supabase
          .from('contacts')
          .select('id, tags')
          .in('id', contact_ids);
        if (fErr) throw fErr;

        const updates = (contacts || []).map((c) => {
          const existing = Array.isArray(c.tags) ? c.tags : [];
          const filtered = existing.filter((t) => !tags.includes(t));
          return supabase
            .from('contacts')
            .update({ tags: filtered, updated_at: new Date().toISOString() })
            .eq('id', c.id);
        });
        await Promise.all(updates);
        return res.json({ ok: true, action, affected: contact_ids.length });
      }

      case 'delete': {
        const { error } = await supabase
          .from('contacts')
          .delete()
          .in('id', contact_ids);
        if (error) throw error;
        return res.json({ ok: true, action, affected: contact_ids.length });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    next(err);
  }
});

// Delete contact
router.delete('/:id', async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
