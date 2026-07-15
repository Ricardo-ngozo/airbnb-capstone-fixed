const mongoose = require("mongoose");

const accommodationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    host: { type: String, required: true, trim: true },
    host_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    guests: { type: Number, required: true, min: 1 },
    bedrooms: { type: Number, required: true, min: 0 },
    bathrooms: { type: Number, required: true, min: 0 },
    amenities: [{ type: String, trim: true }],
    images: [{ type: String, required: true }],
    rating: { type: Number, default: 4.5, min: 0, max: 5 },
    reviews: { type: Number, default: 0, min: 0 },
    price: { type: Number, required: true, min: 1 },
    weeklyDiscount: { type: Number, default: 0, min: 0 },
    cleaningFee: { type: Number, default: 0, min: 0 },
    serviceFee: { type: Number, default: 0, min: 0 },
    occupancyTaxes: { type: Number, default: 0, min: 0 },
    enhancedCleaning: { type: Boolean, default: true },
    selfCheckIn: { type: Boolean, default: true },
    specificRatings: {
      cleanliness: { type: Number, default: 4.8 },
      communication: { type: Number, default: 4.7 },
      checkIn: { type: Number, default: 4.9 },
      accuracy: { type: Number, default: 4.6 },
      location: { type: Number, default: 4.9 },
      value: { type: Number, default: 4.5 }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Accommodation", accommodationSchema);
