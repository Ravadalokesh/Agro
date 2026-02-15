require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;
const SESSION_SECRET =
  process.env.SESSION_SECRET || "agromart-secret-key-2024";
app.set("trust proxy",1);
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: "auto", // Set to true if using HTTPS
      sameSite:"lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);

// Root URL: serve login/signup (index) first; after login user goes to home
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Static files: public (HTML, images) and src (CSS, JS, components)
app.use(express.static("public"));
app.use(express.static("src"));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// User Schema (user = buyer only; seller = opted-in in profile; admin = login only, no signup)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  userType: {
    type: String,
    enum: ["user", "seller", "admin"],
    default: "user",
  },
  firstName: String,
  lastName: String,
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: "India" },
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  cart: [
    {
      productId: String,
      name: String,
      price: Number,
      image: String,
      quantity: { type: Number, default: 1 },
    },
  ],
  wishlist: [
    {
      productId: String,
      name: String,
      price: Number,
      image: String,
      rating: String,
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

// Product Schema (sellerId null = AgroMart company product; otherwise seller's product)
const productSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  category: { type: String, required: true },
  subcategory: String,
  image: String,
  rating: { type: Number, default: 0 },
  ratings: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      rating: Number,
    },
  ],
  reviews: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      userName: String,
      rating: Number,
      comment: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
  stock: { type: Number, default: 0 },
  sold: { type: Number, default: 0 },
  earnings: { type: Number, default: 0 },
  isAgroMart: { type: Boolean, default: false },
  approved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// Order Schema (productId is String - frontend uses ids like "tools-handset-001")
const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  products: [
    {
      productId: { type: String, required: true },
      name: String,
      price: Number,
      quantity: Number,
    },
  ],
  total: Number,
  deliveryAddress: Object,
  paymentMethod: String,
  status: { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
const Product = mongoose.model("Product", productSchema);
const Order = mongoose.model("Order", orderSchema);

async function seedAdmin() {
  try {
    const adminUser = await User.findOne({ username: "lokesh2004" });
    if (!adminUser) {
      const hashedAdmin = await bcrypt.hash("Ayyappa@66", 10);
      await User.create({
        username: "lokesh2004",
        email: "admin@agromart.com",
        password: hashedAdmin,
        userType: "admin",
        firstName: "Admin",
        lastName: "AgroMart",
      });
      console.log("Admin user lokesh2004 created (password: Ayyappa@66)");
    }
  } catch (e) {
    console.error("Seed admin error:", e);
  }
}
mongoose.connection.once("open", seedAdmin);

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: "Authentication required" });
  }
};

// Routes

// Serve index.html for root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Signup endpoint (only for users; no seller option at signup)
app.post("/api/signup", async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, phone } = req.body;

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "Username or email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      email,
      password: hashedPassword,
      userType: "user",
      firstName,
      lastName,
      phone,
      cart: [],
      wishlist: [],
    });

    await user.save();
    req.session.userId = user._id;
    req.session.userType = user.userType;

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        userType: user.userType,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login endpoint (loginType: 'admin' | 'user'. Admin = no registration)

