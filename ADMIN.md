# LEX ARTA admin panel

URL: `/admin` (not indexed, not linked from the public site).

The admin panel is **self-contained** — no Supabase, no external account. All data
(enquiries, page edits, site settings, articles, admin accounts and sessions) lives
in a local JSON file at `data/admin-store.json`, read and written through TanStack
Start server functions. The file and its folder are created automatically on first
write and are git-ignored.

## Setup

1. `npm install`
2. `npm run dev` and open `/admin`.
3. The first visit shows a **"Create your admin account"** screen — set the owner
   email, name and password (min 8 characters). That account can then invite others.

## Authentication

- **Accounts, not a shared password.** Each administrator has their own email + password.
- **Roles.** `owner` can do everything, including managing other users; `editor` can
  manage content but not accounts. Manage accounts under **Users & access** (owners only).
- **Password storage.** Passwords are hashed with scrypt + a per-user random salt; the
  plaintext is never stored. Owners can reset any user's password from **Users & access**
  (that user's sessions end so the new password takes effect).
- **Sessions.** Sign-in creates a 7-day session kept in an **httpOnly, SameSite=Lax
  cookie** (`Secure` in production), not in localStorage — so page scripts can't read it.
  Only a **hash** of each session token is stored, so a leaked store file can't be used to
  hijack a session. "Sign out of all devices" revokes every session for your account.
- **Brute-force protection.** After 5 failed sign-ins for an email, that email is locked
  out for 15 minutes.
- **Activity log.** Logins, user changes, content edits and settings changes are recorded
  and shown to owners under **Users & access → Recent activity**.
- Cross-site requests to the server functions are rejected by the built-in CSRF
  middleware (`src/start.ts`).
- **Recovery.** If the only owner is locked out, remove that user's object from `users` in
  `data/admin-store.json` (or delete the file) — the first-run setup screen returns.

## Sections

- **Dashboard** – every consultation form submission with status (new / in progress /
  done), internal notes, search, CSV export, plus a snapshot of articles, pages
  edited and broken links across the site.
- **Insights** – a full article CMS: write, edit, publish or unpublish articles with a
  title, slug, category, date, author, hero image (upload or URL), summary, "in brief"
  intro, body sections (headings, paragraphs, bullet points) and primary sources.
  Published articles appear on the public `/insights` page and get their own URL at
  `/insights/<slug>/`; drafts stay hidden. Built-in articles remain unchanged.
- **Media** – library of images uploaded through the article editor; copy a URL to reuse
  an image, or delete ones no longer needed.
- **Pages & SEO** – browser title and meta description of any page (the full raw HTML is
  tucked behind an "Advanced" toggle for developers); reset to the bundled version.
- **Page editor** – three tabs per page, with a search box:
  - **Text** – every piece of visible text: headings, paragraphs, list items, small
    labels above headings, chips, button and card titles, prices… (each shown with its
    tag and CSS class so it is easy to recognise).
  - **Links** – change any link's address and whether it opens in a new tab; broken
    internal links are flagged.
  - **Images** – change an image's address or alt text, or upload a replacement.

  Saving stores a full copy of that page. Later changes made in the code will not show
  on that page until you press **Reset page**.
- **Users & access** _(owners only)_ – add / remove administrators, set roles
  (owner / editor), reset a user's password, see last-login times, review the activity
  log, and sign out of all your devices.
- **Site settings** – **Contact & company** (name, email, phone, address, reg. number,
  copyright — drives the footer and the consultation form's destination), an **enquiry
  notification webhook**, social links, brand colours, the services mega-menu,
  **Header & footer** (logo, brand name and tagline, main menu, header button, footer
  texts and both footer link columns; `{company}` / `{number}` placeholders fill in the
  company details), and a **Your password** panel. Header and footer are rendered once in the root layout, so a
  change applies to all pages.

## Data & persistence

- Enquiries, articles, page edits, settings, accounts and the activity log are saved to
  `data/admin-store.json`. Writes are **atomic** (written to a temp file then renamed), so
  a crash mid-write can never leave a half-written file. For the contact form, if the
  server write fails it falls back to a prepared `mailto:` message.
- Uploaded images are written to `public/uploads/` and served from `/uploads/...`.
- The store is a plain JSON file: back it up by copying it, reset the panel by
  deleting it. Both `data/` and `public/uploads/` are git-ignored.
- The file lives on the server's local disk, so it persists on a long-running Node
  host (`npm run dev`, `npm run preview`, or a Node deployment). On an ephemeral
  serverless target it would not persist between invocations — use a long-running
  host, or move the store to a hosted database if you deploy serverless.

## Enquiry notifications

Set an **enquiry notification webhook** under Site settings and each new consultation
enquiry is POSTed to it as JSON (`{ "type": "new_enquiry", "enquiry": { … } }`). It works
with Slack, Make, Zapier, n8n, Discord and anything else that accepts an incoming webhook —
no credentials stored, no code change. For a real email/SMS instead, point the webhook at
a small function of your own, or add the call inside the `submitEnquiry` handler in
`src/lib/rpc/functions.ts`.
