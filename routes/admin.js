const path = require('path');
const express = require('express');
const { listLeads, updateLead, deleteLead, stats, STATUSES } = require('../db');
const { checkCredentials, requireAdmin } = require('../lib/auth');
const { rateLimit } = require('../lib/rateLimit');

const router = express.Router();
const VIEWS = path.join(__dirname, '..', 'views');

router.get('/admin/login', (req, res) => {
  if (req.session.isAdmin) return res.redirect('/admin');
  res.sendFile(path.join(VIEWS, 'login.html'));
});

router.post('/admin/login', rateLimit({ max: 10 }), (req, res) => {
  const { username, password } = req.body || {};
  if (checkCredentials(username, password)) {
    req.session.regenerate(() => {
      req.session.isAdmin = true;
      res.redirect('/admin');
    });
  } else {
    res.redirect('/admin/login?error=1');
  }
});

router.post('/admin/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

router.get('/admin', requireAdmin, (req, res) => res.sendFile(path.join(VIEWS, 'admin.html')));

router.get('/api/admin/leads', requireAdmin, (req, res) => {
  res.json({ leads: listLeads({ status: req.query.status }), stats: stats(), statuses: STATUSES });
});

router.patch('/api/admin/leads/:id', requireAdmin, (req, res) => {
  const updated = updateLead(Number(req.params.id), req.body || {});
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json({ lead: updated });
});

router.delete('/api/admin/leads/:id', requireAdmin, (req, res) => {
  res.json({ ok: deleteLead(Number(req.params.id)) });
});

router.get('/api/admin/leads.csv', requireAdmin, (req, res) => {
  const cols = ['id', 'created_at', 'status', 'urgency', 'name', 'phone', 'email', 'town', 'service', 'last_pumped', 'message', 'notes'];
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [cols.join(','), ...listLeads().map(l => cols.map(c => q(l[c])).join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="libby-septic-leads.csv"');
  res.send(csv);
});

module.exports = router;
