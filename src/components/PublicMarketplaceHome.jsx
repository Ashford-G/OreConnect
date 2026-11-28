import React from "react";
import {
  ArrowRight,
  Building2,
  HardHat,
  MessageSquare,
  RefreshCw,
  Search,
  ShieldCheck,
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
  if (amount === null || amount === undefined || amount === "") {
    return "Price on request";
  }
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(amount));
  } catch {
    return `${amount} ${currency}`;
  }
};

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "Not specified";

function Empty({ title = "Nothing published here yet", children }) {
  return (
    <div className="oc-empty">
      <span>{title}</span>
      <p>{children}</p>
    </div>
  );
}

function CompanyCard({ company }) {
  return (
    <article className="oc-company-card">
      <div className="oc-card-top">
        <span className="oc-card-icon">
          <Building2 size={18} />
        </span>
        <span className={`oc-status ${company.verification_status || "pending"}`}>
          {(company.verification_status || "pending review").replaceAll("_", " ")}
        </span>
      </div>
      <h3>{companyName(company)}</h3>
      <span className="oc-card-type">
        {(company.business_type || "Mining business").replaceAll("_", " ")}
      </span>
      <p>{company.description || "Mining sector business profile."}</p>
      <small>
        {company.city || "Zimbabwe"}
        {company.province ? `, ${company.province}` : ""}
      </small>
    </article>
  );
}

function ListingCard({ item }) {
  return (
    <article className="oc-listing-card">
      <div className="oc-listing-top">
        <span>{(item.category || "Marketplace").replaceAll("_", " ")}</span>
        <strong>{money(item.price, item.currency)}</strong>
      </div>
      <h3>{item.title}</h3>
      <p>
        {item.description ||
          "Contact the company through OreConnect for more details."}
      </p>
      <div className="oc-listing-meta">
        <span>{companyName(item.companies)}</span>
        <span>{item.location || item.companies?.city || "Zimbabwe"}</span>
      </div>
      <small>
        {item.quantity ? `${item.quantity} ${item.unit || ""}` : "Quantity on request"} ·{" "}
        {formatDate(item.created_at)}
      </small>
    </article>
  );
}

