import React, { useEffect, useRef } from "react";

/**
 * LeafletMap — a real interactive map powered by Leaflet.js.
 * Shows a tile-based street/satellite map centered on the selected SA city,
 * with price-tag markers for every visible listing.
 *
 * Props:
 *   selected   {string}   — active city name (key in SA_MAP_POINTS)
 *   listings   {Array}    — array of listing objects with { _id, title, price, location }
 *   onSelect   {Function} — called with city name when a city button is clicked
 */

const SA_MAP_POINTS = {
  "Cape Town":       { lat: -33.9249, lng: 18.4241, region: "Western Cape",   zoom: 11 },
  "Johannesburg":    { lat: -26.2041, lng: 28.0473, region: "Gauteng",        zoom: 11 },
  "Durban":          { lat: -29.8587, lng: 31.0218, region: "KwaZulu-Natal",  zoom: 12 },
  "Pretoria":        { lat: -25.7479, lng: 28.2293, region: "Gauteng",        zoom: 12 },
  "Stellenbosch":    { lat: -33.9321, lng: 18.8602, region: "Western Cape",   zoom: 12 },
  "Knysna":          { lat: -34.0363, lng: 23.0471, region: "Western Cape",   zoom: 12 },
  "Plettenberg Bay": { lat: -34.0527, lng: 23.3716, region: "Western Cape",   zoom: 12 },
  "Kruger Park":     { lat: -23.9884, lng: 31.5547, region: "Mpumalanga",     zoom: 9  },
  "Hermanus":        { lat: -34.4092, lng: 19.2504, region: "Western Cape",   zoom: 12 },
  "Drakensberg":     { lat: -29.4667, lng: 29.2667, region: "KwaZulu-Natal",  zoom: 10 }
};

export { SA_MAP_POINTS };

// Deterministic jitter so markers don't all stack on the same pixel
function jitter(index, seed) {
  const r = ((index + 1) * seed * 9301 + 49297) % 233280;
  return (r / 233280 - 0.5) * 0.04;
}

export function LeafletMap({ selected, listings = [], onSelect }) {
  const mapRef   = useRef(null);   // DOM node
  const leafRef  = useRef(null);   // Leaflet map instance
  const markersRef = useRef([]);   // current marker layer group

  /* ── Initialise Leaflet map once ──────────────────────────── */
  useEffect(() => {
    // Dynamic import so Leaflet only loads in the browser
    import("leaflet").then((L) => {
      // Fix default icon path broken by bundlers
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
      });

      if (!mapRef.current) return;

      const point = SA_MAP_POINTS[selected] || SA_MAP_POINTS["Cape Town"];
      const map = L.map(mapRef.current, {
        center:    [point.lat, point.lng],
        zoom:      point.zoom,
        scrollWheelZoom: true,
        zoomControl: true
      });

      // OpenStreetMap tiles — free, no API key
      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }
      ).addTo(map);

      leafRef.current = map;

      return () => {
        map.remove();
        leafRef.current = null;
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Re-centre map when selected city changes ─────────────── */
  useEffect(() => {
    import("leaflet").then(() => {
      if (!leafRef.current) return;
      const point = SA_MAP_POINTS[selected] || SA_MAP_POINTS["Cape Town"];
      leafRef.current.setView([point.lat, point.lng], point.zoom, { animate: true });
    });
  }, [selected]);

  /* ── Re-draw price markers when listings change ───────────── */
  useEffect(() => {
    import("leaflet").then((L) => {
      if (!leafRef.current) return;

      // Clear old markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      const point = SA_MAP_POINTS[selected] || SA_MAP_POINTS["Cape Town"];
      const seed  = point.lat + point.lng;

      listings.slice(0, 40).forEach((listing, i) => {
        const lat = point.lat + jitter(i, seed + 1);
        const lng = point.lng + jitter(i, seed + 2);

        const price = listing.price
          ? `R ${Number(listing.price).toLocaleString("en-ZA")}`
          : "";

        const icon = L.divIcon({
          className: "",
          html: `<div class="map-price-pin">${price}</div>`,
          iconAnchor: [32, 16]
        });

        const marker = L.marker([lat, lng], { icon })
          .addTo(leafRef.current)
          .bindPopup(
            `<b>${listing.title || "Listing"}</b><br/>` +
            `${listing.location || selected}<br/>` +
            `<strong>${price}/night</strong>`
          );

        markersRef.current.push(marker);
      });
    });
  }, [listings, selected]);

  const cityList = Object.entries(SA_MAP_POINTS);

  return (
    <div className="sa-map-card">
      <div className="sa-map-header">
        <div>
          <small>South Africa</small>
          <h3>{selected}</h3>
          <p>{(SA_MAP_POINTS[selected] || SA_MAP_POINTS["Cape Town"]).region} stays around {selected}</p>
        </div>
        <a
          href={(() => {
            const p = SA_MAP_POINTS[selected] || SA_MAP_POINTS["Cape Town"];
            return `https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lng}#map=12/${p.lat}/${p.lng}`;
          })()}
          target="_blank"
          rel="noreferrer"
        >
          Open full map
        </a>
      </div>

      {/* Leaflet map container */}
      <div
        ref={mapRef}
        className="sa-map-frame leaflet-frame"
        aria-label={`Interactive map of ${selected}`}
      />

      {/* City selector row */}
      <div className="sa-map-locations" role="group" aria-label="Choose map location">
        {cityList.map(([city, info]) => (
          <button
            key={city}
            className={selected === city ? "active" : ""}
            onClick={() => onSelect(city)}
            aria-pressed={selected === city}
          >
            <span>{city}</span>
            <small>{info.region}</small>
          </button>
        ))}
      </div>
    </div>
  );
}
