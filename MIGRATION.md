# Migration Guide: FixIt3D Scaled Architecture

This update transitions FixIt3D to use Supabase (PostgreSQL) and a legal MyMiniFactory aggregator, adding monetization (Masters & Affiliate) and an Admin Panel.

## 1. Supabase Setup

1.  Create a new project on [Supabase](https://supabase.com).
2.  Go to the **SQL Editor** in your Supabase dashboard.
3.  **Run the Schemas (IN ORDER):**
    *   **First:** Copy and run `supabase/schema.sql` (Base tables: models, masters).
    *   **Second:** Copy and run `supabase/admin_schema.sql` (Admin tables, Config, RPC functions).
    *   *Note: This order is critical for dependent objects.*

4.  Get your **Project URL** and **Service Role Key (secret)** from Project Settings > API.
    *   **WARNING:** Do not use the `anon` key for the backend `.env`. The Admin features require write access (bypassing RLS), which only the Service Role Key provides.

## 2. Environment Variables

Create or update your `.env` file (and Vercel Environment Variables):

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key-REQUIRED
MYMINIFACTORY_TOKEN=your-myminifactory-api-key
ADMIN_PASSWORD=your-secure-admin-password
SESSION_SECRET=long-random-string-for-jwt-signing
```

## 3. Populate Data

### Legal Models (MyMiniFactory)
Run the new parser to fetch models legally via API:

```bash
node parsers/myminifactory.js
```

### Map Masters (OpenStreetMap)
Populate the "Find Master" map with 3D printing services from OpenStreetMap:

```bash
node scripts/fetch_masters.js
```

## 4. Admin Access

1.  Go to `/admin/` in your browser.
2.  Login using `ADMIN_PASSWORD` (default in dev: `Valusha19923003`).
3.  Use the dashboard to view stats, update affiliate links, and manage premium masters.

## 5. Developer Notes

*   **Models:** `api/search.js` queries Supabase first, falling back to `data/models-index.json`.
*   **Masters:** Public access to the `masters` table is restricted. The frontend *must* use `/api/masters` and `/api/reveal-contact` endpoints, which handle logic securely.
*   **Stats:** Daily metrics (visits, leads) are tracked via atomic database increments.
*   **Legacy:** `parsers/printables-parser.py` has been removed.
