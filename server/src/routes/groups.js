import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

// List groups (with member count)
router.get('/', async (req, res, next) => {
  try {
    const { data: groups, error } = await supabase
      .from('contact_groups')
      .select('*')
      .order('name');
    if (error) throw error;

    // Get member counts per group
    const { data: counts, error: cErr } = await supabase
      .from('contact_group_members')
      .select('group_id');
    if (cErr) throw cErr;

    const countMap = {};
    (counts || []).forEach((m) => {
      countMap[m.group_id] = (countMap[m.group_id] || 0) + 1;
    });

    const result = (groups || []).map((g) => ({
      ...g,
      member_count: countMap[g.id] || 0,
    }));

    res.json(result);
  } catch (err) { next(err); }
});

// Get group with members
router.get('/:id', async (req, res, next) => {
  try {
    const { data: group, error: gErr } = await supabase
      .from('contact_groups')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (gErr) throw gErr;

    const { data: members, error: mErr } = await supabase
      .from('contact_group_members')
      .select('contact_id, contacts(*)')
      .eq('group_id', req.params.id);
    if (mErr) throw mErr;

    res.json({ ...group, members: members.map((m) => m.contacts) });
  } catch (err) { next(err); }
});

// Create group
router.post('/', async (req, res, next) => {
  try {
    const { name, color, description } = req.body;
    const { data, error } = await supabase
      .from('contact_groups')
      .insert({ name, color, description })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { next(err); }
});

// Update group
router.patch('/:id', async (req, res, next) => {
  try {
    const { name, color, description } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (color !== undefined) update.color = color;
    if (description !== undefined) update.description = description;

    const { data, error } = await supabase
      .from('contact_groups')
      .update(update)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

// Add members to group (supports single or bulk)
// Body: { contact_id: "uuid" } OR { contact_ids: ["uuid", ...] }
router.post('/:id/members', async (req, res, next) => {
  try {
    const groupId = req.params.id;
    const contactIds = req.body.contact_ids
      ? req.body.contact_ids
      : req.body.contact_id
        ? [req.body.contact_id]
        : [];

    if (contactIds.length === 0) {
      return res.status(400).json({ error: 'contact_id or contact_ids required' });
    }

    const rows = contactIds.map((cid) => ({ group_id: groupId, contact_id: cid }));

    // Use upsert to avoid duplicates
    const { error } = await supabase
      .from('contact_group_members')
      .upsert(rows, { onConflict: 'contact_id,group_id', ignoreDuplicates: true });
    if (error) throw error;

    res.status(201).json({ ok: true, added: contactIds.length });
  } catch (err) { next(err); }
});

// Remove member from group
router.delete('/:id/members/:contactId', async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('contact_group_members')
      .delete()
      .eq('group_id', req.params.id)
      .eq('contact_id', req.params.contactId);
    if (error) throw error;
    res.status(204).end();
  } catch (err) { next(err); }
});

// Bulk remove members from group
// Body: { contact_ids: ["uuid", ...] }
router.post('/:id/members/remove', async (req, res, next) => {
  try {
    const { contact_ids } = req.body;
    if (!contact_ids || contact_ids.length === 0) {
      return res.status(400).json({ error: 'contact_ids required' });
    }

    const { error } = await supabase
      .from('contact_group_members')
      .delete()
      .eq('group_id', req.params.id)
      .in('contact_id', contact_ids);
    if (error) throw error;

    res.status(200).json({ ok: true, removed: contact_ids.length });
  } catch (err) { next(err); }
});

// Delete group
router.delete('/:id', async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('contact_groups')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
