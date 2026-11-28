

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowRight, BadgeCheck, Building2, CheckCircle2, ChevronDown,
  CircleHelp, ClipboardList, FilePlus2, HardHat, LayoutDashboard, LogIn,
  LogOut, Menu, MessageSquare, Package, Plus, Search, ShieldCheck, Truck,
  UserRound, X, RefreshCw
} from "lucide-react";
import { hasSupabaseConfig, supabase } from "./lib/supabase";
import "./app.css";
import PublicMarketplaceHome from "./components/PublicMarketplaceHome";
import "./oreconnect-home.css";
import "./oreconnect-design.css";

const BUSINESS_TYPES = [
  ["mine_operator", "Mine operator"],
  ["mining_contractor", "Mining contractor"],
  ["equipment_supplier", "Equipment supplier"],
  ["consumables_supplier", "Consumables supplier"],
  ["logistics_provider", "Logistics provider"],
  ["assay_lab", "Assay laboratory"],
  ["professional_services", "Professional services"],
  ["rental_provider", "Equipment rental provider"],
  ["buyer_offtaker", "Buyer / offtaker"],
  ["other", "Other mining business"],
];

const CATEGORIES = [
  ["equipment", "Equipment & machinery"],
  ["supplies", "PPE & consumables"],
  ["logistics", "Transport & logistics"],
  ["services", "Mining services"],
  ["rentals", "Equipment rentals"],
  ["jobs", "Jobs & recruitment"],
];

const money = (amount, currency = "USD") => {
  if (amount === null || amount === undefined || amount === "") return "Price on request";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount));
};