function RequestCard({ item }) {
  return (
    <article className="oc-request-card">
      <span className="oc-request-category">
        {(item.category || "Procurement").replaceAll("_", " ")}
      </span>
      <h3>{item.title}</h3>
      <p>
        {item.description || "Request details available to registered businesses."}
      </p>
      <div className="oc-listing-meta">
        <span>{companyName(item.companies)}</span>
        <span>
          {item.delivery_location || item.companies?.city || "Location flexible"}
        </span>
      </div>
      <small>Required by: {formatDate(item.required_by)}</small>
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
  const selectCategory = (value) => {
    setCategoryFilter(value);
    document
      .querySelector(".oc-discovery")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="oc-public-shell">
      <header className="oc-public-header">
        <div className="oc-public-header-inner">
          <a href="#top" className="oc-public-brand">
            <span className="oc-public-brand-mark">
              <HardHat size={18} />
            </span>
            <span>
              Ore<em>Connect</em>
            </span>
          </a>

          <nav className="oc-public-nav" aria-label="Primary navigation">
            <a href="#directory">Directory</a>
            <a href="#marketplace">Marketplace</a>
            <a href="#procurement">Procurement</a>
          </nav>

          <div className="oc-public-actions">
            <button type="button" className="oc-btn-link" onClick={onSignIn}>
              Sign in
            </button>
            <button type="button" className="oc-button forest" onClick={onSignUp}>
              Create account
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="oc-market-home">
        <section className="oc-hero-new">
          <div className="oc-hero-copy">
            <div className="oc-overline">
              <i /> ZIMBABWE&apos;S MINING BUSINESS NETWORK
            </div>
            <h1>
              The connections
              <br />
              behind <em>every mine.</em>
            </h1>
            <p>
              Find mining suppliers, equipment, contractors, and specialist
              services. Connect with verified businesses that keep mining
              operations moving.
            </p>
            <div className="oc-hero-buttons">
              <button type="button" className="oc-button gold" onClick={onSignUp}>
                Create a business account <ArrowRight size={16} />
              </button>
              <button
                type="button"
                className="oc-button outline"
                onClick={onSignIn}
              >
                Sign in
              </button>
            </div>
            <div className="oc-proof">
              <span>
                <ShieldCheck size={15} /> Company profiles subject to review
              </span>
              <span>
                <MessageSquare size={15} /> Structured RFQs and quotations
              </span>
            </div>
          </div>

          <div className="oc-hero-image">
            <div className="oc-photo-caption">
              <HardHat size={18} />
              <span>
                <b>Built around mining</b>
                <small>From the mine site to its supply chain</small>
              </span>
            </div>
          </div>
        </section>

        <div className="oc-container">
          <section className="oc-discovery oc-search-panel">
            <div>
              <label>DISCOVER ORECONNECT</label>
              <h2>What are you looking for?</h2>
              <p>Search registered company profiles and published opportunities.</p>
            </div>
            <div className="oc-search-controls">
              <div className="oc-search-input">
                <Search size={17} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Company, equipment, service or location"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="Filter category"
              >
                <option value="">All categories</option>
                {CATEGORIES.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="oc-button forest"
                onClick={onRefresh}
              >
                <Search size={15} /> Search
              </button>
            </div>
          </section>

          <section className="oc-category-block">
            <div className="oc-section-heading">
              <div>
                <label>EXPLORE THE INDUSTRY</label>
                <h2>Browse by category</h2>
              </div>
              <small>Select a category to filter available results</small>
            </div>
            <div className="oc-category-grid">
              {CATEGORIES.map(([v, l], i) => (
                <button
                  type="button"
                  key={v}
                  className={categoryFilter === v ? "selected" : ""}
                  onClick={() => selectCategory(categoryFilter === v ? "" : v)}
                >
                  <small>0{i + 1}</small>
                  <b>{l}</b>
                  <ArrowRight size={15} />
                </button>
              ))}
            </div>
          </section>

          <section id="directory" className="oc-results-layout">
            <div>
              <div className="oc-section-heading">
                <div>
                  <label>BUSINESS DIRECTORY</label>
                  <h2>Mining companies</h2>
                  <p>Discover businesses registered on OreConnect.</p>
                </div>
                <button
                  type="button"
                  className="oc-refresh"
                  onClick={onRefresh}
                >
                  Refresh <RefreshCw size={14} />
                </button>
              </div>
              <div className="oc-company-grid">
                {companies.slice(0, 6).map((c) => (
                  <CompanyCard key={c.id} company={c} />
                ))}
                {companies.length === 0 && (
                  <Empty title="No verified companies found.">
                    No company profiles match your search yet. Register your
                    business to establish its presence.
                  </Empty>
                )}
              </div>
            </div>

            <aside>
              <div id="marketplace" className="oc-section-heading">
                <div>
                  <label>MARKETPLACE</label>
                  <h2>Latest listings</h2>
                </div>
              </div>
              <div className="oc-result-stack">
                {listings.slice(0, 4).map((x) => (
                  <ListingCard key={x.id} item={x} />
                ))}
                {listings.length === 0 && (
                  <Empty title="No listings available yet.">
                    Approved public listings will appear here when businesses
                    publish them.
                  </Empty>
                )}
              </div>

              <div className="oc-aside-rule" />

              <div id="procurement" className="oc-section-heading">
                <div>
                  <label>PROCUREMENT</label>
                  <h2>Open requests</h2>
                </div>
              </div>
              <div className="oc-result-stack">
                {rfqs.slice(0, 4).map((x) => (
                  <RequestCard key={x.id} item={x} />
                ))}
                {rfqs.length === 0 && (
                  <Empty title="No open requests at the moment.">
                    Public requests for quotation will appear here as buyers
                    publish them.
                  </Empty>
                )}
              </div>
            </aside>
          </section>

          <section className="oc-join">
            <div>
              <label>JOIN THE NETWORK</label>
              <h2>Make your business easier to find.</h2>
              <p>
                Create a company profile, publish listings, and respond to
                procurement requests across the mining sector.
              </p>
            </div>
            <button type="button" className="oc-button gold" onClick={onSignUp}>
              Get started <ArrowRight size={16} />
            </button>
          </section>

          <footer className="oc-footer">
            <b>ORECONNECT</b>
            <span>Zimbabwe-first mining business ecosystem</span>
            <small>
              Company verification is subject to review. Payments and escrow are
              not currently processed.
            </small>
          </footer>
        </div>
      </main>
    </div>
  );
}
