# Migration Guide: Supabase & Legal Aggregator

This update transitions FixIt3D to use Supabase (PostgreSQL) and a legal MyMiniFactory aggregator, replacing the old scraper.

## 1. Supabase Setup

1.  Create a new project on [Supabase](https://supabase.com).
2.  Go to the **SQL Editor** in your Supabase dashboard.
3.  Copy and run the contents of `supabase/schema.sql`.
    *   This creates the `models` and `masters` tables.
4.  Get your **Project URL** and **API Key (service_role or anon)** from Project Settings > API.

## 2. Environment Variables

Create or update your `.env` file (and Vercel Environment Variables):

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
MYMINIFACTORY_TOKEN=your-api-key
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

## 4. Developer Notes

*   **Models:** The `api/search.js` endpoint now queries Supabase first. If no data is found (or no credentials), it falls back to `data/models-index.json`.
*   **Masters:** The `masters` table is populated but not yet served to the frontend (this is part of the upcoming Block 3: Monetization).
*   **Legacy:** `parsers/printables-parser.py` has been removed.
