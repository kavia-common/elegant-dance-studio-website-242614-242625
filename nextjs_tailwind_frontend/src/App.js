import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

/**
 * Frontend configuration.
 * IMPORTANT: Set REACT_APP_BACKEND_API_BASE_URL in the frontend container environment.
 * Example: REACT_APP_BACKEND_API_BASE_URL=https://your-backend.example.com
 */
const API_BASE_URL = (process.env.REACT_APP_BACKEND_API_BASE_URL || "").replace(
  /\/$/,
  ""
);

/**
 * Best-effort guess for a public gallery endpoint.
 * Since the backend API spec isn't available in this task, we attempt a small set of common endpoints.
 */
const GALLERY_ENDPOINT_CANDIDATES = [
  "/api/gallery/images",
  "/api/gallery",
  "/api/images",
  "/gallery/images",
];

const navItems = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "teacher", label: "Teacher" },
  { id: "gallery", label: "Gallery" },
  { id: "contact", label: "Contact" },
];

// PUBLIC_INTERFACE
function App() {
  /** Ocean Professional theme: keep a light, modern surface; allow optional dark mode for accessibility. */
  const [theme, setTheme] = useState("light");

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [gallery, setGallery] = useState({
    status: "idle", // idle | loading | loaded | error
    images: [],
    error: null,
    resolvedEndpoint: null,
  });

  const canCallApi = useMemo(() => {
    // Avoid calling relative URLs unintentionally; require explicit base URL.
    return Boolean(API_BASE_URL);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    let cancelled = false;

    async function tryFetchJson(url) {
      const res = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          `HTTP ${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`
        );
      }
      return res.json();
    }

    async function loadGallery() {
      if (!canCallApi) {
        setGallery({
          status: "error",
          images: [],
          error:
            "Gallery backend is not configured. Set REACT_APP_BACKEND_API_BASE_URL.",
          resolvedEndpoint: null,
        });
        return;
      }

      setGallery((prev) => ({
        ...prev,
        status: "loading",
        error: null,
      }));

      let lastError = null;

      for (const candidate of GALLERY_ENDPOINT_CANDIDATES) {
        const url = `${API_BASE_URL}${candidate}`;
        try {
          const data = await tryFetchJson(url);

          // We accept either:
          // 1) { images: [...] }
          // 2) [...] directly
          const imagesRaw = Array.isArray(data) ? data : data?.images;

          if (!Array.isArray(imagesRaw)) {
            throw new Error(
              "Unexpected response shape (expected an array or { images: [...] })."
            );
          }

          const normalized = imagesRaw
            .map((img, idx) => {
              const image_url =
                img?.image_url || img?.url || img?.src || img?.publicUrl;
              const alt_text = img?.alt_text || img?.alt || "Dance studio photo";
              const id = img?.id ?? `${candidate}:${idx}`;

              if (!image_url) return null;

              return {
                id: String(id),
                image_url: String(image_url),
                alt_text: String(alt_text),
              };
            })
            .filter(Boolean);

          if (cancelled) return;

          setGallery({
            status: "loaded",
            images: normalized,
            error: null,
            resolvedEndpoint: url,
          });
          return;
        } catch (e) {
          lastError = e;
        }
      }

      if (cancelled) return;

      setGallery({
        status: "error",
        images: [],
        error: `Unable to load gallery images from backend. Last error: ${
          lastError?.message || "Unknown error"
        }`,
        resolvedEndpoint: null,
      });
    }

    loadGallery();

    return () => {
      cancelled = true;
    };
  }, [canCallApi]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  // PUBLIC_INTERFACE
  const scrollToSection = (id) => {
    setMobileNavOpen(false);
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // PUBLIC_INTERFACE
  const onSubmitContact = (e) => {
    e.preventDefault();
    // In this task, no backend contact endpoint is specified; keep this as a mailto helper.
    // This prevents broken submissions while still enabling a functional contact workflow.
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") || "");
    const email = String(form.get("email") || "");
    const message = String(form.get("message") || "");

    const subject = encodeURIComponent(`Website inquiry from ${name || "Guest"}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}\n`
    );

    window.location.href = `mailto:teacher@example.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="App">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className="site-header">
        <div className="container header-inner">
          <button
            type="button"
            className="brand"
            onClick={() => scrollToSection("home")}
            aria-label="Go to home section"
          >
            <span className="brand-mark" aria-hidden="true">
              ED
            </span>
            <span className="brand-text">
              <span className="brand-title">Elegant Dance Studio</span>
              <span className="brand-subtitle">Classical • Grace • Discipline</span>
            </span>
          </button>

          <nav className="nav" aria-label="Primary navigation">
            <div className="nav-desktop">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  className="nav-link"
                  type="button"
                  onClick={() => scrollToSection(item.id)}
                >
                  {item.label}
                </button>
              ))}
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => scrollToSection("contact")}
              >
                Book a Class
              </button>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={toggleTheme}
                aria-label={`Switch to ${
                  theme === "light" ? "dark" : "light"
                } mode`}
                title="Toggle theme"
              >
                {theme === "light" ? "Dark" : "Light"}
              </button>
            </div>

            <div className="nav-mobile">
              <button
                className="icon-btn"
                type="button"
                onClick={toggleTheme}
                aria-label={`Switch to ${
                  theme === "light" ? "dark" : "light"
                } mode`}
                title="Toggle theme"
              >
                {theme === "light" ? "Dark" : "Light"}
              </button>
              <button
                className="icon-btn"
                type="button"
                onClick={() => setMobileNavOpen((v) => !v)}
                aria-expanded={mobileNavOpen}
                aria-controls="mobile-menu"
                aria-label="Open navigation menu"
                title="Menu"
              >
                Menu
              </button>
            </div>
          </nav>
        </div>

        {mobileNavOpen ? (
          <div className="mobile-menu" id="mobile-menu">
            <div className="container mobile-menu-inner">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  className="mobile-link"
                  type="button"
                  onClick={() => scrollToSection(item.id)}
                >
                  {item.label}
                </button>
              ))}
              <button
                className="btn btn-secondary mobile-cta"
                type="button"
                onClick={() => scrollToSection("contact")}
              >
                Book a Class
              </button>
            </div>
          </div>
        ) : null}
      </header>

      <main id="main">
        <section id="home" className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">Ocean Professional • Classical Arts</p>
              <h1 className="h1">
                Learn classical dance with{" "}
                <span className="accent">clarity</span>,{" "}
                <span className="accent-secondary">confidence</span>, and grace.
              </h1>
              <p className="lead">
                A welcoming studio for beginners to advanced students—focused on
                strong foundations, musicality, and expressive storytelling.
              </p>

              <div className="hero-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-large"
                  onClick={() => scrollToSection("contact")}
                >
                  Enroll / Request a Trial
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-large"
                  onClick={() => scrollToSection("gallery")}
                >
                  View Gallery
                </button>
              </div>

              <div className="hero-stats" aria-label="Studio highlights">
                <div className="stat">
                  <div className="stat-value">10+</div>
                  <div className="stat-label">Years Teaching</div>
                </div>
                <div className="stat">
                  <div className="stat-value">All Ages</div>
                  <div className="stat-label">Kids • Teens • Adults</div>
                </div>
                <div className="stat">
                  <div className="stat-value">Online + In‑person</div>
                  <div className="stat-label">Flexible Learning</div>
                </div>
              </div>
            </div>

            <div className="hero-card" aria-label="Featured class card">
              <div className="card">
                <div className="card-badge">Now Enrolling</div>
                <h2 className="h2">Beginner Foundations</h2>
                <p className="card-text">
                  Posture, adavus, rhythm training, and short choreography—built
                  with careful feedback and a calm, structured approach.
                </p>
                <ul className="list">
                  <li>Weekly classes (small batches)</li>
                  <li>Performance preparation track</li>
                  <li>Personalized practice plan</li>
                </ul>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => scrollToSection("contact")}
                >
                  Contact for Schedule
                </button>
              </div>
            </div>
          </div>
          <div className="hero-gradient" aria-hidden="true" />
        </section>

        <section id="about" className="section">
          <div className="container">
            <div className="section-head">
              <h2 className="h2">About the Studio</h2>
              <p className="section-subtitle">
                A modern learning experience rooted in tradition—supportive,
                disciplined, and joyful.
              </p>
            </div>

            <div className="grid-3">
              <div className="panel">
                <h3 className="h3">Technique</h3>
                <p className="p">
                  Strengthen alignment, stamina, and precision with progressive
                  drills tailored to your level.
                </p>
              </div>
              <div className="panel">
                <h3 className="h3">Expression</h3>
                <p className="p">
                  Develop abhinaya and storytelling through music interpretation,
                  facial expression, and gesture vocabulary.
                </p>
              </div>
              <div className="panel">
                <h3 className="h3">Community</h3>
                <p className="p">
                  Join a respectful, encouraging community with recital
                  opportunities and cultural learning.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="teacher" className="section section-alt">
          <div className="container teacher-grid">
            <div className="teacher-profile">
              <div className="avatar" aria-hidden="true">
                <div className="avatar-inner">T</div>
              </div>
              <div>
                <h2 className="h2">Meet Your Teacher</h2>
                <p className="section-subtitle">
                  Classical dance educator dedicated to artistry, discipline, and
                  student growth.
                </p>
              </div>
            </div>

            <div className="teacher-details">
              <div className="panel">
                <h3 className="h3">Training & Approach</h3>
                <p className="p">
                  A structured curriculum blending traditional foundations with
                  modern learning supports—clear demonstrations, guided practice,
                  and actionable feedback.
                </p>
              </div>
              <div className="panel">
                <h3 className="h3">Achievements</h3>
                <p className="p">
                  Student showcases, cultural programs, and choreography projects
                  designed to build confidence on stage.
                </p>
              </div>
              <div className="panel">
                <h3 className="h3">Who It’s For</h3>
                <p className="p">
                  Beginners to advanced dancers, anyone returning after a break,
                  and learners seeking a consistent, supportive path.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="gallery" className="section">
          <div className="container">
            <div className="section-head section-head-row">
              <div>
                <h2 className="h2">Gallery</h2>
                <p className="section-subtitle">
                  A living collection—images are fetched live from the studio’s
                  gallery manager.
                </p>
              </div>

              <div className="gallery-meta">
                {gallery.status === "loaded" && gallery.resolvedEndpoint ? (
                  <span className="pill" title={gallery.resolvedEndpoint}>
                    Live
                  </span>
                ) : (
                  <span className="pill pill-muted">Status: {gallery.status}</span>
                )}
              </div>
            </div>

            {!canCallApi ? (
              <div className="notice notice-warn" role="alert">
                <strong>Gallery not configured.</strong> Set{" "}
                <code>REACT_APP_BACKEND_API_BASE_URL</code> to enable live images.
              </div>
            ) : null}

            {gallery.status === "loading" ? (
              <div className="grid-gallery" aria-busy="true" aria-live="polite">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="skeleton" />
                ))}
              </div>
            ) : null}

            {gallery.status === "error" ? (
              <div className="notice notice-error" role="alert">
                <strong>Couldn’t load gallery.</strong>
                <div className="notice-text">{gallery.error}</div>
                <div className="notice-text">
                  Expected backend endpoints (tried):{" "}
                  <code>{GALLERY_ENDPOINT_CANDIDATES.join(", ")}</code>
                </div>
              </div>
            ) : null}

            {gallery.status === "loaded" ? (
              gallery.images.length ? (
                <div className="grid-gallery" aria-live="polite">
                  {gallery.images.map((img) => (
                    <figure key={img.id} className="gallery-item">
                      {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
                      <img
                        src={img.image_url}
                        alt={img.alt_text}
                        loading="lazy"
                      />
                      <figcaption className="caption">{img.alt_text}</figcaption>
                    </figure>
                  ))}
                </div>
              ) : (
                <div className="notice" role="status">
                  No images yet. Please check back soon.
                </div>
              )
            ) : null}
          </div>
        </section>

        <section id="contact" className="section section-alt">
          <div className="container contact-grid">
            <div>
              <h2 className="h2">Contact</h2>
              <p className="section-subtitle">
                Share your goals and experience level. We’ll recommend the best
                batch and schedule.
              </p>

              <div className="contact-cards">
                <div className="panel">
                  <h3 className="h3">Class Formats</h3>
                  <ul className="list">
                    <li>Beginner Foundations</li>
                    <li>Intermediate Technique</li>
                    <li>Choreography & Performance Prep</li>
                    <li>Private Coaching</li>
                  </ul>
                </div>
                <div className="panel">
                  <h3 className="h3">Social</h3>
                  <div className="social">
                    <a className="social-link" href="#" aria-label="Instagram">
                      Instagram
                    </a>
                    <a className="social-link" href="#" aria-label="YouTube">
                      YouTube
                    </a>
                    <a className="social-link" href="#" aria-label="Facebook">
                      Facebook
                    </a>
                  </div>
                  <p className="fineprint">
                    Update these links in the frontend as needed.
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="h3">Send a Message</h3>
              <form onSubmit={onSubmitContact} className="form">
                <label className="field">
                  <span className="label">Name</span>
                  <input
                    name="name"
                    type="text"
                    className="input"
                    placeholder="Your name"
                    required
                  />
                </label>

                <label className="field">
                  <span className="label">Email</span>
                  <input
                    name="email"
                    type="email"
                    className="input"
                    placeholder="you@example.com"
                    required
                  />
                </label>

                <label className="field">
                  <span className="label">Message</span>
                  <textarea
                    name="message"
                    className="textarea"
                    placeholder="Tell us what you’d like to learn, your experience, and preferred schedule."
                    rows={5}
                    required
                  />
                </label>

                <button className="btn btn-primary" type="submit">
                  Send (opens email)
                </button>

                <p className="fineprint">
                  This form uses <code>mailto:</code> in this step (no contact API
                  specified yet).
                </p>
              </form>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-left">
            <div className="brand-mini">
              <span className="brand-mark" aria-hidden="true">
                ED
              </span>
              <span>Elegant Dance Studio</span>
            </div>
            <p className="fineprint">
              © {new Date().getFullYear()} Elegant Dance Studio. All rights reserved.
            </p>
          </div>

          <div className="footer-right">
            {navItems.map((item) => (
              <button
                key={item.id}
                className="footer-link"
                type="button"
                onClick={() => scrollToSection(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
