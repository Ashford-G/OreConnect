import React from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  ClipboardList,
  Package,
  RefreshCw,
  Search,
} from "lucide-react";

const CATEGORIES = [
  ["equipment", "Equipment & machinery"],
  ["supplies", "PPE & consumables"],
  ["logistics", "Transport & logistics"],
  ["services", "Mining services"],
  ["rentals", "Equipment rentals"],
  ["jobs", "Jobs & recruitment"],
];

const companyName = (company) =>
  company?.trading_name || company?.legal_name || "Mining business";

const money = (amount, currency = "USD") => {
  if (amount === null || amount === undefined || amount === "") return "Price on request";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(amount));
  } catch {
    return `${amount} ${currency}`;
  }
};

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : "Not specified");
const pad = (n) => String(n).padStart(2, "0");
const label = (v, fallback) => (v || fallback).replaceAll("_", " ");

function Empty({ title, children }) {
  return (
    <div className="sx-empty">
      <b>{title}</b>
      <p>{children}</p>
    </div>
  );
}

function CompanyCard({ company }) {
  return (
    <article className="sx-card">
      <div className="sx-card-top">
        <span className="sx-card-icon"><Building2 size={16} /></span>
        <span className={`sx-status ${company.verification_status || "pending"}`}>
          {label(company.verification_status, "pending review")}
        </span>
      </div>
      <h3>{companyName(company)}</h3>
      <span className="sx-kicker">{label(company.business_type, "Mining business")}</span>
      {company.description && <p>{company.description}</p>}
      {(company.city || company.province) && (
        <small>{[company.city, company.province].filter(Boolean).join(", ")}</small>
      )}
    </article>
  );
}

function ListingRow({ item }) {
  return (
    <article className="sx-row">
      <div className="sx-row-head">
        <span className="sx-kicker">{label(item.category, "Listing")}</span>
        <strong>{money(item.price, item.currency)}</strong>
      </div>
      <h3>{item.title}</h3>
      {item.description && <p>{item.description}</p>}
      <div className="sx-meta">
        <span>{companyName(item.companies)}</span>
        {item.location && <span>{item.location}</span>}
        <span>{item.quantity ? `${item.quantity} ${item.unit || ""}` : "Quantity on request"}</span>
      </div>
    </article>
  );
}

function RequestRow({ item }) {
  return (
    <article className="sx-row">
      <div className="sx-row-head">
        <span className="sx-kicker">{label(item.category, "Procurement")}</span>
        <small>Required by {formatDate(item.required_by)}</small>
      </div>
      <h3>{item.title}</h3>
      {item.description && <p>{item.description}</p>}
      <div className="sx-meta">
        <span>{companyName(item.companies)}</span>
        {item.delivery_location && <span>{item.delivery_location}</span>}
      </div>
    </article>
  );
}

