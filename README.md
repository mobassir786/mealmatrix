# MealMatrix 2.0 — Full-Stack Food Delivery Platform

🔗 **Live Demo**: https://mealmatrix-self.vercel.app/
🔗 **Backend API**: https://mealmatrix-backend-ugt9.onrender.com/health
📦 **Source Code**: https://github.com/mobassir786/mealmatrix

> Note: the backend runs on a free tier that sleeps after 15 minutes of inactivity — the first request after idle time can take 30-50 seconds to wake up. Please allow a moment on first load.

A food delivery platform with an event-driven order state machine, idempotent checkout, geo-based delivery assignment, and real-time WebSocket order tracking.

## Project Structure

```
mealmatrix-backend/     Node.js + Express + MongoDB + Socket.IO
mealmatrix-frontend/    React + Vite
```

## Quick Start

### 1. Backend

```bash
cd mealmatrix-backend
npm install
cp .env.example .env          # edit MONGODB_URI if using Atlas instead of local
npm run dev                   # starts on http://localhost:5000
```

In a second terminal, seed some demo data:

```bash
node seed.js
```

Run tests:

```bash
npm test
```

### 2. Frontend

```bash
cd mealmatrix-frontend
npm install
npm run dev                   # starts on http://localhost:5173
```

Open http://localhost:5173 — you should see 3 seeded restaurants.

### 3. Try the full flow

1. Click a restaurant → add items to cart
2. Go to Cart → Checkout → Place Order (mock payment, no real card needed)
3. You'll land on the **live tracking page** for that order
4. To see the delivery pin actually move: open `mealmatrix-backend/tracking-demo.html`
   directly in your browser, paste in the **order ID** from your tracking page's URL,
   and click "Start Simulated Delivery" — you'll see both pages update from the same
   WebSocket event stream in real time

## What's implemented vs. documented as future work

**Implemented:**
- Order state machine with enforced transitions (`placed → confirmed → preparing → out_for_delivery → delivered/cancelled`)
- Idempotent order creation (duplicate-safe checkout)
- Geo-based delivery partner assignment with atomic locking (no double-booking race conditions)
- Real-time order tracking via Socket.IO rooms (one room per order)
- Mock Stripe payment flow + webhook handler
- Restaurant/menu CRUD + basic text search
- React frontend: home/search, menu, cart, checkout, live tracking
- Jest test suite for the order state machine and idempotency

**Documented as future work (mention these in interviews as "next steps I'd take with more time"):**
- Redis caching layer for restaurant menus and search results
- RabbitMQ/Kafka event bus instead of direct function calls between services
- Elasticsearch for typo-tolerant search (currently uses MongoDB `$text` index)
- Real collaborative-filtering recommendation model (currently a simple "most-ordered" count)
- Real Stripe integration with signature-verified webhooks (currently mocked)
- Group ordering and subscription-tier features
- PWA support (offline cart, installable, push notifications)

Read `INTERVIEW_CHEATSHEET.md` in the backend folder before any interview — it explains
the reasoning behind every major decision in plain language.

## Deployment (when ready)

- Backend: Render or Railway (set `MONGODB_URI` to a MongoDB Atlas connection string)
- Frontend: Vercel or Netlify (set `VITE_API_URL` and `VITE_SOCKET_URL` to your deployed backend URL)
- Database: MongoDB Atlas free tier
