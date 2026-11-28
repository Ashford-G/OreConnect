# OreConnect — ShipX-style UI update

Copy these files into the repository root, keeping the same paths (overwrite when asked).

Changed
- src/App.jsx — 3 brand marks now use your logo, and imports the new stylesheet. No logic, queries or Supabase code changed.
- src/components/PublicMarketplaceHome.jsx — redesigned public home (same props, same handlers, real data only, empty states when nothing exists).
- index.html — adds the favicon.

New
- src/oreconnect-shipx.css — the new design layer (home + signed-in workspace).
- public/oreconnect-logo.png, public/favicon.png — your logo.

Notes
- Hero counts (companies / listings / open requests) and the "Latest listing" card come from the database; they show 0 / an empty state when there is no data.
- src/components/Hero.jsx, Sections.jsx, Ticker.jsx and src/data.js contain sample prices and listings. They are not used by the app; consider deleting them so no fake data is ever shown.
