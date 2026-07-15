import React, { useState } from "react";
import { Link } from "react-router-dom";

/**
 * Home page — South Africa focused.
 * Hero banner, SA city inspiration grid, experience sections,
 * shop gift cards, future getaways tabs, and footer.
 */
export function Home() {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    "Arts & culture",
    "Outdoor adventure",
    "Beach destinations",
    "Mountain escapes",
    "Popular destinations",
    "Unique Stays"
  ];

  // SA-focused cities per tab
  const tabCities = [
    ["Cape Town", "Johannesburg", "Pretoria", "Stellenbosch", "Knysna", "Hermanus", "Franschhoek", "George", "Show more"],
    ["Drakensberg", "Kruger Park", "Tsitsikamma", "Cederberg", "Augrabies", "Magaliesberg", "Blyde River", "Show more"],
    ["Umhlanga", "Camps Bay", "Ballito", "Wilderness", "Plettenberg Bay", "Jeffreys Bay", "Port Elizabeth", "Show more"],
    ["Drakensberg", "Magaliesberg", "Dullstroom", "Clarens", "Sabie", "Pilanesberg", "Show more"],
    ["Cape Town", "Johannesburg", "Durban", "Pretoria", "Port Elizabeth", "Knysna", "Hermanus", "Stellenbosch", "George", "Sandton", "Umhlanga", "Show more"],
    ["Treehouses", "Farm stays", "Bush lodges", "Houseboats", "Cave houses", "Glamping", "Show more"]
  ];

  const cards = [
    {
      title: "Cape Town",
      subtitle: "Western Cape",
      distance: "Table Mountain backdrop",
      image: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=900&q=80",
      tone: "card-red",
      location: "Cape Town"
    },
    {
      title: "Johannesburg",
      subtitle: "Gauteng",
      distance: "City of Gold",
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80",
      tone: "card-purple",
      location: "Johannesburg"
    },
    {
      title: "Durban",
      subtitle: "KwaZulu-Natal",
      distance: "Golden Mile beaches",
      image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=900&q=80",
      tone: "card-pink",
      location: "Durban"
    },
    {
      title: "Kruger Park",
      subtitle: "Mpumalanga",
      distance: "Big Five country",
      image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=900&q=80",
      tone: "card-orange",
      location: "Kruger Park"
    }
  ];

  return (
    <div className="page home-page">

      {/* ---- Hero banner ---- */}
      <section className="hero" aria-label="Hero banner">
        <div className="hero-copy narrow">
          <h1>Discover beautiful South Africa</h1>
          <p style={{ margin: 0, fontSize: 14, textAlign: "center", color: "rgba(255,255,255,0.9)" }}>
            From Cape Town's coastline to the Kruger bush — find your perfect SA stay.
          </p>
          <Link className="primary-action" to="/locations?location=Cape Town">
            Explore SA stays
          </Link>
        </div>
      </section>

      {/* ---- Inspiration section ---- */}
      <section className="section" aria-labelledby="inspiration-heading">
        <h2 id="inspiration-heading">Inspiration for your next South African trip</h2>
        <div className="city-grid">
          {cards.map((card) => (
            <Link
              className={`city-card ${card.tone}`}
              to={`/locations?location=${encodeURIComponent(card.location)}`}
              key={card.title}
            >
              <div className="city-thumb">
                <img src={card.image} alt={card.title} loading="lazy" />
                <div className="city-overlay" />
                <div className="city-info">
                  <h3>{card.title}</h3>
                  <p>{card.distance}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ---- Discover experiences ---- */}
      <section className="experience-grid" aria-label="Discover experiences">
        <article className="experience work">
          <h2>Things to do on your trip</h2>
          <button type="button">Experiences</button>
        </article>
        <article className="experience home">
          <h2>Things to do from home</h2>
          <button type="button">Online experiences</button>
        </article>
      </section>

      {/* ---- Shop Airbnb gift cards ---- */}
      <section className="shop-section" aria-label="Shop Airbnb gift cards">
        <div>
          <h2>Shop Airbnb gift cards</h2>
          <button type="button">Learn more</button>
        </div>
        <img
          src="https://images.unsplash.com/photo-1607083206968-13611e3d76db?auto=format&fit=crop&w=1200&q=80"
          alt="Airbnb gift card"
          loading="lazy"
        />
      </section>

      {/* ---- Questions about hosting ---- */}
      <section className="hosting-banner" aria-label="Hosting banner">
        <div>
          <h2>Questions about hosting?</h2>
          <button type="button">Ask a Superhost</button>
        </div>
      </section>

      {/* ---- Future getaways (interactive tabs) ---- */}
      <section className="section" aria-labelledby="getaways-heading">
        <h2 id="getaways-heading">Inspiration for future SA getaways</h2>

        <div className="tabs" role="tablist" aria-label="Getaway categories">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === i}
              className={activeTab === i ? "active" : ""}
              onClick={() => setActiveTab(i)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="footer-columns" role="tabpanel">
          {tabCities[activeTab].map((city) => (
            <span key={city}>
              {city === "Show more" ? (
                <small style={{ cursor: "pointer", color: "var(--blue)" }}>Show more</small>
              ) : (
                <>
                  <Link to={`/locations?location=${encodeURIComponent(city)}`}>{city}</Link>
                  <small>Holiday rentals</small>
                </>
              )}
            </span>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

/**
 * Footer — shared across Home, Locations, and ListingDetails pages.
 */
export function Footer() {
  const sections = [
    {
      heading: "Support",
      links: ["Help Centre", "Safety information", "Cancellation options", "Our COVID-19 response", "Contact us"]
    },
    {
      heading: "Community",
      links: ["Airbnb.org relief fund", "Combating discrimination", "Diversity & belonging", "Accessibility", "Frontline stays"]
    },
    {
      heading: "Hosting",
      links: ["Try hosting", "AirCover for Hosts", "Explore hosting resources", "How to host responsibly", "Community forum"]
    },
    {
      heading: "Airbnb",
      links: ["Newsroom", "Learn about new features", "Letter from our founders", "Careers", "Investors"]
    }
  ];

  return (
    <footer className="footer" aria-label="Site footer">
      {sections.map((sec) => (
        <div key={sec.heading}>
          <h4>{sec.heading}</h4>
          {sec.links.map((link) => (
            <a key={link} href="#" onClick={(e) => e.preventDefault()}>{link}</a>
          ))}
        </div>
      ))}
      <div className="copyright">
        <span>© 2026 Airbnb, Inc. &nbsp;·&nbsp; Privacy &nbsp;·&nbsp; Terms &nbsp;·&nbsp; Sitemap</span>
        <span>English (SA) &nbsp;·&nbsp; ZAR &nbsp;·&nbsp; Facebook &nbsp;·&nbsp; Twitter &nbsp;·&nbsp; Instagram</span>
      </div>
    </footer>
  );
}