export default function PublicMarketplaceHome({
  companies = [],
  listings = [],
  rfqs = [],
  query = "",
  setQuery = () => {},
  categoryFilter = "",
  setCategoryFilter = () => {},
  onSignIn = () => {},
  onSignUp = () => {},
  onRefresh = () => {},
}) {
  const latest = listings[0] || null;

  const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  const selectCategory = (value) => {
    setCategoryFilter(value);
    go("discover");
  };

  return (
    <div className="sx-shell">
      {/* HERO — full-bleed photo card, ShipX layout */}
      <section className="sx-hero" id="top">
        <header className="sx-nav">
          <a href="#top" className="sx-brand">
            <img src="/oreconnect-logo.png" alt="" />
            <span>OreConnect</span>
          </a>
          <nav aria-label="Primary navigation">
            <a href="#directory">Directory</a>
            <a href="#marketplace">Marketplace</a>
            <a href="#procurement">Procurement</a>
            <button type="button" onClick={onSignIn}>Sign in</button>
          </nav>
          <button type="button" className="sx-pill-gold" onClick={onSignUp}>
            Get started
          </button>
        </header>

        <div className="sx-hero-body">
          <div className="sx-hero-copy">
            <h1>
              The connections behind
              <br />
              <em>every mine.</em>
            </h1>
            <p>
              Find mining suppliers, equipment, contractors and specialist services —
              and connect with the businesses that keep operations moving.
            </p>
            <div className="sx-cta">
              <button type="button" className="sx-pill-dark" onClick={onSignUp}>
                Create a business account
              </button>
              <button type="button" className="sx-round" onClick={onSignUp} aria-label="Create a business account">
                <ArrowUpRight size={18} />
              </button>
            </div>
          </div>

          <aside className="sx-feature">
            <div className="sx-feature-card">
              <span className="sx-feature-tag">Latest listing</span>
              {latest ? (
                <>
                  <h3>{latest.title}</h3>
                  <p>{companyName(latest.companies)}</p>
                  <strong>{money(latest.price, latest.currency)}</strong>
                </>
              ) : (
                <>
                  <h3>No listings published yet</h3>
                  <p>Approved listings appear here as businesses publish them.</p>
                </>
              )}
              <div className="sx-feature-foot">
                <span>{pad(listings.length)}</span>
                <i><b style={{ width: listings.length ? "100%" : "0%" }} /></i>
              </div>
            </div>
            <div className="sx-feature-caption">
              <b>Market</b>
              <span>Equipment, supplies, logistics and services for mining</span>
            </div>
          </aside>
        </div>

        <button type="button" className="sx-badge" onClick={() => go("discover")} aria-label="Explore more">
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <defs>
              <path id="sx-circle" d="M50,50 m-37,0 a37,37 0 1,1 74,0 a37,37 0 1,1 -74,0" />
            </defs>
            <text><textPath href="#sx-circle">EXPLORE MORE • EXPLORE MORE •</textPath></text>
          </svg>
          <img src="/oreconnect-logo.png" alt="" />
        </button>

        <footer className="sx-hero-foot">
          <div className="sx-counts">
            <span><b>{companies.length}</b> companies</span>
            <span><b>{listings.length}</b> listings</span>
            <span><b>{rfqs.length}</b> open requests</span>
          </div>
          <span className="sx-hero-note">Zimbabwe-first mining business network</span>
        </footer>
      </section>

      <main className="sx-main">
        {/* SEARCH */}
        <section className="sx-search" id="discover">
          <div>
            <span className="sx-eyebrow">Discover</span>
            <h2>What are you looking for?</h2>
          </div>
          <div className="sx-search-controls">
            <label className="sx-input">
              <Search size={17} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Company, equipment, service or location"
              />
            </label>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} aria-label="Filter category">
              <option value="">All categories</option>
              {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <button type="button" className="sx-pill-dark" onClick={onRefresh}>
              <Search size={15} /> Search
            </button>
          </div>
        </section>

        {/* CATEGORIES */}
        <section className="sx-section">
          <div className="sx-heading">
            <div>
              <span className="sx-eyebrow">Explore the industry</span>
              <h2>Browse by category</h2>
            </div>
          </div>
          <div className="sx-cats">
            {CATEGORIES.map(([v, l], i) => (
              <button
                type="button"
                key={v}
                className={categoryFilter === v ? "selected" : ""}
                onClick={() => selectCategory(categoryFilter === v ? "" : v)}
              >
                <small>{pad(i + 1)}</small>
                <b>{l}</b>
                <ArrowUpRight size={16} />
              </button>
            ))}
          </div>
        </section>

        {/* DIRECTORY */}
        <section className="sx-section" id="directory">
          <div className="sx-heading">
            <div>
              <span className="sx-eyebrow">Business directory</span>
              <h2>Mining companies</h2>
            </div>
            <button type="button" className="sx-link" onClick={onRefresh}>
              Refresh <RefreshCw size={14} />
            </button>
          </div>
          <div className="sx-grid">
            {companies.slice(0, 6).map((c) => <CompanyCard key={c.id} company={c} />)}
            {companies.length === 0 && (
              <Empty title="No verified companies found.">
                No company profiles match your search yet. Register your business to establish its presence.
              </Empty>
            )}
          </div>
        </section>

        {/* LISTINGS + RFQS */}
        <section className="sx-split">
          <div id="marketplace">
            <div className="sx-heading">
              <div>
                <span className="sx-eyebrow"><Package size={13} /> Marketplace</span>
                <h2>Latest listings</h2>
              </div>
            </div>
            <div className="sx-stack">
              {listings.slice(0, 4).map((x) => <ListingRow key={x.id} item={x} />)}
              {listings.length === 0 && (
                <Empty title="No listings available yet.">
                  Approved public listings will appear here when businesses publish them.
                </Empty>
              )}
            </div>
          </div>
          <div id="procurement">
            <div className="sx-heading">
              <div>
                <span className="sx-eyebrow"><ClipboardList size={13} /> Procurement</span>
                <h2>Open requests</h2>
              </div>
            </div>
            <div className="sx-stack">
              {rfqs.slice(0, 4).map((x) => <RequestRow key={x.id} item={x} />)}
              {rfqs.length === 0 && (
                <Empty title="No open requests at the moment.">
                  Public requests for quotation will appear here as buyers publish them.
                </Empty>
              )}
            </div>
          </div>
        </section>

        {/* JOIN */}
        <section className="sx-join">
          <div>
            <span className="sx-eyebrow light">Join the network</span>
            <h2>Make your business easier to find.</h2>
            <p>Create a company profile, publish listings and respond to procurement requests across the mining sector.</p>
          </div>
          <div className="sx-cta">
            <button type="button" className="sx-pill-gold" onClick={onSignUp}>Get started</button>
            <button type="button" className="sx-round light" onClick={onSignUp} aria-label="Get started">
              <ArrowRight size={18} />
            </button>
          </div>
        </section>

        <footer className="sx-footer">
          <div className="sx-brand dark">
            <img src="/oreconnect-logo.png" alt="" />
            <span>OreConnect</span>
          </div>
          <small>
            Company verification is subject to review. Payments and escrow are not currently processed.
          </small>
        </footer>
      </main>
    </div>
  );
}
