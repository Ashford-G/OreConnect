# OreConnect — verified mining marketplace

React + Vite + Tailwind landing page with a ShipX-style hero.

## Run locally
```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # output in dist/
```

## Upload to GitHub
1. Create an empty repository on github.com.
2. Upload everything in this folder (drag and drop works), or:
```bash
git init && git add . && git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-NAME/oreconnect.git
git push -u origin main
```

## Edit content
All text, prices, listings and images live in `src/data.js`. Colours and fonts are in `tailwind.config.js`.

## Deploy
Import the repo on Vercel or Netlify — build command `npm run build`, output folder `dist`.

## Supabase setup
1. Create a project at supabase.com.
2. Open **SQL Editor**, paste `supabase/migrations/001_schema.sql`, click **Run**. This creates all tables, security rules and the private `documents` storage.
3. Copy `.env.example` to `.env` and paste your Project URL and anon key (Project Settings → API).
4. On Vercel/Netlify add the same two values as environment variables.

Folders: `src/` app pages · `src/lib/supabase.js` database connection · `supabase/migrations/` database setup · `public/` images and icons.
Commission defaults are in the `commission_rules` table — change them there.
