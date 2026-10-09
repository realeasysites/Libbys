// Tiny in-memory rate limiter (no extra dependency). Good enough for a single-instance site.
function rateLimit({ windowMs = 15 * 60 * 1000, max = 8 } = {}) {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (now - v.start > windowMs) hits.delete(k);
  }, windowMs).unref();

  return (req, res, next) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const entry = hits.get(key) || { start: now, count: 0 };
    if (now - entry.start > windowMs) { entry.start = now; entry.count = 0; }
    entry.count += 1;
    hits.set(key, entry);
    if (entry.count > max) {
      return res.status(429).json({ error: 'Too many requests. Please call (207) 767-2614.' });
    }
    next();
  };
}
module.exports = { rateLimit };
