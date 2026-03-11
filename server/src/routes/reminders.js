import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

// GET /api/reminders — list reminders with filters
// ?filter=upcoming|overdue|completed  (default: all pending)
// ?contact_id=uuid
router.get('/', async (req, res, next) => {
  try {
    const { filter, contact_id } = req.query;
    const now = new Date().toISOString();

    let query = supabase
      .from('reminders')
      .select('*, contacts!inner(id, name)')
      .order('due_at', { ascending: true });

    if (contact_id) {
      query = query.eq('contact_id', contact_id);
    }

    if (filter === 'completed') {
      query = query.not('completed_at', 'is', null);
    } else if (filter === 'overdue') {
      query = query
        .is('completed_at', null)
        .lt('due_at', now)
        .or(`snoozed_until.is.null,snoozed_until.lt.${now}`);
    } else if (filter === 'upcoming') {
      // Upcoming = due in next 7 days, not overdue, not completed
      const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      query = query
        .is('completed_at', null)
        .gte('due_at', now)
        .lte('due_at', weekFromNow);
    } else {
      // Default: all pending (not completed)
      query = query.is('completed_at', null);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

// GET /api/reminders/counts — overdue count for nav badge
router.get('/counts', async (req, res, next) => {
  try {
    const now = new Date().toISOString();
    const { count, error } = await supabase
      .from('reminders')
      .select('*', { count: 'exact', head: true })
      .is('completed_at', null)
      .lt('due_at', now)
      .or(`snoozed_until.is.null,snoozed_until.lt.${now}`);

    if (error) throw error;
    res.json({ overdue: count || 0 });
  } catch (err) { next(err); }
});

// POST /api/contacts/:contactId/reminders — create reminder for a contact
// (mounted separately in index.js)

// POST /api/reminders — create reminder (requires contact_id in body)
router.post('/', async (req, res, next) => {
  try {
    const { contact_id, title, due_at } = req.body;
    if (!contact_id || !title || !due_at) {
      return res.status(400).json({ error: 'contact_id, title, and due_at are required' });
    }
    const { data, error } = await supabase
      .from('reminders')
      .insert({ contact_id, title, due_at })
      .select('*, contacts!inner(id, name)')
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { next(err); }
});

// PATCH /api/reminders/:id — update reminder (mark done, snooze, edit)
router.patch('/:id', async (req, res, next) => {
  try {
    const updates = {};
    const { title, due_at, completed_at, snooze } = req.body;

    if (title !== undefined) updates.title = title;
    if (due_at !== undefined) updates.due_at = due_at;
    if (completed_at !== undefined) updates.completed_at = completed_at;

    // Snooze shortcuts
    if (snooze) {
      const now = new Date();
      let snoozedUntil;
      if (snooze === 'tomorrow') {
        snoozedUntil = new Date(now);
        snoozedUntil.setDate(snoozedUntil.getDate() + 1);
        snoozedUntil.setHours(9, 0, 0, 0);
      } else if (snooze === 'next_week') {
        snoozedUntil = new Date(now);
        snoozedUntil.setDate(snoozedUntil.getDate() + (8 - snoozedUntil.getDay()) % 7 || 7);
        snoozedUntil.setHours(9, 0, 0, 0);
      } else {
        // Custom ISO date
        snoozedUntil = new Date(snooze);
      }
      updates.snoozed_until = snoozedUntil.toISOString();
    }

    // Unsnooze when marking done
    if (completed_at) {
      updates.snoozed_until = null;
    }

    const { data, error } = await supabase
      .from('reminders')
      .update(updates)
      .eq('id', req.params.id)
      .select('*, contacts!inner(id, name)')
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

// DELETE /api/reminders/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;

// Contact-scoped route handler (mounted at /api/contacts/:contactId/reminders)
export function contactRemindersHandler(req, res, next) {
  const contactId = req.params.contactId;
  req.body.contact_id = contactId;

  // Delegate to main POST handler logic
  (async () => {
    try {
      const { title, due_at } = req.body;
      if (!title || !due_at) {
        return res.status(400).json({ error: 'title and due_at are required' });
      }
      const { data, error } = await supabase
        .from('reminders')
        .insert({ contact_id: contactId, title, due_at })
        .select('*, contacts!inner(id, name)')
        .single();
      if (error) throw error;
      res.status(201).json(data);
    } catch (err) { next(err); }
  })();
}
