# OreConnect — GitHub starter
Responsive Next.js + TypeScript starter using Supabase.

## Included
- Responsive OreConnect homepage using navy #14293F, amber #F5A623 and white.
- Marketplace-style navigation, search UI, category grid, illustrative equipment/supplies cards, trust section and Gold Delivery entry point.
- Supabase browser/server clients and cookie-session middleware.
- SQL foundation for companies, searchable public names, private contact data, staff memberships, subscriptions, verification, listings, compliance rules, RFQs, quotes, orders, commissions, jobs, messages and gold delivery tracking.
- Gold sales are blocked by database trigger. Lithium/diamonds and other mineral categories default to disabled until administrators complete legal review.

## Upload and deploy
1. Extract this ZIP.
2. Upload the contents of the OreConnect folder to the root of a new GitHub repository.
3. Import that repository in Vercel.
4. Create a Supabase project and run `supabase/migrations/0001_oreconnect_core.sql` in SQL Editor.
5. Copy `.env.example` to `.env.local` for local work and add your Supabase Project URL and Publishable key.
6. Add those same two environment variables in Vercel Project Settings → Environment Variables, then redeploy.
7. Add your local and deployed site URLs to Supabase Auth URL Configuration.

Local commands: `npm install` then `npm run dev`.

## Important
This is the first build slice, not a completed production marketplace. The homepage uses illustrative demo cards; no live supplier records or metrics are claimed. Registration/login pages are placeholders. Live search, company onboarding, verification admin, subscription billing, messaging, contact-release logic, payments, commission settlement, maps, notifications and provider integrations are future slices.

Company phone/email data is in a separate private table with no public read policy. Contact release must be implemented only through a trusted server-side function after the defined payment/order condition. Do not expose contact fields in public API responses or search indexes.

No payment or escrow provider is connected. Do not assume Pesepay supports split settlement or escrow until the provider confirms it and legal advisers approve the flow. Never commit service-role keys or payment secrets. Test all RLS policies in a separate Supabase project before using real company data.

Zimbabwe mining, export, AML/KYC, data protection, payment and mineral category rules require current professional legal review. OreConnect policy excludes gold sales; Gold Delivery is tracking only. Lithium and diamonds remain disabled by default.
