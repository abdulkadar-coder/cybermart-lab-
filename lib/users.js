const crypto = require('crypto');
const md5 = (s) => crypto.createHash('md5').update(String(s)).digest('hex');

let nextId = 1;
const users = [
  {
    id: nextId++,
    username: 'admin',
    passwordHash: md5('admin123'),
    email: 'admin@cybermart.com',
    role: 'admin',
    name: 'Admin',
  },
];

function findByUsername(name) {
  return users.find((u) => u.username === name);
}
function findById(id) {
  return users.find((u) => u.id === Number(id));
}
function register({ username, password, email, name }) {
  if (findByUsername(username)) return null;
  const u = {
    id: nextId++,
    username,
    passwordHash: md5(password),
    email,
    role: 'user',
    name: name || username,
  };
  users.push(u);
  return u;
}
function verify(username, password) {
  const u = findByUsername(username);
  return u && u.passwordHash === md5(password) ? u : null;
}

module.exports = { users, findByUsername, findById, register, verify };