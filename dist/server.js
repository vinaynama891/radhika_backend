import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "../data");
const BOOKINGS_FILE = path.join(DATA_DIR, "bookings.json");
const SERVICES_FILE = path.join(DATA_DIR, "services.json");
const GALLERY_FILE = path.join(DATA_DIR, "gallery.json");
// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
const app = express();
const PORT = process.env.PORT || 5000;
// Middleware
app.use(cors());
app.use(express.json());
// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/radhika_luxe_celebrations";
let isMongoConnected = false;
mongoose
    .connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 3000,
})
    .then(() => {
    console.log("🍃 Connected to MongoDB successfully!");
    isMongoConnected = true;
    seedDatabase();
    // Also prepare local JSON backup files just in case
    seedLocalJSON();
})
    .catch((err) => {
    console.warn("⚠️ MongoDB offline or connection failed. Falling back to local JSON database storage.");
    console.warn("Details:", err.message);
    seedLocalJSON();
});
const BookingSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    date: { type: String },
    event: { type: String, required: true },
    message: { type: String },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
    createdAt: { type: Date, default: Date.now },
});
const BookingModel = mongoose.model("Booking", BookingSchema);
const ServiceSchema = new mongoose.Schema({
    icon: { type: String, required: true },
    title: { type: String, required: true },
    desc: { type: String, required: true },
    img: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
const ServiceModel = mongoose.model("Service", ServiceSchema);
const GallerySchema = new mongoose.Schema({
    src: { type: String, required: true },
    cat: { type: String, required: true },
    tall: { type: Boolean, default: false },
    alt: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
const GalleryModel = mongoose.model("Gallery", GallerySchema);
// --- LOCAL JSON DATABASE HELPERS ---
// Booking local helpers
function getLocalBookings() {
    try {
        if (fs.existsSync(BOOKINGS_FILE)) {
            const content = fs.readFileSync(BOOKINGS_FILE, "utf-8");
            return JSON.parse(content);
        }
    }
    catch (error) {
        console.error("Failed to read bookings local file:", error);
    }
    return [];
}
function saveLocalBooking(booking) {
    try {
        const bookings = getLocalBookings();
        bookings.push(booking);
        fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
    }
    catch (error) {
        console.error("Failed to save booking locally:", error);
    }
}
function updateLocalBookingStatus(id, status) {
    try {
        const bookings = getLocalBookings();
        const index = bookings.findIndex((b) => b.id === id || b._id === id);
        if (index !== -1) {
            bookings[index].status = status;
            fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
            return true;
        }
    }
    catch (error) {
        console.error("Failed to update booking locally:", error);
    }
    return false;
}
// Service local helpers
function getLocalServices() {
    try {
        if (fs.existsSync(SERVICES_FILE)) {
            const content = fs.readFileSync(SERVICES_FILE, "utf-8");
            return JSON.parse(content);
        }
    }
    catch (error) {
        console.error("Failed to read services local file:", error);
    }
    return [];
}
function saveLocalServices(services) {
    try {
        fs.writeFileSync(SERVICES_FILE, JSON.stringify(services, null, 2));
    }
    catch (error) {
        console.error("Failed to save services locally:", error);
    }
}
// Gallery local helpers
function getLocalGallery() {
    try {
        if (fs.existsSync(GALLERY_FILE)) {
            const content = fs.readFileSync(GALLERY_FILE, "utf-8");
            return JSON.parse(content);
        }
    }
    catch (error) {
        console.error("Failed to read gallery local file:", error);
    }
    return [];
}
function saveLocalGallery(gallery) {
    try {
        fs.writeFileSync(GALLERY_FILE, JSON.stringify(gallery, null, 2));
    }
    catch (error) {
        console.error("Failed to save gallery locally:", error);
    }
}
// --- DATABASE SEED DATA & FUNCTIONS ---
const seedServices = [
    { icon: "Heart", title: "Wedding Decoration", desc: "Bespoke mandaps, floral entrances and grand reception stages.", img: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80" },
    { icon: "Sparkles", title: "Engagement Decoration", desc: "Romantic ring ceremony setups, candle stages, hanging florals.", img: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=800&q=80" },
    { icon: "Cake", title: "Birthday Decoration", desc: "Themed balloon arches, dessert tables and photobooth styling.", img: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80" },
    { icon: "Gem", title: "Anniversary Decoration", desc: "Intimate candle-lit dinners with personalised love-story decor.", img: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80" },
    { icon: "Briefcase", title: "Corporate Events", desc: "Conferences, galas and product launches with premium staging.", img: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80" },
    { icon: "Wand2", title: "Theme Decorations", desc: "Royal, Bollywood, vintage, fairy-tale — any concept, fully built.", img: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80" },
];
const seedGallery = [
    { src: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=800&q=80", cat: "Wedding", tall: true, alt: "Floral mandap with chandeliers" },
    { src: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80", cat: "Wedding", tall: false, alt: "White rose wedding stage" },
    { src: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=800&q=80", cat: "Engagement", tall: false, alt: "Engagement candle backdrop" },
    { src: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80", cat: "Birthday", tall: true, alt: "Gold balloon arch birthday" },
    { src: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80", cat: "Anniversary", tall: false, alt: "Anniversary dinner setup" },
    { src: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80", cat: "Corporate", tall: false, alt: "Corporate event hall" },
    { src: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80", cat: "Theme", tall: true, alt: "Floral ceiling theme decor" },
    { src: "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=800&q=80", cat: "Wedding", tall: false, alt: "Floral wedding entrance" },
];
async function seedDatabase() {
    try {
        const serviceCount = await ServiceModel.countDocuments();
        if (serviceCount === 0) {
            await ServiceModel.insertMany(seedServices);
            console.log("🌱 Seeded services collection.");
        }
        const galleryCount = await GalleryModel.countDocuments();
        if (galleryCount === 0) {
            await GalleryModel.insertMany(seedGallery);
            console.log("🌱 Seeded gallery collection.");
        }
    }
    catch (error) {
        console.error("Failed to seed MongoDB:", error);
    }
}
function seedLocalJSON() {
    try {
        const services = getLocalServices();
        if (services.length === 0) {
            const servicesWithIds = seedServices.map(s => ({ ...s, id: crypto.randomUUID(), createdAt: new Date() }));
            saveLocalServices(servicesWithIds);
            console.log("📁 Seeded local services JSON file.");
        }
        const gallery = getLocalGallery();
        if (gallery.length === 0) {
            const galleryWithIds = seedGallery.map(g => ({ ...g, id: crypto.randomUUID(), createdAt: new Date() }));
            saveLocalGallery(galleryWithIds);
            console.log("📁 Seeded local gallery JSON file.");
        }
    }
    catch (error) {
        console.error("Failed to seed local JSON files:", error);
    }
}
// --- API ROUTES ---
// 1. Create Booking / Inquiry
app.post("/api/bookings", async (req, res) => {
    const { name, phone, email, date, event, message } = req.body;
    if (!name || !phone || !event) {
        return res.status(400).json({ error: "Missing required fields (name, phone, event)" });
    }
    const newBooking = {
        name,
        phone,
        email,
        date,
        event,
        message,
        status: "pending",
        createdAt: new Date(),
    };
    try {
        if (isMongoConnected) {
            const savedBooking = await BookingModel.create(newBooking);
            console.log("💾 Booking saved to MongoDB!");
            return res.status(201).json({ message: "Booking created successfully", data: savedBooking });
        }
        else {
            newBooking.id = crypto.randomUUID();
            saveLocalBooking(newBooking);
            console.log("💾 Booking saved to local JSON database!");
            return res.status(201).json({ message: "Booking saved to local database (offline mode)", data: newBooking });
        }
    }
    catch (err) {
        console.error("Failed to save booking:", err);
        return res.status(500).json({ error: "Failed to save booking", details: err.message });
    }
});
// 2. Submit Inquiry (Backward compatibility redirect to bookings)
app.post("/api/inquiries", async (req, res) => {
    const { name, phone, email, date, event, message } = req.body;
    const newBooking = {
        name,
        phone,
        email,
        date,
        event,
        message,
        status: "pending",
        createdAt: new Date(),
    };
    try {
        if (isMongoConnected) {
            const savedBooking = await BookingModel.create(newBooking);
            return res.status(201).json({ message: "Inquiry saved successfully", data: savedBooking });
        }
        else {
            newBooking.id = crypto.randomUUID();
            saveLocalBooking(newBooking);
            return res.status(201).json({ message: "Inquiry saved successfully (offline mode)", data: newBooking });
        }
    }
    catch (err) {
        return res.status(500).json({ error: "Failed to save inquiry", details: err.message });
    }
});
// 3. Get Bookings / Inquiries (Public / Unauthenticated)
app.get("/api/bookings", async (req, res) => {
    try {
        if (isMongoConnected) {
            const bookings = await BookingModel.find().sort({ createdAt: -1 });
            return res.json(bookings);
        }
        else {
            const bookings = getLocalBookings();
            bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            return res.json(bookings);
        }
    }
    catch (err) {
        console.error("Failed to retrieve bookings:", err);
        return res.status(500).json({ error: "Failed to retrieve bookings", details: err.message });
    }
});
// 4. Get Inquiry Compatibility Route
app.get("/api/inquiries", async (req, res) => {
    try {
        if (isMongoConnected) {
            const bookings = await BookingModel.find().sort({ createdAt: -1 });
            return res.json(bookings);
        }
        else {
            const bookings = getLocalBookings().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            return res.json(bookings);
        }
    }
    catch (err) {
        return res.status(500).json({ error: "Failed to retrieve inquiries" });
    }
});
// 5. Accept / Reject Bookings
app.patch("/api/bookings/:id/status", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!status || !["accepted", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Invalid status. Must be accepted or rejected." });
    }
    try {
        if (isMongoConnected) {
            const updatedBooking = await BookingModel.findByIdAndUpdate(id, { status }, { new: true });
            if (!updatedBooking) {
                return res.status(404).json({ error: "Booking not found" });
            }
            return res.json({ message: `Booking status updated to ${status}`, data: updatedBooking });
        }
        else {
            const success = updateLocalBookingStatus(id, status);
            if (!success) {
                return res.status(404).json({ error: "Booking not found in local database" });
            }
            const bookings = getLocalBookings();
            const booking = bookings.find((b) => b.id === id || b._id === id);
            return res.json({ message: `Booking status updated to ${status} (offline mode)`, data: booking });
        }
    }
    catch (err) {
        console.error("Failed to update booking status:", err);
        return res.status(500).json({ error: "Failed to update booking status", details: err.message });
    }
});
// 6. Services Routes
app.get("/api/services", async (req, res) => {
    try {
        if (isMongoConnected) {
            const services = await ServiceModel.find().sort({ createdAt: 1 });
            return res.json(services);
        }
        else {
            const services = getLocalServices();
            services.sort((a, b) => new Date(a.createdAt || "").getTime() - new Date(b.createdAt || "").getTime());
            return res.json(services);
        }
    }
    catch (err) {
        return res.status(500).json({ error: "Failed to retrieve services", details: err.message });
    }
});
app.post("/api/services", async (req, res) => {
    const { icon, title, desc, img } = req.body;
    if (!icon || !title || !desc || !img) {
        return res.status(400).json({ error: "Missing required service fields (icon, title, desc, img)" });
    }
    const newService = { icon, title, desc, img, createdAt: new Date() };
    try {
        if (isMongoConnected) {
            const savedService = await ServiceModel.create(newService);
            return res.status(201).json(savedService);
        }
        else {
            newService.id = crypto.randomUUID();
            const services = getLocalServices();
            services.push(newService);
            saveLocalServices(services);
            return res.status(201).json(newService);
        }
    }
    catch (err) {
        return res.status(500).json({ error: "Failed to create service card", details: err.message });
    }
});
app.delete("/api/services/:id", async (req, res) => {
    const { id } = req.params;
    try {
        if (isMongoConnected) {
            const deleted = await ServiceModel.findByIdAndDelete(id);
            if (!deleted)
                return res.status(404).json({ error: "Service card not found" });
            return res.json({ message: "Service card deleted successfully" });
        }
        else {
            const services = getLocalServices();
            const filtered = services.filter((s) => s.id !== id && s._id !== id);
            if (filtered.length === services.length) {
                return res.status(404).json({ error: "Service card not found in local database" });
            }
            saveLocalServices(filtered);
            return res.json({ message: "Service card deleted successfully" });
        }
    }
    catch (err) {
        return res.status(500).json({ error: "Failed to delete service card", details: err.message });
    }
});
// 7. Gallery Routes
app.get("/api/gallery", async (req, res) => {
    try {
        if (isMongoConnected) {
            const gallery = await GalleryModel.find().sort({ createdAt: 1 });
            return res.json(gallery);
        }
        else {
            const gallery = getLocalGallery();
            gallery.sort((a, b) => new Date(a.createdAt || "").getTime() - new Date(b.createdAt || "").getTime());
            return res.json(gallery);
        }
    }
    catch (err) {
        return res.status(500).json({ error: "Failed to retrieve gallery", details: err.message });
    }
});
app.post("/api/gallery", async (req, res) => {
    const { src, cat, tall, alt } = req.body;
    if (!src || !cat || !alt) {
        return res.status(400).json({ error: "Missing required gallery fields (src, cat, alt)" });
    }
    const newGallery = { src, cat, tall: !!tall, alt, createdAt: new Date() };
    try {
        if (isMongoConnected) {
            const savedGallery = await GalleryModel.create(newGallery);
            return res.status(201).json(savedGallery);
        }
        else {
            newGallery.id = crypto.randomUUID();
            const gallery = getLocalGallery();
            gallery.push(newGallery);
            saveLocalGallery(gallery);
            return res.status(201).json(newGallery);
        }
    }
    catch (err) {
        return res.status(500).json({ error: "Failed to create gallery card", details: err.message });
    }
});
app.delete("/api/gallery/:id", async (req, res) => {
    const { id } = req.params;
    try {
        if (isMongoConnected) {
            const deleted = await GalleryModel.findByIdAndDelete(id);
            if (!deleted)
                return res.status(404).json({ error: "Gallery card not found" });
            return res.json({ message: "Gallery card deleted successfully" });
        }
        else {
            const gallery = getLocalGallery();
            const filtered = gallery.filter((g) => g.id !== id && g._id !== id);
            if (filtered.length === gallery.length) {
                return res.status(404).json({ error: "Gallery card not found in local database" });
            }
            saveLocalGallery(filtered);
            return res.json({ message: "Gallery card deleted successfully" });
        }
    }
    catch (err) {
        return res.status(500).json({ error: "Failed to delete gallery card", details: err.message });
    }
});
// Root Route
app.get("/", (req, res) => {
    res.json({
        status: "online",
        database: isMongoConnected ? "MongoDB" : "JSON Backup File (Offline Mode)",
        endpoints: {
            bookings: {
                create: "POST /api/bookings",
                list: "GET /api/bookings",
                updateStatus: "PATCH /api/bookings/:id/status",
            },
        },
    });
});
app.listen(PORT, () => {
    console.log(`🚀 Upgraded Backend Server running at http://localhost:${PORT}`);
});
