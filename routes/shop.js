const express = require('express');
const { exec } = require('child_process');
const { db } = require('../lib/sql');
const users = require('../lib/users');

const router = express.Router();

const EMOJI = { 1: '📚', 2: '👕', 3: '🛡️', 4: '🔑', 5: '🌐', 6: '🖥️' };
const withImg = (r) => ({ ...r, img: EMOJI[r.id] || '📦' });

const reviews = [];
const dt = (ts) => new Date(ts).toLocaleString();

// ---------- public pages ----------

router.get('/', (req, res) => {
  const products = db.prepare('SELECT * FROM products LIMIT 3').all();
  res.render('home', { products: products.map(withImg) });
});

router.get('/products', (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q : '';
  const sql = `SELECT id, name, price, description FROM products WHERE name LIKE '%${q}%'`;
  try {
    const rows = db.prepare(sql).all();
    res.render('products', { q, count: rows.length, rows: rows.map(withImg) });
  } catch (e) {
    res.status(400).render('products', { q, count: 0, rows: [], dbError: e.message, sql });
  }
});

router.get('/product/:id', (req, res) => {
  const id = Number(req.params.id);
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!product) return res.status(404).render('404');
  const list = reviews.filter((r) => r.productId === id).map((r) => ({ ...r, at: dt(r.at) }));
  res.render('product', { product: withImg(product), reviews: list });
});

router.post('/product/:id/review', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const productId = Number(req.params.id);
  const author = (req.session.username || 'anonymous');
  reviews.push({
    productId,
    author,
    authorName: req.session.name || author,
    text: String(req.body.text || '').trim(),
    at: Date.now(),
  });
  res.redirect('/product/' + productId);
});

router.get('/diagnostics', (req, res) => {
  const host = typeof req.query.host === 'string' && req.query.host.trim() ? req.query.host : '127.0.0.1';
  const cmd = process.platform === 'win32' ? `ping -n 1 ${host}` : `ping -c 1 ${host}`;
  exec(cmd, { timeout: 6000 }, (err, stdout, stderr) => {
    const output =
      `$ ${cmd}\n\n` + `${stdout}${stderr}` + (err ? `\n[exit ${err.code}]` : '');
    res.render('diagnostics', { host, cmd, output });
  });
});

// ---------- accounts ----------

router.get('/login', (req, res) => {
  if (req.session.userId) return res.redirect('/account');
  res.render('login', { error: null });
});
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const u = users.verify(username, password);
  if (!u) {
    return res.render('login', { error: 'Invalid username or password.' });
  }
  req.session.userId = u.id;
  req.session.username = u.username;
  req.session.name = u.name;
  res.redirect('/account');
});

router.get('/register', (req, res) => {
  res.render('register', { error: null });
});
router.post('/register', (req, res) => {
  const { username, password, email, name } = req.body || {};
  if (!username || !password) {
    return res.render('register', { error: 'Username and password are required.' });
  }
  const u = users.register({ username, password, email, name });
  if (!u) {
    return res.render('register', { error: 'That username is already taken.' });
  }
  req.session.userId = u.id;
  req.session.username = u.username;
  req.session.name = u.name;
  res.redirect('/account');
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

router.get('/account', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  res.render('account', { user: users.findById(req.session.userId) });
});

// ---------- moderation endpoint used by the XSS payload ----------

router.get('/api/moderation/flag', (req, res) => {
  res.type('text/plain').send('FLAG{injection_stored_xss}');
});

module.exports = router;