const niceDate = (value) => value ? new Date(value).toLocaleDateString() : "Not specified";
const messageOf = (error) => error?.message || "Something went wrong. Please try again.";
const companyLabel = (company) => company?.trading_name || company?.legal_name || "Mining business";
const statusLabel = (value) => (value || "unknown").replaceAll("_", " ");

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [activeCompanyId, setActiveCompanyId] = useState("");
  const [listings, setListings] = useState([]);
  const [rfqs, setRfqs] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [directory, setDirectory] = useState([]);
  const [tab, setTab] = useState("overview");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({ type: "", text: "" });
  const [authMode, setAuthMode] = useState("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [confirmationPending, setConfirmationPending] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showCompany, setShowCompany] = useState(false);
  const [showListing, setShowListing] = useState(false);
  const [showRfq, setShowRfq] = useState(false);
  const [showQuote, setShowQuote] = useState(null);
  const [mobileNav, setMobileNav] = useState(false);

  const activeCompany = useMemo(
    () => companies.find((item) => item.id === activeCompanyId) || companies[0] || null,
    [companies, activeCompanyId]
  );

  const flash = (text, type = "success") => {
    setNotice({ text, type });
    window.setTimeout(() => setNotice({ text: "", type: "" }), 5500);
  };

  const loadPublic = useCallback(async () => {
    const [companyResult, listingResult, rfqResult] = await Promise.all([
      supabase.from("companies")
        .select("id,legal_name,trading_name,business_type,country_code,province,city,description,website,logo_path,verification_status,created_at")
        .eq("is_active", true).order("created_at", { ascending: false }).limit(60),
      supabase.from("listings")
        .select("id,company_id,category,title,description,price,currency,quantity,unit,location,status,created_at,companies(id,legal_name,trading_name,business_type,city,province,verification_status)")
        .eq("status", "published").order("created_at", { ascending: false }).limit(60),
      supabase.from("rfqs")
        .select("id,buyer_company_id,category,title,description,quantity,unit,delivery_location,required_by,budget_min,budget_max,currency,status,created_at,companies(id,legal_name,trading_name,city,province,verification_status)")
        .eq("visibility", "public").in("status", ["open", "under_review"])
        .order("created_at", { ascending: false }).limit(60),
    ]);

    if (!companyResult.error) setDirectory(companyResult.data || []);
    if (!listingResult.error) setListings(listingResult.data || []);
    if (!rfqResult.error) setRfqs(rfqResult.data || []);
  }, []);

  const loadPrivate = useCallback(async (userId) => {
    if (!userId) return;

    const [profileResult, memberResult] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("company_members")
        .select("company_id,role,status,companies(id,legal_name,trading_name,business_type,country_code,province,city,description,website,verification_status,is_active)")
        .eq("user_id", userId).eq("status", "active"),
    ]);

    if (!profileResult.error) setProfile(profileResult.data);

    if (!memberResult.error) {
      const nextCompanies = (memberResult.data || []).map((row) => ({
        ...row.companies,
        member_role: row.role,
      }));

      setCompanies(nextCompanies);
      setActiveCompanyId((current) =>
        nextCompanies.some((c) => c.id === current)
          ? current
          : nextCompanies[0]?.id || ""
      );
    }
  }, []);

  const loadWorkspace = useCallback(async () => {
    if (!session?.user?.id) return;

    const companyIds = companies.map((company) => company.id);

    if (!companyIds.length) {
      setQuotes([]);
      setOrders([]);
      return;
    }

    const [supplierQuoteResult, ownRfqResult, orderResult] = await Promise.all([
      supabase.from("quotes")
        .select("id,rfq_id,supplier_company_id,amount,currency,lead_time_days,validity_until,notes,status,created_at,rfqs(id,title,buyer_company_id,category)")
        .in("supplier_company_id", companyIds)
        .order("created_at", { ascending: false }).limit(80),
      supabase.from("rfqs").select("id").in("buyer_company_id", companyIds),
      supabase.from("orders")
        .select("id,rfq_id,quote_id,buyer_company_id,supplier_company_id,amount,currency,status,created_at")
        .or(`buyer_company_id.in.(${companyIds.join(",")}),supplier_company_id.in.(${companyIds.join(",")})`)
        .order("created_at", { ascending: false }).limit(80),
    ]);

    let buyerQuotes = [];
    const ownRfqIds = (ownRfqResult.data || []).map((row) => row.id);

    if (ownRfqIds.length) {
      const buyerQuoteResult = await supabase.from("quotes")
        .select("id,rfq_id,supplier_company_id,amount,currency,lead_time_days,validity_until,notes,status,created_at,rfqs(id,title,buyer_company_id,category)")
        .in("rfq_id", ownRfqIds)
        .order("created_at", { ascending: false }).limit(80);

      if (!buyerQuoteResult.error) buyerQuotes = buyerQuoteResult.data || [];
    }

    if (!supplierQuoteResult.error) {
      const merged = new Map();
      [...(supplierQuoteResult.data || []), ...buyerQuotes].forEach((quote) =>
        merged.set(quote.id, quote)
      );
      setQuotes([...merged.values()]);
    }

    if (!orderResult.error) setOrders(orderResult.data || []);
  }, [session, companies]);

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;

      setSession(data.session);

      if (data.session?.user) {
        await loadPrivate(data.session.user.id);
      }

      await loadPublic();

      if (mounted) setLoading(false);
    }).catch(() => mounted && setLoading(false));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);

      if (nextSession?.user) {
        Promise.resolve().then(() => loadPrivate(nextSession.user.id));
      } else {
        setProfile(null);
        setCompanies([]);
        setActiveCompanyId("");
        setQuotes([]);
        setOrders([]);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadPrivate, loadPublic]);

  useEffect(() => {
    if (session && companies.length) loadWorkspace();
  }, [session, companies, loadWorkspace]);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      flash(messageOf(error), "error");
    } else {
      flash("You have signed out.");
      setTab("overview");
    }
  };

  // SIGNUP AND SIGN-IN
  const handleAuth = async (event) => {
    event.preventDefault();
    setBusy(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");

    // Keep the signup modal open when email confirmation is required.
    let keepAuthOpen = false;

    try {
      if (authMode === "signup") {
        const fullName = String(form.get("full_name") || "").trim();

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: "https://ore-connect-liart.vercel.app",
          },
        });

        if (error) throw error;

        if (data.session) {
          setSession(data.session);
          await loadPrivate(data.user.id);
          setConfirmationPending(false);
          flash("Account created. Welcome to OreConnect.");
        } else {
          setAuthEmail(email);
          setConfirmationPending(true);
          keepAuthOpen = true;

          flash(
            "Account created. Check your email to confirm your address. You can resend the confirmation from this screen.",
            "info"
          );
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        setSession(data.session);
        await loadPrivate(data.user.id);
        setConfirmationPending(false);
        flash("Welcome back.");
      }

      if (!keepAuthOpen) setShowAuth(false);
    } catch (error) {
      flash(messageOf(error), "error");
    } finally {
      setBusy(false);
    }
  };

  // RESEND CONFIRMATION EMAIL
  const resendConfirmation = async () => {
    const email = authEmail.trim();

    if (!email) {
      return flash("Enter your email address first.", "error");
    }

    setBusy(true);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: "https://ore-connect-liart.vercel.app",
        },
      });

      if (error) throw error;

      flash(
        "If this address has an unconfirmed OreConnect account, a fresh confirmation email has been sent. Check your inbox and spam folder.",
        "info"
      );
    } catch (error) {
      flash(messageOf(error), "error");
    } finally {
      setBusy(false);
    }
  };

  const createCompany = async (event) => {
    event.preventDefault();
    setBusy(true);

    const form = new FormData(event.currentTarget);

    try {
      const args = {
        p_legal_name: String(form.get("legal_name")).trim(),
        p_trading_name: String(form.get("trading_name") || "").trim() || null,
        p_business_type: String(form.get("business_type")),
        p_country_code: String(form.get("country_code") || "ZW").toUpperCase(),
        p_province: String(form.get("province") || "").trim() || null,
        p_city: String(form.get("city") || "").trim() || null,
        p_description: String(form.get("description") || "").trim() || null,
      };

      const { error } = await supabase.rpc("create_company", args);
      if (error) throw error;

      await loadPrivate(session.user.id);
      await loadPublic();
      setShowCompany(false);

      flash("Company profile created. It will appear as unverified until the OreConnect team reviews it.");
    } catch (error) {
      flash(messageOf(error), "error");
    } finally {
      setBusy(false);
    }
  };

  const createListing = async (event) => {
    event.preventDefault();

    if (!activeCompany) {
      return flash("Create or select a company first.", "error");
    }

    setBusy(true);

    const form = new FormData(event.currentTarget);
    const rawPrice = String(form.get("price") || "").trim();
    const rawQuantity = String(form.get("quantity") || "").trim();

    const payload = {
      company_id: activeCompany.id,
      created_by: session.user.id,
      category: String(form.get("category")),
      title: String(form.get("title")).trim(),
      description: String(form.get("description") || "").trim() || null,
      price: rawPrice ? Number(rawPrice) : null,
      currency: String(form.get("currency") || "USD"),
      quantity: rawQuantity ? Number(rawQuantity) : null,
      unit: String(form.get("unit") || "").trim() || null,
      location: String(form.get("location") || "").trim() || null,
      status: "draft",
    };

    try {
      const { error } = await supabase.from("listings").insert(payload);
      if (error) throw error;

      setShowListing(false);
      flash("Listing saved as a draft. It can be published after your company is verified.");
      await loadPublic();
    } catch (error) {
      flash(messageOf(error), "error");
    } finally {
      setBusy(false);
    }
  };

  const createRfq = async (event) => {
    event.preventDefault();

    if (!activeCompany) {
      return flash("Create or select a company first.", "error");
    }

    setBusy(true);

    const form = new FormData(event.currentTarget);
    const min = String(form.get("budget_min") || "").trim();
    const max = String(form.get("budget_max") || "").trim();
    const qty = String(form.get("quantity") || "").trim();

    const payload = {
      buyer_company_id: activeCompany.id,
      created_by: session.user.id,
      category: String(form.get("category")),
      title: String(form.get("title")).trim(),
      description: String(form.get("description")).trim(),
      quantity: qty ? Number(qty) : null,
      unit: String(form.get("unit") || "").trim() || null,
      delivery_location: String(form.get("delivery_location") || "").trim() || null,
      required_by: String(form.get("required_by") || "") || null,
      budget_min: min ? Number(min) : null,
      budget_max: max ? Number(max) : null,
      currency: String(form.get("currency") || "USD"),
      visibility: "public",
      status: "open",
    };

    try {
      const { error } = await supabase.from("rfqs").insert(payload);
      if (error) throw error;

      setShowRfq(false);
      flash("Request for quotation published.");
      await loadPublic();
    } catch (error) {
      flash(messageOf(error), "error");
    } finally {
      setBusy(false);
    }
  };

  const submitQuote = async (event) => {
    event.preventDefault();

    if (!activeCompany || !showQuote) return;

    setBusy(true);

    const form = new FormData(event.currentTarget);
    const amount = Number(form.get("amount"));

    try {
      const { error } = await supabase.from("quotes").insert({
        rfq_id: showQuote.id,
        supplier_company_id: activeCompany.id,
        created_by: session.user.id,
        amount,
        currency: String(form.get("currency") || "USD"),
        lead_time_days: form.get("lead_time_days")
          ? Number(form.get("lead_time_days"))
          : null,
        validity_until: String(form.get("validity_until") || "") || null,
        notes: String(form.get("notes") || "").trim() || null,
        status: "submitted",
      });

      if (error) throw error;

      setShowQuote(null);
      flash("Your quotation has been submitted.");
      await loadWorkspace();
    } catch (error) {
      flash(messageOf(error), "error");
    } finally {
      setBusy(false);
    }
  };

  const acceptQuote = async (quoteId) => {
    if (!window.confirm("Accept this quotation and create an order record? No payment or escrow will be taken.")) {
      return;
    }

    setBusy(true);

    try {
      const { data, error } = await supabase.rpc("accept_quote", {
        p_quote_id: quoteId,
      });

      if (error) throw error;

      flash(`Quotation accepted. Order ${String(data).slice(0, 8)} created. No payment was processed.`);
      await Promise.all([loadWorkspace(), loadPublic()]);
    } catch (error) {
      flash(messageOf(error), "error");
    } finally {
      setBusy(false);
    }
  };

  const markNotificationRead = async (id) => {
    await supabase.from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
  };

  const filteredCompanies = directory.filter((company) => {
    const text = `${companyLabel(company)} ${company.business_type} ${company.city || ""} ${company.province || ""} ${company.description || ""}`.toLowerCase();

    const categoryTypes = {
      equipment: ["equipment_supplier"],
      supplies: ["consumables_supplier"],
      logistics: ["logistics_provider"],
      services: ["professional_services", "assay_lab", "mining_contractor"],
      rentals: ["rental_provider"],
      jobs: ["mine_operator", "other"],
    };

    const typesForCategory = categoryTypes[categoryFilter];

    return text.includes(query.toLowerCase()) &&
      (!categoryFilter || !typesForCategory || typesForCategory.includes(company.business_type));
  });

  const filteredListings = listings.filter((item) => {
    const text = `${item.title} ${item.description || ""} ${item.companies?.trading_name || ""} ${item.location || ""}`.toLowerCase();

    return text.includes(query.toLowerCase()) &&
      (!categoryFilter || item.category === categoryFilter);
  });

  const filteredRfqs = rfqs.filter((item) => {
    const text = `${item.title} ${item.description || ""} ${item.companies?.trading_name || ""} ${item.delivery_location || ""}`.toLowerCase();

    return text.includes(query.toLowerCase()) &&
      (!categoryFilter || item.category === categoryFilter);
  });

  if (!hasSupabaseConfig) return <ConfigScreen />;

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="brand-mark">OC</div>
        <p>Loading OreConnect…</p>
      </div>
    );
  }

  const navItems = [
    ["overview", "Overview", LayoutDashboard],
    ["directory", "Company directory", Building2],
    ["listings", "Marketplace listings", Package],
    ["rfqs", "Requests for quotation", ClipboardList],
    ["workspace", "My workspace", Activity],
  ];

  return (
    <div className={`app-shell ${session ? "authenticated" : "public-mode"}`}>
      <header className="topbar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setTab("overview");
          }}
        >
          <span className="brand-mark"><HardHat size={20} /></span>
          <span>Ore<span>Connect</span></span>
        </a>

        <div className="topbar-right">
          {session ? (
            <>
              {companies.length > 0 && (
                <select
                  className="company-switch"
                  value={activeCompanyId}
                  onChange={(e) => setActiveCompanyId(e.target.value)}
                  aria-label="Active company"
                >
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {companyLabel(company)}
                    </option>
                  ))}
                </select>
              )}

              <span className="user-chip">
                <UserRound size={15} />
                {profile?.full_name || session.user.email}
              </span>

              <button className="icon-btn" onClick={signOut} title="Sign out">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <button
              className="btn btn-primary"
              onClick={() => {
                setAuthMode("signin");
                setShowAuth(true);
              }}
            >
              Sign in <LogIn size={16} />
            </button>
          )}

          <button
            className="icon-btn mobile-menu"
            onClick={() => setMobileNav(!mobileNav)}
            aria-label="Toggle navigation"
          >
            {mobileNav ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <div className="app-body">
        <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
          <div className="sidebar-label">WORKSPACE</div>

          {navItems.map(([id, label, Icon]) => (
            <button
              key={id}
              className={`nav-link ${tab === id ? "active" : ""}`}
              onClick={() => {
                setTab(id);
                setMobileNav(false);
              }}
            >
              <Icon size={18} />
              {label}
              {id === "workspace" && orders.length > 0 && (
                <span className="nav-count">{orders.length}</span>
              )}
            </button>
          ))}

          <div className="sidebar-divider" />
          <div className="sidebar-label">YOUR BUSINESS</div>

          <button className="nav-link" onClick={() => setShowCompany(true)}>
            <Plus size={18} /> Add a company
          </button>

          <div className="sidebar-card">
            <ShieldCheck size={20} />
            <strong>Trust starts with verification</strong>
            <p>Complete your company profile and submit documents for review.</p>
            <button onClick={() => setTab("workspace")}>
              View verification <ArrowRight size={14} />
            </button>
          </div>

          <p className="sidebar-foot">ORECONNECT · ZIMBABWE</p>
        </aside>

        <main className="main-content">
          <div className="mobile-brand-row">
            <span>ORECONNECT / {tab.replaceAll("_", " ")}</span>
          </div>

          {notice.text && (
            <div className={`notice ${notice.type}`}>
              <span>{notice.text}</span>
              <button onClick={() => setNotice({ text: "", type: "" })}>
                <X size={16} />
              </button>
            </div>
          )}

          {!session ? (
            <PublicMarketplaceHome
              companies={filteredCompanies}
              listings={filteredListings}
              rfqs={filteredRfqs}
              query={query}
              setQuery={setQuery}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              onSignIn={() => {
                setAuthMode("signin");
                setConfirmationPending(false);
                setShowAuth(true);
              }}
              onSignUp={() => {
                setAuthMode("signup");
                setConfirmationPending(false);
                setShowAuth(true);
              }}
              onRefresh={loadPublic}
            />
          ) : (
            <>
              {tab === "overview" && (
                <Overview
                  session={session}
                  profile={profile}
                  companies={companies}
                  activeCompany={activeCompany}
                  listings={listings}
                  rfqs={rfqs}
                  orders={orders}
                  onAddCompany={() => setShowCompany(true)}
                  onCreateListing={() => setShowListing(true)}
                  onCreateRfq={() => setShowRfq(true)}
                  onNavigate={setTab}
                />
              )}

              {tab === "directory" && (
                <Directory
                  companies={filteredCompanies}
                  query={query}
                  setQuery={setQuery}
                  categoryFilter={categoryFilter}
                  setCategoryFilter={setCategoryFilter}
                  onRefresh={loadPublic}
                />
              )}

              {tab === "listings" && (
                <ListingsPage
                  listings={filteredListings}
                  query={query}
                  setQuery={setQuery}
                  categoryFilter={categoryFilter}
                  setCategoryFilter={setCategoryFilter}
                  onCreate={() => setShowListing(true)}
                  onRefresh={loadPublic}
                />
              )}

              {tab === "rfqs" && (
                <RfqPage
                  rfqs={filteredRfqs}
                  query={query}
                  setQuery={setQuery}
                  categoryFilter={categoryFilter}
                  setCategoryFilter={setCategoryFilter}
                  onCreate={() => setShowRfq(true)}
                  onQuote={setShowQuote}
                  activeCompany={activeCompany}
                />
              )}

              {tab === "workspace" && (
                <Workspace
                  session={session}
                  profile={profile}
                  companies={companies}
                  activeCompany={activeCompany}
                  quotes={quotes}
                  orders={orders}
                  onAddCompany={() => setShowCompany(true)}
                  onAcceptQuote={acceptQuote}
                  busy={busy}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* AUTHENTICATION MODAL */}
      {showAuth && (
        <Modal
          title={authMode === "signin" ? "Sign in to OreConnect" : "Create your OreConnect account"}
          onClose={() => setShowAuth(false)}
        >
          <form className="form-stack" onSubmit={handleAuth}>
            {authMode === "signup" && (
              <Field label="Full name">
                <input
                  name="full_name"
                  required
                  minLength="2"
                  placeholder="Your full name"
                />
              </Field>
            )}

            <Field label="Email address">
              <input
                name="email"
                type="email"
                required
                placeholder="you@company.com"
                autoComplete="email"
                value={authEmail}
                onChange={(event) => setAuthEmail(event.target.value)}
              />
            </Field>

            <Field label="Password">
              <input
                name="password"
                type="password"
                required
                minLength="8"
                placeholder="At least 8 characters"
                autoComplete={authMode === "signup" ? "new-password" : "current-password"}
              />
            </Field>

            <button className="btn btn-primary btn-wide" disabled={busy}>
              {busy
                ? "Please wait…"
                : authMode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </button>

            <p className="form-switch">
              {authMode === "signin" ? "New to OreConnect?" : "Already registered?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === "signin" ? "signup" : "signin");
                  setConfirmationPending(false);
                }}
              >
                {authMode === "signin" ? "Create an account" : "Sign in"}
              </button>
            </p>

            {/* RESEND BUTTON ONLY AFTER SIGNUP REQUIRES CONFIRMATION */}
            {authMode === "signup" && confirmationPending && (
              <button
                type="button"
                className="btn btn-secondary btn-wide"
                onClick={resendConfirmation}
                disabled={busy || !authEmail.trim()}
              >
                {busy ? "Please wait…" : "Resend confirmation email"}
              </button>
            )}
          </form>
        </Modal>
      )}

      {showCompany && (
        <Modal title="Register a company" onClose={() => setShowCompany(false)}>
          {!session ? (
            <SignInPrompt
              onClick={() => {
                setShowCompany(false);
                setShowAuth(true);
              }}
            />
          ) : (
            <form className="form-stack" onSubmit={createCompany}>
              <p className="muted small">
                Use the company's registered legal name. Your profile will be marked unverified until reviewed.
              </p>

              <Field label="Legal company name">
                <input name="legal_name" required minLength="2" placeholder="Registered company name" />
              </Field>

              <Field label="Trading name (optional)">
                <input name="trading_name" placeholder="Name customers know you by" />
              </Field>

              <Field label="Business type">
                <select name="business_type" required defaultValue="other">
                  {BUSINESS_TYPES.map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </Field>

              <div className="form-grid">
                <Field label="Country code">
                  <input name="country_code" defaultValue="ZW" maxLength="2" required />
                </Field>
                <Field label="Province">
                  <input name="province" placeholder="e.g. Mashonaland West" />
                </Field>
              </div>

              <Field label="City / town">
                <input name="city" placeholder="e.g. Kwekwe" />
              </Field>

              <Field label="Business description">
                <textarea name="description" rows="3" placeholder="What does your company do in the mining sector?" />
              </Field>

              <button className="btn btn-primary btn-wide" disabled={busy}>
                {busy ? "Creating…" : "Create company profile"}
              </button>
            </form>
          )}
        </Modal>
      )}

      {showListing && (
        <Modal title="Create a marketplace listing" onClose={() => setShowListing(false)}>
          {!activeCompany ? (
            <SignInPrompt
              text="Register a company before creating a listing."
              onClick={() => setShowCompany(true)}
            />
          ) : (
            <form className="form-stack" onSubmit={createListing}>
              <p className="muted small">
                Listings are saved as drafts. Publishing is restricted to verified companies. Mineral trading is not enabled in this first release.
              </p>

              <Field label="Category">
                <select name="category" required>
                  {CATEGORIES.filter(([v]) => v !== "jobs").map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </Field>

              <Field label="Listing title">
                <input name="title" required minLength="3" placeholder="e.g. 20-ton excavator available for hire" />
              </Field>

              <Field label="Description">
                <textarea name="description" rows="4" placeholder="Describe specifications, condition, availability and terms." />
              </Field>

              <div className="form-grid">
                <Field label="Price (optional)">
                  <input name="price" type="number" min="0" step="0.01" placeholder="0.00" />
                </Field>
                <Field label="Currency">
                  <select name="currency">
                    <option>USD</option>
                    <option>ZiG</option>
                    <option>ZAR</option>
                  </select>
                </Field>
              </div>

              <div className="form-grid">
                <Field label="Quantity (optional)">
                  <input name="quantity" type="number" min="0" step="0.01" />
                </Field>
                <Field label="Unit">
                  <input name="unit" placeholder="units, tonnes, days…" />
                </Field>
              </div>

              <Field label="Location">
                <input name="location" placeholder="Town / province" />
              </Field>

              <button className="btn btn-primary btn-wide" disabled={busy}>
                {busy ? "Saving…" : "Save as draft"}
              </button>
            </form>
          )}
        </Modal>
      )}

      {showRfq && (
        <Modal title="Create a request for quotation" onClose={() => setShowRfq(false)}>
          {!activeCompany ? (
            <SignInPrompt
              text="Register a company before requesting quotations."
              onClick={() => setShowCompany(true)}
            />
          ) : (
            <form className="form-stack" onSubmit={createRfq}>
              <p className="muted small">
                Describe what your business needs. Public RFQs can be discovered by eligible suppliers.
              </p>

              <Field label="Category">
                <select name="category" required>
                  {CATEGORIES.filter(([v]) => v !== "jobs").map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </Field>

              <Field label="Request title">
                <input name="title" required minLength="3" placeholder="e.g. Request for 2 x 30-ton excavators" />
              </Field>

              <Field label="Requirements">
                <textarea name="description" rows="4" required minLength="10" placeholder="Specifications, quality requirements, quantities and commercial terms…" />
              </Field>

              <div className="form-grid">
                <Field label="Quantity">
                  <input name="quantity" type="number" min="0" step="0.01" />
                </Field>
                <Field label="Unit">
                  <input name="unit" placeholder="units, tonnes, loads…" />
                </Field>
              </div>

              <Field label="Delivery location">
                <input name="delivery_location" placeholder="Mine site / town / province" />
              </Field>

              <Field label="Required by">
                <input name="required_by" type="date" />
              </Field>

              <div className="form-grid">
                <Field label="Minimum budget">
                  <input name="budget_min" type="number" min="0" step="0.01" />
                </Field>
                <Field label="Maximum budget">
                  <input name="budget_max" type="number" min="0" step="0.01" />
                </Field>
              </div>

              <Field label="Currency">
                <select name="currency">
                  <option>USD</option>
                  <option>ZiG</option>
                  <option>ZAR</option>
                </select>
              </Field>

              <button className="btn btn-primary btn-wide" disabled={busy}>
                {busy ? "Publishing…" : "Publish RFQ"}
              </button>
            </form>
          )}
        </Modal>
      )}

      {showQuote && (
        <Modal title="Submit a quotation" onClose={() => setShowQuote(null)}>
          {!activeCompany ? (
            <SignInPrompt
              text="Register a supplier company before submitting a quote."
              onClick={() => setShowCompany(true)}
            />
          ) : (
            <form className="form-stack" onSubmit={submitQuote}>
              <div className="quote-context">
                <strong>{showQuote.title}</strong>
                <span>{companyLabel(showQuote.companies)}</span>
              </div>

              <Field label="Your quoted total">
                <input name="amount" type="number" min="0.01" step="0.01" required />
              </Field>

              <Field label="Currency">
                <select name="currency">
                  <option>USD</option>
                  <option>ZiG</option>
                  <option>ZAR</option>
                </select>
              </Field>

              <Field label="Estimated lead time (days)">
                <input name="lead_time_days" type="number" min="1" />
              </Field>

              <Field label="Quote valid until">
                <input name="validity_until" type="date" />
              </Field>

              <Field label="Notes / commercial terms">
                <textarea name="notes" rows="3" placeholder="Delivery, warranty, payment terms, exclusions…" />
              </Field>

              <button className="btn btn-primary btn-wide" disabled={busy}>
                {busy ? "Submitting…" : "Submit quotation"}
              </button>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}

function ConfigScreen() {
  return (
    <div className="config-screen">
      <div className="config-card">
        <div className="brand-mark"><HardHat /></div>
        <p className="eyebrow">ORECONNECT SETUP</p>
        <h1>Connect your Supabase project</h1>
        <p>
          The frontend is ready, but Vercel has not supplied the required environment variables to this deployment.
        </p>
        <div className="code-note">
          <b>VITE_SUPABASE_URL</b>
          <b>VITE_SUPABASE_ANON_KEY</b>
        </div>
        <p className="muted">
          In Vercel, set both as Config variables for Production, Preview and Development, then redeploy. Use the Supabase project URL and Publishable key only.
        </p>
      </div>
    </div>
  );
}

function PublicHome({
  companies, listings, rfqs, query, setQuery, categoryFilter,
  setCategoryFilter, onSignIn, onSignUp, onRefresh,
}) {
  return (
    <div className="public-home">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow light">THE MINING BUSINESS NETWORK</span>
          <h1>Find the right partners.<br /><em>Build stronger mines.</em></h1>
          <p>
            Discover mining companies, equipment suppliers, contractors, logistics providers and professional services in one connected marketplace.
          </p>
          <div className="hero-actions">
            <button className="btn btn-gold" onClick={onSignUp}>
              Join OreConnect <ArrowRight size={17} />
            </button>
            <button className="btn btn-outline-light" onClick={onSignIn}>
              Sign in
            </button>
          </div>
          <div className="hero-proof">
            <span><ShieldCheck size={16} /> Company verification workflow</span>
            <span><MessageSquare size={16} /> RFQs and supplier quotations</span>
          </div>
        </div>

        <div className="hero-art">
          <div className="mine-image" />
          <div className="hero-art-caption">
            <span className="pulse-dot" /> Built for the mining value chain
          </div>
        </div>
      </section>

      <section className="public-search">
        <div>
          <span className="eyebrow">DISCOVER THE ECOSYSTEM</span>
          <h2>What does your operation need?</h2>
        </div>

        <div className="search-controls">
          <div className="search-box">
            <Search size={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search companies, services, equipment…"
            />
          </div>

          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </section>

      <section className="public-grid">
        <div className="public-section">
          <SectionHeading label="COMPANIES" title="Mining businesses" action={onRefresh} />
          <div className="company-grid">
            {companies.slice(0, 6).map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
            {companies.length === 0 && (
              <Empty text="No matching companies yet. Be among the first to register." />
            )}
          </div>
        </div>

        <div className="public-section">
          <SectionHeading label="MARKETPLACE" title="Recent listings" action={onRefresh} />
          <div className="stack-cards">
            {listings.slice(0, 5).map((item) => (
              <ListingCard key={item.id} item={item} />
            ))}
            {listings.length === 0 && (
              <Empty text="No published listings yet. Listings appear after company verification and approval." />
            )}
          </div>
        </div>

        <div className="public-section">
          <SectionHeading label="PROCUREMENT" title="Open requests" action={onRefresh} />
          <div className="stack-cards">
            {rfqs.slice(0, 5).map((item) => (
              <RfqCard key={item.id} item={item} />
            ))}
            {rfqs.length === 0 && <Empty text="No public requests at the moment." />}
          </div>
        </div>
      </section>

      <div className="public-cta">
        <div>
          <span className="eyebrow light">ONE CONNECTED INDUSTRY</span>
          <h2>Your next mining partner could be here.</h2>
          <p>Create a company profile to discover opportunities and respond to procurement needs.</p>
        </div>
        <button className="btn btn-gold" onClick={onSignUp}>
          Create your account <ArrowRight size={16} />
        </button>
      </div>

      <footer className="public-footer">
        <span>© {new Date().getFullYear()} OreConnect</span>
        <span>Zimbabwe-first mining business ecosystem</span>
        <span>Verification is subject to review. No payments or escrow are currently processed.</span>
      </footer>
    </div>
  );
}

function Overview({
  session, profile, companies, activeCompany, listings, rfqs, orders,
  onAddCompany, onCreateListing, onCreateRfq, onNavigate,
}) {
  const ownListings = listings.filter((item) =>
    companies.some((c) => c.id === item.company_id)
  );

  const ownRfqs = rfqs.filter((item) =>
    companies.some((c) => c.id === item.buyer_company_id)
  );

  return (
    <div className="page">
      <PageHeading
        eyebrow="YOUR ORECONNECT"
        title={`Good to see you${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.`}
        subtitle="Your mining business activity, all in one place."
      />

      {!activeCompany ? (
        <div className="welcome-panel">
          <div className="welcome-icon"><Building2 size={28} /></div>
          <div>
            <h2>Start by registering your company</h2>
            <p>
              OreConnect is designed around verified business profiles. Register your company to list services, request quotations and connect with suppliers.
            </p>
            <button className="btn btn-primary" onClick={onAddCompany}>
              Register company <ArrowRight size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className="company-banner">
          <div className="company-avatar"><Building2 size={24} /></div>
          <div className="company-banner-copy">
            <span className="eyebrow">ACTIVE COMPANY</span>
            <h2>{companyLabel(activeCompany)}</h2>
            <p>
              {activeCompany.city || "Location not set"}
              {activeCompany.province ? `, ${activeCompany.province}` : ""}
              {" · "}
              {BUSINESS_TYPES.find(([v]) => v === activeCompany.business_type)?.[1] || activeCompany.business_type}
            </p>
          </div>
          <StatusPill value={activeCompany.verification_status} />
        </div>
      )}

      <div className="metric-grid">
        <Metric label="Your companies" value={companies.length} icon={Building2} />
        <Metric label="Your draft / live listings" value={ownListings.length} icon={Package} />
        <Metric label="Your open RFQs" value={ownRfqs.length} icon={ClipboardList} />
        <Metric label="Your orders" value={orders.length} icon={Activity} />
      </div>

      <div className="section-title-row">
        <div>
          <span className="eyebrow">QUICK ACTIONS</span>
          <h2>Move business forward</h2>
        </div>
      </div>

      <div className="action-grid">
        <ActionCard icon={FilePlus2} title="Create a listing" text="Offer equipment, supplies, transport or mining services." onClick={onCreateListing} />
        <ActionCard icon={ClipboardList} title="Request quotations" text="Tell suppliers what your mine or operation needs." onClick={onCreateRfq} />
        <ActionCard icon={Building2} title="Find a company" text="Discover service providers and other mining businesses." onClick={() => onNavigate("directory")} />
        <ActionCard icon={MessageSquare} title="Manage quotations" text="Review supplier responses and accepted orders." onClick={() => onNavigate("workspace")} />
      </div>

      <div className="notice info">
        <CircleHelp size={18} />
        <span>Listings stay in draft until a company is verified. Mineral buying and selling, payments and escrow are not enabled in this release.</span>
      </div>
    </div>
  );
}

function Directory({ companies, query, setQuery, categoryFilter, setCategoryFilter, onRefresh }) {
  return (
    <div className="page">
      <PageHeading
        eyebrow="DISCOVER PARTNERS"
        title="Company directory"
        subtitle="Search mining businesses and service providers across the network."
        action={
          <button className="btn btn-secondary" onClick={onRefresh}>
            <RefreshCw size={15} /> Refresh
          </button>
        }
      />

      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by company, service or location…" />
        </div>

        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All business types</option>
          {BUSINESS_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <div className="company-grid">
        {companies.map((company) => <CompanyCard key={company.id} company={company} />)}
      </div>

      {companies.length === 0 && (
        <Empty text="No companies match your search. Try another term or clear the filter." />
      )}
    </div>
  );
}

function ListingsPage({ listings, query, setQuery, categoryFilter, setCategoryFilter, onCreate, onRefresh }) {
  return (
    <div className="page">
      <PageHeading
        eyebrow="MARKETPLACE"
        title="Equipment, supplies & services"
        subtitle="Browse published offers from mining businesses."
        action={
          <button className="btn btn-primary" onClick={onCreate}>
            <Plus size={16} /> Create listing
          </button>
        }
      />

      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search published listings…" />
        </div>

        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>

        <button className="icon-btn bordered" onClick={onRefresh} title="Refresh">
          <RefreshCw size={17} />
        </button>
      </div>

      <div className="listing-grid">
        {listings.map((item) => <ListingCard key={item.id} item={item} large />)}
      </div>

      {listings.length === 0 && (
        <Empty text="No published listings match your filters. Verified companies can create listings from this page." />
      )}
    </div>
  );
}

function RfqPage({ rfqs, query, setQuery, categoryFilter, setCategoryFilter, onCreate, onQuote, activeCompany }) {
  return (
    <div className="page">
      <PageHeading
        eyebrow="PROCUREMENT BOARD"
        title="Requests for quotation"
        subtitle="Find open procurement needs and submit a structured supplier quote."
        action={
          <button className="btn btn-primary" onClick={onCreate}>
            <Plus size={16} /> Create RFQ
          </button>
        }
      />

      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search requests…" />
        </div>

        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <div className="stack-cards">
        {rfqs.map((item) => (
          <RfqCard
            key={item.id}
            item={item}
            onQuote={
              activeCompany && activeCompany.id !== item.buyer_company_id
                ? () => onQuote(item)
                : null
            }
          />
        ))}
      </div>

      {rfqs.length === 0 && <Empty text="No matching open RFQs." />}
    </div>
  );
}

function Workspace({ session, profile, companies, activeCompany, quotes, orders, onAddCompany, onAcceptQuote, busy }) {
  const companyIds = companies.map((c) => c.id);

  const relevantQuotes = quotes.filter((quote) =>
    companyIds.includes(quote.supplier_company_id) ||
    companyIds.includes(quote.rfqs?.buyer_company_id)
  );

  return (
    <div className="page">
      <PageHeading
        eyebrow="BUSINESS OPERATIONS"
        title="My workspace"
        subtitle="Track quotations and order records connected to your companies."
        action={
          <button className="btn btn-secondary" onClick={onAddCompany}>
            <Plus size={16} /> Add company
          </button>
        }
      />

      <div className="workspace-grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">COMPANY PROFILES</span>
              <h2>Your companies</h2>
            </div>
          </div>

          {companies.length === 0 ? (
            <Empty text="No company profiles yet." />
          ) : (
            companies.map((company) => (
              <div className="company-row" key={company.id}>
                <div className="company-avatar small"><Building2 size={18} /></div>
                <div className="grow">
                  <strong>{companyLabel(company)}</strong>
                  <p>{company.member_role} · {company.city || "Location not set"}</p>
                </div>
                <StatusPill value={company.verification_status} />
              </div>
            ))
          )}
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">ACCOUNT</span>
              <h2>Profile details</h2>
            </div>
          </div>

          <div className="detail-list">
            <div><span>Email</span><strong>{session.user.email}</strong></div>
            <div><span>Name</span><strong>{profile?.full_name || "Not added"}</strong></div>
            <div><span>Member since</span><strong>{niceDate(session.user.created_at)}</strong></div>
          </div>
        </div>
      </div>

      <div className="panel table-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">SUPPLIER RESPONSES</span>
            <h2>Quotations</h2>
          </div>
        </div>

        {relevantQuotes.length === 0 ? (
          <Empty text="No quotations yet. Suppliers can submit quotes against open RFQs." />
        ) : (
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>Request</th>
                  <th>Amount</th>
                  <th>Supplier</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {relevantQuotes.map((quote) => (
                  <tr key={quote.id}>
                    <td>
                      <strong>{quote.rfqs?.title || "RFQ"}</strong>
                      <small>{niceDate(quote.created_at)}</small>
                    </td>
                    <td>{money(quote.amount, quote.currency)}</td>
                    <td>
                      {companies.find((c) => c.id === quote.supplier_company_id)
                        ? companyLabel(companies.find((c) => c.id === quote.supplier_company_id))
                        : "Supplier company"}
                    </td>
                    <td><StatusPill value={quote.status} /></td>
                    <td>
                      {quote.status === "submitted" && activeCompany?.id === quote.rfqs?.buyer_company_id ? (
                        <button
                          className="btn btn-small btn-primary"
                          onClick={() => onAcceptQuote(quote.id)}
                          disabled={busy}
                        >
                          Accept quote
                        </button>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="panel table-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">ORDER TRACKING</span>
            <h2>Orders</h2>
          </div>
        </div>

        {orders.length === 0 ? (
          <Empty text="Orders will appear here after a buyer accepts a supplier quotation." />
        ) : (
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Amount</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td><strong>#{order.id.slice(0, 8).toUpperCase()}</strong></td>
                    <td>{money(order.amount, order.currency)}</td>
                    <td>{companyIds.includes(order.buyer_company_id) ? "Buyer" : "Supplier"}</td>
                    <td><StatusPill value={order.status} /></td>
                    <td>{niceDate(order.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="notice info">
        <CircleHelp size={18} />
        <span>Accepting a quotation creates an order record only. OreConnect is not processing payments, holding funds or providing escrow at this stage.</span>
      </div>
    </div>
  );
}

function CompanyCard({ company }) {
  const type = BUSINESS_TYPES.find(([v]) => v === company.business_type)?.[1] || company.business_type;

  return (
    <article className="company-card">
      <div className="company-card-top">
        <div className="company-avatar"><Building2 size={22} /></div>
        <StatusPill value={company.verification_status} />
      </div>
      <h3>{companyLabel(company)}</h3>
      <p className="company-type">{type}</p>
      <p className="company-description">{company.description || "Mining sector business profile."}</p>
      <div className="card-meta">
        <span>⌖ {company.city || "Zimbabwe"}{company.province ? `, ${company.province}` : ""}</span>
        <span>{company.country_code || "ZW"}</span>
      </div>
    </article>
  );
}

function ListingCard({ item, large = false }) {
  return (
    <article className={`listing-card ${large ? "listing-card-large" : ""}`}>
      <div className="listing-card-head">
        <span className="category-tag">
          {CATEGORIES.find(([v]) => v === item.category)?.[1] || item.category}
        </span>
        <span className="listing-price">{money(item.price, item.currency)}</span>
      </div>
      <h3>{item.title}</h3>
      <p className="listing-desc">
        {item.description || "Contact the company through OreConnect for more details."}
      </p>
      <div className="card-meta">
        <span>{companyLabel(item.companies)}</span>
        <span>{item.location || item.companies?.city || "Zimbabwe"}</span>
      </div>
      <div className="listing-foot">
        <span>{item.quantity ? `${item.quantity} ${item.unit || ""}` : "Quantity on request"}</span>
        <span>{niceDate(item.created_at)}</span>
      </div>
    </article>
  );
}

function RfqCard({ item, onQuote }) {
  return (
    <article className="rfq-card">
      <div className="rfq-main">
        <div className="rfq-card-top">
          <span className="category-tag">
            {CATEGORIES.find(([v]) => v === item.category)?.[1] || item.category}
          </span>
          <StatusPill value={item.status} />
        </div>
        <h3>{item.title}</h3>
        <p>{item.description}</p>
        <div className="card-meta">
          <span>{companyLabel(item.companies)}</span>
          <span>{item.delivery_location || item.companies?.city || "Location flexible"}</span>
          <span>Required by: {niceDate(item.required_by)}</span>
        </div>
      </div>

      <div className="rfq-side">
        <strong>
          {item.budget_min || item.budget_max
            ? `${money(item.budget_min, item.currency)} – ${money(item.budget_max, item.currency)}`
            : "Budget not disclosed"}
        </strong>
        <span>{item.quantity ? `${item.quantity} ${item.unit || ""}` : "Quantity not stated"}</span>
        {onQuote && (
          <button className="btn btn-primary btn-small" onClick={onQuote}>
            Submit quote <ArrowRight size={14} />
          </button>
        )}
      </div>
    </article>
  );
}

function PageHeading({ eyebrow, title, subtitle, action }) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function SectionHeading({ label, title, action }) {
  return (
    <div className="section-heading">
      <div>
        <span className="eyebrow">{label}</span>
        <h2>{title}</h2>
      </div>
      <button className="icon-btn bordered" onClick={action} title="Refresh">
        <RefreshCw size={16} />
      </button>
    </div>
  );
}

function Metric({ label, value, icon: Icon }) {
  return (
    <div className="metric-card">
      <div className="metric-icon"><Icon size={19} /></div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function ActionCard({ icon: Icon, title, text, onClick }) {
  return (
    <button className="action-card" onClick={onClick}>
      <span className="action-icon"><Icon size={21} /></span>
      <strong>{title}</strong>
      <p>{text}</p>
      <span className="action-arrow"><ArrowRight size={17} /></span>
    </button>
  );
}

function StatusPill({ value }) {
  const status = value || "unknown";
  return <span className={`status-pill status-${status}`}>{statusLabel(status)}</span>;
}

function Empty({ text }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Package size={20} /></div>
      <p>{text}</p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section className="modal-card">
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={19} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function SignInPrompt({ text = "Sign in to continue.", onClick }) {
  return (
    <div className="empty-state">
      <p>{text}</p>
      <button className="btn btn-primary" onClick={onClick}>
        Continue <ArrowRight size={15} />
      </button>
    </div>
  );
}

export default App;
