# BEST Content Review

A lightweight app for sharing proposed website content with a client for review. The client clicks a link, reviews content cards, sets statuses (Use / Like / Remove), and optionally edits text fields. All changes persist to Supabase.

**Live:** https://tunismike.github.io/BEST/

## Quick Start

```bash
npm install
cp .env.example .env
# Fill in your Supabase credentials in .env
npm run dev
```

Open `http://localhost:5173/BEST/#/r/demo` to see the review page.

## Supabase Setup

Create a new Supabase project and run this SQL in the SQL Editor:

```sql
CREATE TABLE content_reviews (
  review_id   TEXT NOT NULL,
  item_id     TEXT NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('unreviewed','use','like','remove')),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (review_id, item_id)
);

CREATE TABLE content_edits (
  review_id   TEXT NOT NULL,
  item_id     TEXT NOT NULL,
  title       TEXT,
  category    TEXT,
  description TEXT,
  link        TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (review_id, item_id)
);

CREATE INDEX idx_reviews_rid ON content_reviews(review_id);
CREATE INDEX idx_edits_rid ON content_edits(review_id);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reviews_updated BEFORE UPDATE ON content_reviews
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_edits_updated BEFORE UPDATE ON content_edits
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE content_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_edits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all_reviews" ON content_reviews FOR ALL TO anon
  USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_edits" ON content_edits FOR ALL TO anon
  USING (true) WITH CHECK (true);
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `VITE_ADMIN_KEY` | Secret key for admin page access |

## Routes

| Route | Purpose |
|-------|---------|
| `/#/r/:reviewId` | Client review page |
| `/#/admin/:reviewId?key=ADMIN_KEY` | Admin results page |

## Sharing a Review

1. Generate a UUID for the review (e.g., `crypto.randomUUID()`)
2. Send the client: `https://tunismike.github.io/BEST/#/r/YOUR-UUID`
3. View results: `https://tunismike.github.io/BEST/#/admin/YOUR-UUID?key=YOUR_ADMIN_KEY`

## Deploy

Push to `main` triggers GitHub Actions to build and deploy to GitHub Pages.

Add these as GitHub repository secrets:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_KEY`

## Tech Stack

- React 18 + TypeScript + Vite
- Supabase (Postgres + anon auth)
- Plain CSS (no framework)
- GitHub Pages
