const express = require('express');
const { createLead } = require('../db');
const { notifyNewLead } = require('../lib/mailer');
const { rateLimit } = require('../lib/rateLimit');

const router = express.Router();

const SERVICES = [
  'Septic pumping', 'Emergency / backup', 'Tank replacement or install', 'Risers & access',
  'Clog or line problem', 'Excavation / site work', 'Trucking / material delivery', 'Not sure — need advice'
];
const URGENCY = ['emergency', 'this-week', 'flexible'];
const LAST_PUMPED = ["Don't know", 'Within 2 years', '2–4 years ago', '5+ years ago', 'Never / new to the home'];

const clean = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

router.post('/quote', rateLimit({ max: 8 }), async (req, res) => {
  const b = req.body || {};
  // Honeypot: real people never fill this hidden field.
  if (clean(b.company_website)) return res.json({ ok: true });

  const lead = {
    name: clean(b.name, 120),
    phone: clean(b.phone, 40),
    email: clean(b.email, 160),
    town: clean(b.town, 80),
    service: SERVICES.includes(b.service) ? b.service : 'Not sure — need advice',
    urgency: URGENCY.includes(b.urgency) ? b.urgency : 'flexible',
    last_pumped: LAST_PUMPED.includes(b.last_pumped) ? b.last_pumped : "Don't know",
    message: clean(b.message, 2000)
  };

  const errors = {};
  if (lead.name.length < 2) errors.name = 'Please enter your name.';
  if (lead.phone.replace(/\D/g, '').length < 10) errors.phone = 'Please enter a phone number we can call back.';
  if (lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) errors.email = 'That email doesn’t look right.';
  if (Object.keys(errors).length) return res.status(400).json({ ok: false, errors });

  try {
    const saved = createLead(lead);
    notifyNewLead(saved); // fire-and-forget; never block the customer on email
    res.json({ ok: true, id: saved.id, emergency: saved.urgency === 'emergency' });
  } catch (err) {
    console.error('[quote] save failed:', err);
    res.status(500).json({ ok: false, error: 'Something went wrong. Please call (207) 767-2614.' });
  }
});

module.exports = router;
