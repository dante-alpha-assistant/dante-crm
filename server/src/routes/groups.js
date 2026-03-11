import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

// List groups
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('contact_groups')
      .select('*')
      .order('name');
    if (error) throw error;
    res.json(data);
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

    res.json({ ...group, members: members.map(m => m.contacts) });
  } catch (err) { next(err); }
});

// Create group
router.post('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('contact_groups')
      .insert(req.body)
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { next(err); }
});

// Add member to group
router.post('/:id/members', async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('contact_group_members')
      .insert({ group_id: req.params.id, contact_id: req.body.contact_id });
    if (error) throw error;
    res.status(201).json({ ok: true });
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
