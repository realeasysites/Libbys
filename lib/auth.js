const crypto = require('crypto');

function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

// Password-only login (no username). First argument kept for compatibility.
function checkCredentials(_user, pass) {
  const P = process.env.ADMIN_PASSWORD || 'change-me-now';
  return safeEqual(pass || '', P);
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'Not authorized' });
  return res.redirect('/admin/login');
}

module.exports = { checkCredentials, requireAdmin };
