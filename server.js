const path = require('path');
const fs = require('fs');
const express = require('express');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '127.0.0.1';

const CMDI_FLAG_FILE = path.join(__dirname, 'cmdi-flag.txt');
if (!fs.existsSync(CMDI_FLAG_FILE)) {
  fs.writeFileSync(CMDI_FLAG_FILE, 'FLAG{injection_command_exec}\n');
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(
  session({
    name: 'cybermart.sid',
    secret: 'cybermart-session-secret-2024',
    resave: false,
    saveUninitialized: true,
    cookie: { httpOnly: false },
  })
);

const { findById } = require('./lib/users');

app.use((req, res, next) => {
  const userId = req.session.userId;
  res.locals.user = userId ? findById(userId) : null;
  res.locals.q = typeof req.query.q === 'string' ? req.query.q : '';
  res.locals.path = req.path;
  next();
});

app.use(express.static(path.join(__dirname, 'public')));
app.use('/', require('./routes/shop'));

app.use((req, res) => res.status(404).render('404'));

app.listen(PORT, HOST, () => {
  console.log('');
  console.log('  CyberMart storefront  -  intentionally vulnerable (A05: Injection)');
  console.log('  --------------------------------------------------------------------');
  console.log(`  URL:    http://${HOST}:${PORT}/`);
  console.log('  WARNING: FOR LOCAL EDUCATIONAL USE ONLY.');
  console.log('  Never expose this server to a network or the internet.');
  console.log('');
});