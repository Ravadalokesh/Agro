# AgroMart - E-Commerce Platform

A full-stack e-commerce platform for agricultural products with user authentication, cart management, wishlist, and seller features.

## Features

- **User Authentication**: Login and Signup with MongoDB
- **User Types**: Customer and Seller accounts
- **Shopping Cart**: User-specific cart stored in MongoDB
- **Wishlist**: User-specific wishlist stored in MongoDB
- **Product Management**: Sellers can add, edit, and delete products
- **Earnings Tracking**: Sellers can view their earnings and sales
- **Order Management**: Complete order processing system

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# On Windows (if MongoDB is installed as a service, it should start automatically)
# Or start manually:
mongod

# On Linux/Mac:
sudo systemctl start mongod
# or
mongod
```

### 3. Start the Server

```bash
npm start
```

The server will start on `http://localhost:5000` (or `PORT` from `.env`).

### 4. Access the Application

- Open your browser and navigate to `http://localhost:5000`
- You'll be redirected to the login/signup page
- Create an account (choose Customer or Seller)
- Start shopping or selling!

## Project Structure

```
pro2modified/
├── server.js              # Express server with MongoDB
├── package.json            # Dependencies
├── public/                # Frontend pages
│   ├── index.html         # Login/Signup page
│   ├── home.html          # Home page
│   ├── profile.html       # User/Seller profile
│   ├── cart.html          # Shopping cart
│   ├── checkout.html      # Checkout page
│   ├── wishlist.html      # Wishlist page
│   └── [category pages]   # Category pages
├── src/
│   ├── components/        # Header and Footer components
│   ├── js/                # JavaScript modules
│   │   ├── cart.js        # Cart management
│   │   └── wishlist.js    # Wishlist management
│   └── styles/            # CSS files
└── node_modules/          # Dependencies
```

## API Endpoints

### Authentication
- `POST /api/signup` - Create new account
- `POST /api/login` - Login
- `POST /api/logout` - Logout
- `GET /api/user` - Get current user

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:productId` - Update quantity
- `DELETE /api/cart/:productId` - Remove item

### Wishlist
- `GET /api/wishlist` - Get user's wishlist
- `POST /api/wishlist` - Add/remove from wishlist
- `DELETE /api/wishlist/:productId` - Remove item

### Products (Seller)
- `GET /api/products` - Get all products
- `POST /api/products` - Add product (seller only)
- `GET /api/products/seller` - Get seller's products
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Orders
- `POST /api/orders` - Place order
- `GET /api/orders` - Get orders

### Seller Earnings
- `GET /api/seller/earnings` - Get seller earnings

## MongoDB Collections

- **users**: User accounts (customers and sellers)
- **products**: Products listed by sellers
- **orders**: Order history

## Notes

- All cart and wishlist data is stored per user in MongoDB
- Sellers can manage their products and view earnings
- Customers can shop, add to cart, and place orders
- Authentication is required for most features

## Deploy on Render + Vercel

### 1. Deploy backend on Render

- Push this repo to GitHub.
- In Render: **New +** -> **Blueprint** (uses `render.yaml`) and connect your repo.
- Set environment variables in Render service:
  - `MONGO_URI` = your MongoDB Atlas connection string
  - `APP_BASE_URL` = your Vercel frontend URL (for example `https://your-app.vercel.app`)
  - `SESSION_SECRET` = long random secret
- Deploy and copy your Render service URL (for example `https://agromart-api.onrender.com`).

### 2. Point Vercel to Render API

- In `vercel.json`, replace:
  - `https://YOUR-RENDER-SERVICE.onrender.com`
  - with your real Render URL.

### 3. Deploy frontend on Vercel

- Import the same GitHub repo in Vercel.
- Framework preset: **Other**.
- Build command: leave empty.
- Output directory: leave empty.
- Deploy.

After deploy:
- Frontend runs on Vercel.
- `/api/*` calls are proxied by Vercel to Render.
- Keep `APP_BASE_URL` in Render set to your Vercel URL so password reset links open on the frontend domain.
