const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const Accommodation = require("../models/Accommodation");
const Reservation = require("../models/Reservation");
const User = require("../models/User");

dotenv.config({ path: require("path").join(__dirname, "..", ".env") });

const images = [
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1400&q=80"
];

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([Accommodation.deleteMany(), Reservation.deleteMany(), User.deleteMany()]);

  const password = await bcrypt.hash("password123", 10);
  const hostPassword = await bcrypt.hash("password321", 10);
  const [john, jane] = await User.create([
    { username: "John Doe", email: "john@example.com", password, role: "user" },
    { username: "Jane Doe", email: "jane@example.com", password: hostPassword, role: "host" }
  ]);

  await Accommodation.create([
    {
      title: "Modern Apartment in New York",
      type: "Entire apartment",
      location: "New York",
      description: "Stay in the heart of New York City with skyline views, quick subway access, and a calm place to unwind.",
      host: jane.username,
      host_id: jane._id,
      guests: 4,
      bedrooms: 2,
      bathrooms: 2,
      amenities: ["wifi", "kitchen", "free parking", "workspace"],
      images,
      rating: 4.8,
      reviews: 320,
      price: 320,
      weeklyDiscount: 120,
      cleaningFee: 50,
      serviceFee: 50,
      occupancyTaxes: 30
    },
    {
      title: "Coastal Loft in Cape Town",
      type: "Entire loft",
      location: "Cape Town",
      description: "A bright loft near the waterfront with mountain views, fast wifi, and restaurants around the corner.",
      host: jane.username,
      host_id: jane._id,
      guests: 3,
      bedrooms: 1,
      bathrooms: 1,
      amenities: ["wifi", "ocean view", "kitchen", "washer"],
      images: images.slice().reverse(),
      rating: 4.9,
      reviews: 188,
      price: 210,
      weeklyDiscount: 80,
      cleaningFee: 35,
      serviceFee: 42,
      occupancyTaxes: 24
    }
    ,
    {
      title: "Parisian Studio Apartment",
      type: "Entire apartment",
      location: "Paris",
      description: "A cozy studio in Montmartre, perfect for couples and solo travellers.",
      host: john.username,
      host_id: john._id,
      guests: 2,
      bedrooms: 1,
      bathrooms: 1,
      amenities: ["wifi", "elevator", "kitchen"],
      images,
      rating: 4.7,
      reviews: 210,
      price: 140,
      weeklyDiscount: 40,
      cleaningFee: 25,
      serviceFee: 20,
      occupancyTaxes: 15
    },
    {
      title: "Tokyo Loft Near Shibuya",
      type: "Entire loft",
      location: "Tokyo",
      description: "Compact loft with easy access to trains and nightlife.",
      host: john.username,
      host_id: john._id,
      guests: 3,
      bedrooms: 1,
      bathrooms: 1,
      amenities: ["wifi", "washer", "kitchen"],
      images: images.slice().reverse(),
      rating: 4.6,
      reviews: 98,
      price: 120,
      weeklyDiscount: 30,
      cleaningFee: 20,
      serviceFee: 18,
      occupancyTaxes: 12
    },
    {
      title: "Sunny Beachside Apartment",
      type: "Entire apartment",
      location: "Barcelona",
      description: "Light-filled apartment a short walk from the beach.",
      host: jane.username,
      host_id: jane._id,
      guests: 4,
      bedrooms: 2,
      bathrooms: 1,
      amenities: ["wifi", "air conditioning", "kitchen"],
      images,
      rating: 4.9,
      reviews: 405,
      price: 190,
      weeklyDiscount: 70,
      cleaningFee: 35,
      serviceFee: 40,
      occupancyTaxes: 22
    }
  ]);

  console.log("Seed complete. Log in with john@example.com/password123 or jane@example.com/password321.");
  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
