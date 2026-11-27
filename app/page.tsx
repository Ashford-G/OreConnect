import Link from "next/link";

const categories = [
  ["⚒", "Minerals & resources", "Explore mineral-sector opportunities subject to applicable permits."],
  ["🚜", "Equipment & machinery", "Discover heavy machinery, parts, tools and equipment providers."],
  ["▣", "Suppliers & materials", "Source PPE, consumables and essential mine supplies."],
  ["⇄", "Logistics & transport", "Connect with haulage, freight and site transport companies."],
  ["⚙", "Mining services", "Find engineering, geology, surveying and specialist contractors."],
  ["⌕", "Laboratories & assaying", "Discover sampling, testing and laboratory service providers."],
  ["▤", "Jobs & opportunities", "Explore mining vacancies, tenders and projects."],
  ["⌖", "Mines & companies", "Find mining businesses and potential customers across the region."]
];

export default function Home() {
  return (
    <main className="ore-shell">
      <header className="ore-header">
        <Link href="/" className="ore-brand">
          <img src="/oreconnect-mark.svg" alt="OreConnect mark" />
          <span>
            <span className="ore-brand-name">Ore<span>Connect</span></span>
            <span className="ore-brand-tag">Mine · Trade · Grow</span>
          </span>
        </Link>
        <nav className="ore-nav" aria-label="Main navigation">
          <Link href="/">Home</Link>
          <Link href="/marketplace">Minerals</Link>
          <Link href="/marketplace">Companies</Link>
          <Link href="/marketplace">Marketplace</Link>
          <a href="#services">Services</a>
          <Link href="/marketplace">Jobs</Link>
          <Link href="/marketplace">Map</Link>
          <Link href="/marketplace">Prices</Link>
        </nav>
        <div className="ore-actions">
          <Link className="ore-login" href="/login">Log in</Link>
          <Link className="ore-signup" href="/register">Sign up</Link>
        </div>
      </header>

      <section className="ore-hero">
        <div className="ore-hero-content">
          <div className="ore-kicker">Zimbabwe’s mining business ecosystem</div>
          <h1>Dig deep.<span>Trade verified.</span></h1>
          <p className="ore-lead">Connect mines, suppliers, logistics companies and mining service providers across Zimbabwe and beyond.</p>
          <form className="ore-search" action="/marketplace" method="get">
            <input name="q" type="search" placeholder="Search for minerals, equipment, suppliers, services…" aria-label="Search OreConnect" />
            <button type="submit">Search&nbsp; →</button>
          </form>
          <div className="ore-quicklinks">
            <Link href="/marketplace">Find suppliers</Link>
            <Link href="/marketplace">Browse equipment</Link>
            <Link href="/marketplace">Find logistics</Link>
            <Link href="/marketplace">Mining services</Link>
          </div>
          <div className="ore-benefits">
            <div className="ore-benefit"><i>✓</i><b>Verified businesses</b><span>Discover companies with reviewed profiles.</span></div>
            <div className="ore-benefit"><i>⇄</i><b>RFQs & quotations</b><span>Bring sourcing conversations together.</span></div>
            <div className="ore-benefit"><i>⌑</i><b>Private communication</b><span>Keep business contact details protected.</span></div>
            <div className="ore-benefit"><i>◈</i><b>Zimbabwe focused</b><span>Built around the mining value chain.</span></div>
          </div>
        </div>
      </section>

      <div className="ore-ecosystem">
        <div className="ore-ecosystem-copy">
          <strong>A complete mining ecosystem</strong>
          <span>From the mine to the market — connect the businesses that keep mining moving.</span>
        </div>
        <div className="ore-ecosystem-items">
          <span><b>01</b> Equipment</span><span><b>02</b> Suppliers</span><span><b>03</b> Logistics</span><span><b>04</b> Laboratories</span><span><b>05</b> Services</span><span><b>06</b> Tenders & RFQs</span>
        </div>
        <Link className="ore-join" href="/register">Join OreConnect <span>→</span></Link>
      </div>

      <section className="ore-sections" id="services">
        <div className="ore-section-head">
          <div><small>One connected network</small><h2>Everything around the mine.</h2></div>
          <Link href="/marketplace">Explore marketplace →</Link>
        </div>
        <div className="ore-category-grid">
          {categories.map(([icon, title, description]) => (
            <article className="ore-category" key={title}>
              <i>{icon}</i><b>{title}</b><p>{description}</p>
            </article>
          ))}
        </div>
      </section>
      <footer className="ore-footer">
        OreConnect · Connecting the mining value chain. Mineral listings and transactions are subject to applicable laws, permits and platform compliance rules. Gold delivery records are not gold sale listings.
      </footer>
    </main>
  );
}
