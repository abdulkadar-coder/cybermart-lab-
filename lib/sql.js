const { DatabaseSync } = require('node:sqlite');

const db = new DatabaseSync(':memory:');

db.exec(`
  CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    name TEXT,
    price REAL,
    description TEXT
  );
  CREATE TABLE secrets (
    id INTEGER PRIMARY KEY,
    name TEXT,
    price REAL,
    description TEXT
  );
`);

const seed = db.prepare(
  'INSERT INTO products (id, name, price, description) VALUES (?, ?, ?, ?)'
);
seed.run(1, 'Secure Coding Course', 49.99, '120 hours of video on writing safe software.');
seed.run(2, 'XSS T-Shirt', 24.99, 'Graphic tee with a classic alert(1) print.');
seed.run(3, 'Firewall Sticker', 4.99, 'Peel-and-stick protection for your laptop.');
seed.run(4, '2FA Key Fob', 19.99, 'Hardware token with six-digit rotating codes.');
seed.run(5, 'VPN Subscription (1 yr)', 59.99, 'Mesh-network VPN with a no-logs policy.');
seed.run(6, 'Laptop Privacy Filter', 34.99, 'Keep prying eyes off your screen on flights.');

const seedSecret = db.prepare(
  'INSERT INTO secrets (id, name, price, description) VALUES (?, ?, ?, ?)'
);
seedSecret.run(1, 'FLAG', 0, 'FLAG{injection_sql_union}');
seedSecret.run(2, 'ROOT_PASSWORD', 0, '$up3r_s3cr3t_root_p4ss');
seedSecret.run(3, 'DATABASE_CREDENTIALS', 0, 'cybermart:4dmin_b4ckup_db');

module.exports = { db, productsTable: db };