import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { AdminNav } from "../components/AdminNav";

const initialForm = {
  title: "",
  location: "",
  type: "Entire apartment",
  description: "",
  guests: 1,
  bedrooms: 1,
  bathrooms: 1,
  price: 100,
  amenities: "wifi, kitchen",
  images: "",
  weeklyDiscount: 0,
  cleaningFee: 0,
  serviceFee: 0,
  occupancyTaxes: 0,
  enhancedCleaning: true,
  selfCheckIn: true
};

export function ListingForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    api.listing(id).then((listing) => {
      setForm({
        ...initialForm,
        ...listing,
        amenities: listing.amenities?.join(", ") || "",
        images: listing.images?.join(", ") || ""
      });
    });
  }, [id]);

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!form.title || !form.location || !form.description || Number(form.price) < 1) {
      return setError("Title, location, description, and a valid price are required.");
    }

    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value));
    files.forEach((file) => data.append("images", file));

    try {
      await api.saveListing(id, data);
      navigate("/admin/listings");
    } catch (apiError) {
      setError(apiError.message);
    }
  };

  return (
    <div className="page narrow form-page admin-page">
      <AdminNav />
      <form className="listing-form" onSubmit={submit}>
        <h1>{id ? "Update Listing" : "Create Listing"}</h1>
        {error && <p className="error">{error}</p>}
        <div className="form-grid">
          <label>Listing Name<input value={form.title} onChange={(event) => set("title", event.target.value)} /></label>
          <label>Location<input value={form.location} onChange={(event) => set("location", event.target.value)} /></label>
          <label>Type<input value={form.type} onChange={(event) => set("type", event.target.value)} /></label>
          <label>Price<input type="number" min="1" value={form.price} onChange={(event) => set("price", event.target.value)} /></label>
          <label>Guests<input type="number" min="1" value={form.guests} onChange={(event) => set("guests", event.target.value)} /></label>
          <label>Bedrooms<input type="number" min="0" value={form.bedrooms} onChange={(event) => set("bedrooms", event.target.value)} /></label>
          <label>Bathrooms<input type="number" min="0" value={form.bathrooms} onChange={(event) => set("bathrooms", event.target.value)} /></label>
          <label>Amenities<input value={form.amenities} onChange={(event) => set("amenities", event.target.value)} /></label>
          <label>Weekly discount<input type="number" min="0" value={form.weeklyDiscount} onChange={(event) => set("weeklyDiscount", event.target.value)} /></label>
          <label>Cleaning fee<input type="number" min="0" value={form.cleaningFee} onChange={(event) => set("cleaningFee", event.target.value)} /></label>
          <label>Service fee<input type="number" min="0" value={form.serviceFee} onChange={(event) => set("serviceFee", event.target.value)} /></label>
          <label>Occupancy taxes<input type="number" min="0" value={form.occupancyTaxes} onChange={(event) => set("occupancyTaxes", event.target.value)} /></label>
        </div>
        <label>Description<textarea value={form.description} onChange={(event) => set("description", event.target.value)} /></label>
        <label>Image URLs<textarea value={form.images} onChange={(event) => set("images", event.target.value)} /></label>
        <label>Upload images<input type="file" multiple accept="image/*" onChange={(event) => setFiles([...event.target.files])} /></label>
        <div className="checkboxes">
          <label><input type="checkbox" checked={form.enhancedCleaning} onChange={(event) => set("enhancedCleaning", event.target.checked)} /> Enhanced cleaning</label>
          <label><input type="checkbox" checked={form.selfCheckIn} onChange={(event) => set("selfCheckIn", event.target.checked)} /> Self check-in</label>
        </div>
        <div className="form-actions">
          <button className="reserve">{id ? "Save updates" : "Create"}</button>
          <button type="button" className="cancel-button" onClick={() => navigate("/admin/listings")}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