app.post("/api/login", async (req, res) => {
  try {
    const { username, password, loginType } = req.body;

    if (loginType === "admin") {
      // Admin must supply both correct admin username and password
      const user = await User.findOne({ username, userType: "admin" });
      if (!user) {
        return res.status(401).json({ error: "Invalid admin credentials" });
      }
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ error: "Invalid admin credentials" });
      }
      req.session.userId = user._id;
      req.session.userType = "admin";
      return res.json({
        success: true,
        user: { id: user._id, username: user.username, userType: "admin" },
      });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    if (user.userType === "admin") {
      return res.status(401).json({ error: "Use Admin login for admin account" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    req.session.userId = user._id;
    req.session.userType = user.userType;

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        userType: user.userType,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Logout endpoint
app.post("/api/logout", (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Forgot password endpoint - generates reset token
app.post("/api/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ error: "No account found with that email address" });
    }

    // Generate reset token
    const resetToken = require("crypto").randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
    await user.save();

    // In production, send email with reset link
    // For development, return the token
    const baseUrl = (process.env.APP_BASE_URL || "").trim();
    const resetUrl = `${baseUrl}/reset-password.html?token=${resetToken}`;

    res.json({
      success: true,
      message: "Password reset link generated",
      resetUrl: resetUrl, // In production, this would be sent via email
      email: user.email,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset password endpoint - verify token and update password
app.post("/api/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ error: "Password reset token is invalid or has expired" });
    }

    // Update password
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Forgot username endpoint - retrieve username by email
app.post("/api/forgot-username", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ error: "No account found with that email address" });
    }

    // In production, send email with username
    // For development, return the username
    res.json({
      success: true,
      username: user.username,
      email: user.email,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
app.get("/api/user", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId)
      .select("-password")
      .lean();
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return full user object with all fields needed for profile
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
app.put("/api/user", requireAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.session.userId, req.body, {
      new: true,
      runValidators: true,
    }).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Become a seller (user can opt-in from profile; no signup option for seller)
app.put("/api/user/become-seller", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (user.userType === "admin") {
      return res.status(400).json({ error: "Admin cannot become seller" });
    }
    if (user.userType === "seller") {
      return res.json(user);
    }
    user.userType = "seller";
    await user.save();
    const u = await User.findById(user._id).select("-password");
    res.json(u);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cart endpoints
app.get("/api/cart", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);

    // Admin cannot access cart
    if (user.userType === "admin") {
      return res.status(403).json({ error: "Admin cannot access cart" });
    }

    // Normalize duplicates in persisted cart so UI shows one row per product.
    let changed = false;
    const merged = new Map();
    for (const item of user.cart || []) {
      const productId =
        item.productId != null ? String(item.productId).trim() : "";
      const qty = Math.max(1, Number(item.quantity) || 1);
      const key = productId
        ? `id:${productId}`
        : `legacy:${item.name || ""}|${item.price || 0}|${item.image || ""}`;

      if (merged.has(key)) {
        merged.get(key).quantity += qty;
        changed = true;
      } else {
        merged.set(key, {
          productId,
          name: item.name,
          price: item.price,
          image: item.image,
          quantity: qty,
        });
      }
    }

    if (changed || (user.cart || []).length !== merged.size) {
      user.cart = Array.from(merged.values());
      await user.save();
    }

    res.json(user.cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/cart", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);

    // Admin cannot add to cart
    if (user.userType === "admin") {
      return res.status(403).json({ error: "Admin cannot add items to cart" });
    }

    const productId =
      req.body.productId != null ? String(req.body.productId).trim() : "";
    const { name, price, image } = req.body;
    if (!productId) {
      return res.status(400).json({ error: "Invalid product id" });
    }

    // Check if product exists and if seller is trying to buy their own product
    let dbProduct = null;
    if (mongoose.Types.ObjectId.isValid(productId)) {
      dbProduct = await Product.findById(productId);
      if (
        dbProduct &&
        dbProduct.sellerId &&
        dbProduct.sellerId.toString() === req.session.userId
      ) {
        return res
          .status(400)
          .json({ error: "You cannot buy your own product" });
      }
    }

    const existingItem = user.cart.find((item) => item.productId === productId);
    const currentQty = existingItem ? existingItem.quantity || 0 : 0;
    const newQty = currentQty + 1;

    // Enforce stock limits for database-backed products
    if (dbProduct) {
      const available = dbProduct.stock || 0;
      if (available <= 0) {
        return res
          .status(400)
          .json({ error: "This product is currently out of stock" });
      }
      if (newQty > available) {
        return res.status(400).json({
          error: `Only ${available} item${
            available === 1 ? "" : "s"
          } left in stock`,
        });
      }
    }

    if (existingItem) {
      existingItem.quantity = newQty;
    } else {
      user.cart.push({ productId, name, price, image, quantity: 1 });
    }

    await user.save();
    res.json(user.cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/cart/:productId", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const productId =
      req.params.productId != null ? String(req.params.productId).trim() : "";
    const requestedQty = Number(req.body.quantity) || 0;

    const item = user.cart.find((i) => i.productId === productId);
    if (item) {
      if (requestedQty <= 0) {
        // Remove when quantity becomes zero or negative
        user.cart = user.cart.filter((i) => i.productId !== productId);
      } else {
        // Enforce stock limits for database-backed products
        if (mongoose.Types.ObjectId.isValid(productId)) {
          const product = await Product.findById(productId);
          if (product) {
            const available = product.stock || 0;
            if (requestedQty > available) {
              return res.status(400).json({
                error: `Only ${available} item${
                  available === 1 ? "" : "s"
                } left in stock`,
              });
            }
          }
        }

        item.quantity = requestedQty;
      }
    }

    await user.save();
    res.json(user.cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/cart/:productId", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    user.cart = user.cart.filter(
      (item) => item.productId !== req.params.productId,
    );
    await user.save();
    res.json(user.cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Wishlist endpoints
app.get("/api/wishlist", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);

    // Admin cannot access wishlist
    if (user.userType === "admin") {
      return res.status(403).json({ error: "Admin cannot access wishlist" });
    }

    res.json(user.wishlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/wishlist", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);

    // Admin cannot add to wishlist
    if (user.userType === "admin") {
      return res
        .status(403)
        .json({ error: "Admin cannot add items to wishlist" });
    }

    const { productId, name, price, image, rating } = req.body;

    const existingItem = user.wishlist.find(
      (item) => item.productId === productId,
    );
    if (existingItem) {
      user.wishlist = user.wishlist.filter(
        (item) => item.productId !== productId,
      );
      await user.save();
      res.json({ added: false, wishlist: user.wishlist });
    } else {
      user.wishlist.push({ productId, name, price, image, rating });
      await user.save();
      res.json({ added: true, wishlist: user.wishlist });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/wishlist/:productId", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    user.wishlist = user.wishlist.filter(
      (item) => item.productId !== req.params.productId,
    );
    await user.save();
    res.json(user.wishlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Product endpoints (for sellers)
app.get("/api/products", async (req, res) => {
  try {
    const query = {};
    if (req.query.category) query.category = req.query.category;

    // Only show approved products to non-admin users
    if (req.session.userId) {
      const user = await User.findById(req.session.userId);
      if (user && user.userType !== "admin") {
        query.approved = true;
      }
    } else {
      query.approved = true;
    }

    const products = await Product.find(query).populate("sellerId", "username");
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/products", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const isAgroMart = req.body.isAgroMart && user.userType === "admin";
    if (user.userType !== "seller" && user.userType !== "admin") {
      return res.status(403).json({ error: "Only sellers can add products" });
    }

    const product = new Product({
      ...req.body,
      sellerId: isAgroMart ? null : req.session.userId,
      isAgroMart: !!isAgroMart,
      approved: isAgroMart || user.userType === "admin", // Auto-approve AgroMart and admin products
    });

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/products/seller", requireAuth, async (req, res) => {
  try {
    const products = await Product.find({ sellerId: req.session.userId });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/products/:id", requireAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    const user = await User.findById(req.session.userId);
    const isAdmin = user.userType === "admin";
    const isOwner =
      product.sellerId && product.sellerId.toString() === req.session.userId;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    Object.assign(product, req.body);
    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/products/:id", requireAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    const user = await User.findById(req.session.userId);
    const isAdmin = user.userType === "admin";
    const isOwner =
      product.sellerId && product.sellerId.toString() === req.session.userId;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rate a product (1-5); users can rate products
app.post("/api/products/:id/rate", requireAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    let rating = Math.min(5, Math.max(1, Number(req.body.rating) || 0));
    if (!product.ratings) product.ratings = [];
    const idx = product.ratings.findIndex(
      (r) => r.userId && r.userId.toString() === req.session.userId,
    );
    if (idx >= 0) product.ratings[idx].rating = rating;
    else product.ratings.push({ userId: req.session.userId, rating });
    const sum = product.ratings.reduce((s, r) => s + r.rating, 0);
    product.rating = product.ratings.length ? sum / product.ratings.length : 0;
    await product.save();
    res.json({ rating: product.rating, count: product.ratings.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get reviews for a product
app.get("/api/products/:id/reviews", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    res.json({
      reviews: product.reviews || [],
      rating: product.rating || 0,
      reviewCount: product.reviews ? product.reviews.length : 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add review to a product
app.post("/api/products/:id/review", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);

    // Admin cannot add reviews
    if (user.userType === "admin") {
      return res
        .status(403)
        .json({ error: "Admin cannot add product reviews" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    if (!product.reviews) product.reviews = [];

    // Check if user already reviewed
    const existingReviewIdx = product.reviews.findIndex(
      (r) => r.userId && r.userId.toString() === req.session.userId,
    );

    if (existingReviewIdx >= 0) {
      // Update existing review
      product.reviews[existingReviewIdx].rating = rating;
      product.reviews[existingReviewIdx].comment = comment || "";
      product.reviews[existingReviewIdx].createdAt = new Date();
    } else {
      // Add new review
      product.reviews.push({
        userId: req.session.userId,
        userName: user.username,
        rating,
        comment: comment || "",
        createdAt: new Date(),
      });
    }

    // Update overall rating
    if (!product.ratings) product.ratings = [];
    const ratingIdx = product.ratings.findIndex(
      (r) => r.userId && r.userId.toString() === req.session.userId,
    );
    if (ratingIdx >= 0) product.ratings[ratingIdx].rating = rating;
    else product.ratings.push({ userId: req.session.userId, rating });

    const sum = product.ratings.reduce((s, r) => s + r.rating, 0);
    product.rating = product.ratings.length ? sum / product.ratings.length : 0;

    await product.save();
    res.json({
      rating: product.rating,
      reviewCount: product.reviews.length,
      reviews: product.reviews,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search products
app.get("/api/products/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === "") {
      return res.json([]);
    }

    const searchText = String(q).trim();
    const escapeRegex = (value) =>
      String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const normalized = searchText
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const baseFilter = {};

    // Only show approved products to non-admin users
    if (req.session.userId) {
      const user = await User.findById(req.session.userId);
      if (user && user.userType !== "admin") {
        baseFilter.approved = true;
      }
    } else {
      baseFilter.approved = true;
    }

    // If the search text matches a known category keyword, prioritize
    // returning products from that category only.
    const categoryAliases = {
      "vegetables-fruits": [
        "vegetable",
        "vegetables",
        "vegitable",
        "vegitables",
        "vegetaable",
        "vegetaables",
        "fruit",
        "fruits",
      ],
      "grains-pulses": ["grain", "grains", "pulse", "pulses", "dal", "lentil", "lentils"],
      "seeds-fertilizers": ["seed", "seeds", "fertilizer", "fertilizers", "manure"],
      "tools-equipment": ["tool", "tools", "equipment", "equipments", "farm tool"],
      livestock: ["livestock", "cattle", "poultry", "goat", "goats", "animal"],
    };

    const matchedCategorySlugs = Object.entries(categoryAliases)
      .filter(([, aliases]) =>
        aliases.some(
          (word) =>
            normalized.includes(word) ||
            (normalized.length >= 4 && word.includes(normalized)),
        ),
      )
      .map(([slug]) => slug);

    if (matchedCategorySlugs.length > 0) {
      const categoryQuery = {
        ...baseFilter,
        $or: matchedCategorySlugs.map((slug) => ({
          category: { $regex: escapeRegex(slug), $options: "i" },
        })),
      };

      const categoryProducts = await Product.find(categoryQuery)
        .populate("sellerId", "username")
        .limit(50);
      return res.json(categoryProducts);
    }

    const directQuery = {
      ...baseFilter,
      $or: [
        { name: { $regex: escapeRegex(searchText), $options: "i" } },
        { description: { $regex: escapeRegex(searchText), $options: "i" } },
        { category: { $regex: escapeRegex(searchText), $options: "i" } },
      ],
    };

    const directProducts = await Product.find(directQuery)
      .populate("sellerId", "username")
      .limit(50);

    if (directProducts.length >= 50) {
      return res.json(directProducts);
    }

    const directIds = directProducts.map((p) => p._id);
    const directCategories = [
      ...new Set(
        directProducts.map((p) => (p.category || "").trim()).filter(Boolean),
      ),
    ];

    if (directCategories.length === 0) {
      return res.json(directProducts);
    }

    const relatedQuery = {
      ...baseFilter,
      _id: { $nin: directIds },
      category: { $in: directCategories },
    };

    const relatedProducts = await Product.find(relatedQuery)
      .populate("sellerId", "username")
      .limit(Math.max(0, 50 - directProducts.length));

    res.json([...directProducts, ...relatedProducts]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pending products (admin only)
app.get("/api/products/pending", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (user.userType !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const products = await Product.find({ approved: false }).populate(
      "sellerId",
      "username email",
    );
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve product (admin only)
app.put("/api/products/:id/approve", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (user.userType !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    product.approved = true;
    await product.save();
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Orders endpoint
app.post("/api/orders", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);

    // Admin cannot place orders
    if (user.userType === "admin") {
      return res.status(403).json({ error: "Admin cannot place orders" });
    }

    const rawItems = Array.isArray(req.body.products) ? req.body.products : [];
    if (rawItems.length === 0) {
      return res.status(400).json({ error: "No products found in order" });
    }

    // Helper to validate MongoDB ObjectIds
    const isValidObjectId = (id) =>
      mongoose.Types.ObjectId.isValid(id) && String(id).length === 24;

    // Pre-validate stock for all DB-backed products so users
    // cannot purchase more than available stock.
    const dbUpdates = [];
    for (const item of rawItems) {
      const productId = item.productId != null ? String(item.productId) : "";
      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty <= 0) {
        return res.status(400).json({ error: "Invalid quantity in order" });
      }

      if (productId && isValidObjectId(productId)) {
        const product = await Product.findById(productId);
        if (!product || !product.approved) {
          return res
            .status(400)
            .json({ error: "One or more products are unavailable" });
        }
        if (
          product.sellerId &&
          product.sellerId.toString() === req.session.userId
        ) {
          return res.status(400).json({ error: "You cannot buy your own product" });
        }

        const available = product.stock || 0;
        if (available < qty) {
          return res.status(400).json({
            error: `Only ${available} unit${
              available === 1 ? "" : "s"
            } available for ${product.name}`,
          });
        }

        dbUpdates.push({
          product,
          qty,
          price: Number(item.price) || product.price || 0,
        });
      }
    }

    // Normalize items stored on the order
    const products = rawItems.map((item) => ({
      productId: String(item.productId != null ? item.productId : ""),
      name: item.name,
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
    }));

    const order = new Order({
      userId: req.session.userId,
      products,
      total: Number(req.body.total) || 0,
      deliveryAddress: req.body.deliveryAddress || {},
      paymentMethod: req.body.paymentMethod || "Cash on Delivery",
    });

    await order.save();

    // Apply stock, sold, and earnings updates for DB-backed products
    for (const { product, qty, price } of dbUpdates) {
      product.sold += qty;
      product.earnings += price * qty;
      product.stock = Math.max(0, (product.stock || 0) - qty);
      await product.save();
    }

    // Clear cart after successful order
    user.cart = [];
    await user.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// app.post("/api/orders", requireAuth, async (req, res) => {
//   try {
//     const user = await User.findById(req.session.userId);

//     // Admin cannot place orders
//     if (user.userType === "admin") {
//       return res.status(403).json({ error: "Admin cannot place orders" });
//     }

//     const products = (req.body.products || []).map((item) => ({
//       productId: String(item.productId != null ? item.productId : ""),
//       name: item.name,
//       price: Number(item.price) || 0,
//       quantity: Number(item.quantity) || 1,
//     }));
//     const order = new Order({
//       userId: req.session.userId,
//       products,
//       total: Number(req.body.total) || 0,
//       deliveryAddress: req.body.deliveryAddress || {},
//       paymentMethod: req.body.paymentMethod || "Cash on Delivery",
//     });

//     await order.save();

//     // Update seller earnings only for products that exist in DB (valid ObjectId)
//     const isValidObjectId = (id) =>
//       mongoose.Types.ObjectId.isValid(id) && String(id).length === 24;
//     for (const item of req.body.products) {
//       if (item.productId && isValidObjectId(item.productId)) {
//         const product = await Product.findById(item.productId);
//         if (product) {
//           const qty = Number(item.quantity) || 1;
//           product.sold += qty;
//           product.earnings += (Number(item.price) || 0) * qty;
//           product.stock = Math.max(0, (product.stock || 0) - qty);
//           await product.save();
//         }
//       }
//     }

//     // Clear cart
//     user.cart = [];
//     await user.save();

//     res.json(order);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

app.get("/api/orders", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    let orders;

    if (user.userType === "seller") {
      // Get orders for seller's products
      const products = await Product.find({ sellerId: req.session.userId });
      const productIds = products.map((p) => p._id);
      orders = await Order.find({ "products.productId": { $in: productIds } });
    } else {
      orders = await Order.find({ userId: req.session.userId });
    }

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Seller earnings endpoint
app.get("/api/seller/earnings", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    // Sellers see earnings for their own products.
    // Admins see earnings for AgroMart products they manage.
    if (user.userType !== "seller" && user.userType !== "admin") {
      return res
        .status(403)
        .json({ error: "Only sellers or admins can view earnings" });
    }

    let products;
    if (user.userType === "admin") {
      products = await Product.find({ isAgroMart: true });
    } else {
      products = await Product.find({ sellerId: req.session.userId });
    }
    const totalEarnings = products.reduce(
      (sum, product) => sum + (product.earnings || 0),
      0,
    );
    const totalSold = products.reduce(
      (sum, product) => sum + (product.sold || 0),
      0,
    );

    res.json({
      totalEarnings,
      totalSold,
      products: products.length,
      productsList: products,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Get all users
app.get("/api/admin/users", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (user.userType !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const users = await User.find({ userType: { $in: ["user", "seller"] } })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Get all sellers
app.get("/api/admin/sellers", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (user.userType !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const sellers = await User.find({ userType: "seller" })
      .select("-password")
      .sort({ createdAt: -1 });

    // Get product counts for each seller
    const sellersWithStats = await Promise.all(
      sellers.map(async (seller) => {
        const products = await Product.find({ sellerId: seller._id });
        const approvedProducts = products.filter((p) => p.approved).length;
        const pendingProducts = products.filter((p) => !p.approved).length;
        const totalEarnings = products.reduce(
          (sum, p) => sum + (p.earnings || 0),
          0,
        );

        return {
          ...seller.toObject(),
          totalProducts: products.length,
          approvedProducts,
          pendingProducts,
          totalEarnings,
        };
      }),
    );

    res.json(sellersWithStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Get all orders
app.get("/api/admin/orders", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (user.userType !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const orders = await Order.find()
      .populate("userId", "username email")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Get statistics
app.get("/api/admin/statistics", requireAuth, async (req, res) => {
  try {
    const admin = await User.findById(req.session.userId);
    if (!admin || admin.userType !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const [
      totalUsers,
      totalSellers,
      totalProducts,
      approvedProducts,
      pendingProducts,
      totalOrders,
    ] = await Promise.all([
      User.countDocuments({ userType: "user" }),
      User.countDocuments({ userType: "seller" }),
      Product.countDocuments(),
      Product.countDocuments({ approved: true }),
      Product.countDocuments({ approved: false }),
      Order.countDocuments(),
    ]);

    res.json({
      totalUsers,
      totalSellers,
      totalProducts,
      approvedProducts,
      pendingProducts,
      totalOrders,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Total earnings (platform earnings)
app.get("/api/admin/earnings", requireAuth, async (req, res) => {
  try {
    const admin = await User.findById(req.session.userId);
    if (!admin || admin.userType !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const orders = await Order.find();

    let totalRevenue = 0;
    let totalItemsSold = 0;

    for (const order of orders) {
      for (const item of order.products) {
        totalRevenue += (Number(item.price) || 0) * (Number(item.quantity) || 1);
        totalItemsSold += Number(item.quantity) || 1;
      }
    }

    const agroMartProducts = await Product.find({ isAgroMart: true });
    let totalEarnings = 0;
    let totalSold = 0;
    agroMartProducts.forEach((p) => {
      totalEarnings += p.earnings || 0;
      totalSold += p.sold || 0;
    });

    res.json({
      totalEarnings,
      totalRevenue,
      totalOrders: orders.length,
      totalItemsSold,
      totalSold,
      totalProducts: agroMartProducts.length,
      products: agroMartProducts,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// app.get("/api/admin/statistics", requireAuth, async (req, res) => {
//   try {
//     const user = await User.findById(req.session.userId);
//     if (user.userType !== "admin") {
//       return res.status(403).json({ error: "Admin access required" });
//     }

//     const totalUsers = await User.countDocuments({ userType: "user" });
//     const totalSellers = await User.countDocuments({ userType: "seller" });
//     const totalProducts = await Product.countDocuments();
//     const approvedProducts = await Product.countDocuments({ approved: true });
//     const pendingProducts = await Product.countDocuments({ approved: false });
//     const totalOrders = await Order.countDocuments();

//     res.json({
//       totalUsers,
//       totalSellers,
//       totalProducts,
//       approvedProducts,
//       pendingProducts,
//       totalOrders,
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// Get predefined categories
app.get("/api/categories", async (req, res) => {
  try {
    // Predefined categories
    const predefinedCategories = [
      {
        value: "vegetables-fruits",
        label: "Vegetables & Fruits",
        subcategories: [
          "Fresh Vegetables",
          "Fresh Fruits",
          "Organic Produce",
          "Seasonal Vegetables",
        ],
      },
      {
        value: "grains-pulses",
        label: "Grains & Pulses",
        subcategories: ["Rice", "Wheat", "Pulses", "Millets", "Flour"],
      },
      {
        value: "seeds-fertilizers",
        label: "Seeds & Fertilizers",
        subcategories: [
          "Vegetable Seeds",
          "Fruit Seeds",
          "Flower Seeds",
          "Organic Fertilizers",
          "Chemical Fertilizers",
        ],
      },
      {
        value: "tools-equipment",
        label: "Tools & Equipment",
        subcategories: [
          "Hand Tools",
          "Power Tools",
          "Irrigation Equipment",
          "Sprayers",
          "Farm Machinery",
        ],
      },
      {
        value: "livestock",
        label: "Livestock & Poultry",
        subcategories: [
          "Cattle",
          "Goats",
          "Poultry",
          "Feed",
          "Veterinary Products",
        ],
      },
      {
        value: "dairy-products",
        label: "Dairy Products",
        subcategories: ["Milk", "Cheese", "Butter", "Yogurt", "Ghee"],
      },
      {
        value: "organic-products",
        label: "Organic Products",
        subcategories: [
          "Organic Vegetables",
          "Organic Fruits",
          "Organic Grains",
          "Organic Fertilizers",
        ],
      },
    ];

    // Get custom categories from database
    const customCategories = await Product.distinct("category");
    const allCustomCategories = customCategories
      .filter((cat) => !predefinedCategories.find((p) => p.value === cat))
      .map((cat) => ({ value: cat, label: cat, custom: true }));

    res.json({
      predefined: predefinedCategories,
      custom: allCustomCategories,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server only when run directly (not imported by serverless handlers/tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
