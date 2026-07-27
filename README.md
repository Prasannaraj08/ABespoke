# Clara Luxe - Premium Fashion E-Commerce Platform

A production-ready, highly aesthetic fashion e-commerce platform inspired by Myntra. Features a clean, luxury user interface with a full shopping journey, secure JWT authentication, order management, custom payment validation, shipping slots, admin dashboards, and AI-driven fashion recommendations.

---

## Technical Stack
* **Frontend**: React (Vite) + TypeScript + Tailwind CSS + Lucide Icons + Framer Motion (for premium animations).
* **Backend**: Node.js + Express + TypeScript (JWT-signed sessions, Bcrypt hashing, RESTful routing).
* **Database**: Persistent JSON-relational database store. Custom service class reads/writes tables to local disk atomically, making the application 100% portable with zero setup and zero C++ native compilation errors on Windows.
* **AI Recommendations**: Collaborative and content-based recommendation logic using viewing history, brand matching, cross-sell pairing, and smart search suggestions.

---

## Core Features
1. **Premium Landing Page**: Glassmorphic header, heroes, collections, best sellers, and seasonal promo banner.
2. **Auth & Sessions**: Registration, login, profile retrieval, and mock Google OAuth.
3. **Product Catalog & Filters**: Full search index, extensive filters (brands, sizes, colors, fabric, fit, occasion, pattern), and sorting.
4. **Product Details**: Image gallery with hover zoom, quantity selectors, live pincode check ( metro vs. suburb delivery estimates), and customer review submission.
5. **AI Recommendations**: Similar products list, personalized recommendations tab, and "Frequently Bought Together" bundles (cross-sell bundle adding 3 items to bag at once).
6. **Checkout & Payments**: CRUD addresses profiles, delivery speed slots, and payment simulator (UPI, Cards, Net Banking, COD) with funny loading screens.
7. **User Dashboard**: Tracking shipment timeline milestone logs, saved addresses, wishlist grid, and printable HTML invoices.
8. **Admin Control**: Sales analytics metrics, category breakdown charts, catalog manager (CRUD products), coupon configurations, and global shipment updates.

---

## Setup & Startup Instructions

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* [npm](https://www.npmjs.com/)

### 1. Installation
Install all dependencies for both backend and frontend from the root workspace directory:
```bash
npm run install:all
```

### 2. Run the Application
Start both the backend server and frontend development server simultaneously:
```bash
# In one terminal tab, start the backend (starts on Port 5000)
npm run dev:backend

# In another terminal tab, start the frontend React app (starts on Port 5173)
npm run dev:frontend
```

Once running:
* **Frontend URL**: `http://localhost:5173/`
* **Backend Health Check**: `http://localhost:5000/health`

---

## Mock Accounts & Demo Credentials

To test customer and administrator workflows out-of-the-box, use these seeded logins:

### Customer Profile
* **Email**: `customer@example.com`
* **Password**: `password123`

### Admin Controller
* **Email**: `admin@example.com`
* **Password**: `adminpassword`

---

## Available Discount Coupon Codes
Apply these promo codes during the checkout drawer summary to calculate discounts:
* `FASHION10`: 10% Off (Max discount Rs. 500, Min order Rs. 1000)
* `PREMIUM20`: 20% Off (Max discount Rs. 1500, Min order Rs. 3000)
* `FESTIVE30`: 30% Off (Max discount Rs. 3000, Min order Rs. 5000)
