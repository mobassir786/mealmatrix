# MealMatrix Backend — Interview Cheat Sheet
### Simple explanations for every design decision, so you can defend this project confidently

Read this like a script. Each section = one question they might ask + how to answer it in your own words.

---

### Q: "Walk me through what happens when a user places an order."

**Your answer:**
"When the frontend calls `POST /api/orders`, I first check if this exact request already happened using an **idempotency key** — a unique ID the frontend generates once per checkout attempt. If the order already exists with that key, I just return it instead of creating a duplicate. This handles double-clicks and network retries safely.

Then I check the restaurant is open, calculate pricing — including a surge fee if it's a peak hour like lunch or dinner time — and save the order with status `placed`. In the full production version, I'd also publish an event to a message queue like RabbitMQ so the notification and delivery-matching services pick it up asynchronously, instead of the order request waiting on all of that."

---

### Q: "How do you make sure an order's status can't be corrupted or set incorrectly?"

**Your answer:**
"I built an explicit **state machine** for order status. Instead of a plain string field anyone can overwrite, I defined which transitions are legal — for example, `placed` can only go to `confirmed` or `cancelled`, never straight to `delivered`. The `transitionTo()` method on the Order model checks this and throws an error if someone tries an invalid transition. This means a bug or a bad API call can never silently corrupt order state."

---

### Q: "Why MongoDB instead of a SQL database here?"

**Your answer:**
"Orders have a naturally nested shape — an order contains a list of items, a pricing breakdown, and a status history — which maps well to a document. I did keep relational-style references (`ObjectId` with `ref`) for restaurant, customer, and delivery partner, so I still get referential structure where it matters, similar to foreign keys."

---

### Q: "How would this scale if you had 10,000 orders a day?"

**Your answer:**
"A few things I've already accounted for: a 2dsphere-style geo index on restaurant location for fast 'near me' queries, a text index for search before adding a dedicated search engine like Elasticsearch, and Redis caching for frequently-read data like restaurant menus so we're not hitting MongoDB on every page load. For write-heavy paths like order creation, the idempotency key also prevents duplicate writes under retry storms."

---

### Q: "Why did you snapshot the item name/price inside the order instead of just referencing the menu item?"

**Your answer:**
"Because menu prices change over time. If a restaurant updates a dish's price tomorrow, an order placed today should still show the price the customer actually paid. So I store a snapshot of `name` and `price` at order time, and keep `menuItem` only as a reference for analytics — like the 'frequently ordered together' feature."

---

### Q: "What was the hardest technical decision in this project?"

**Your answer (customize this with your own experience once you've built it):**
"Deciding where business logic like pricing and status transitions should live. I kept them as methods on the model (`transitionTo`, `calculatePricing`) rather than scattering `if` checks across controllers, so the rules are enforced no matter which route or script touches an order."

---

### Q: "Tell me about the group ordering feature — how does it work?"

**Your answer:**
"A host creates a group order for a restaurant and gets a shareable 6-character code. Friends join using that code and add their own items — everyone sees a live summary of who's ordered what. Once everyone marks themselves 'done', the host finalizes it, which merges every participant's items into ONE real order using the exact same pricing and order-creation logic as a solo order — I didn't duplicate that logic, I reused the `calculatePricing` function. The key benefit is the delivery fee gets split across everyone instead of each person paying it separately."

---

### Q: "What happens if two people order the same dish in a group order?"

**Your answer:**
"When I merge everyone's items, I key by `menuItem` ID. If two participants both ordered Paneer Tikka, their quantities combine into a single line item with quantity 2, instead of two separate lines. This keeps the final order clean and matches how a real kitchen would want to see it — 'make 2 paneer tikkas', not two separate tickets for the same dish."

---

### Q: "Why did you make group orders auto-expire after an hour?"

**Your answer:**
"If someone creates a group order and nobody finishes it, that document would sit in the database forever with no cleanup. I used MongoDB's TTL (time-to-live) index — `expireAfterSeconds: 0` combined with an `expiresAt` date field — so MongoDB automatically deletes it once that time passes. This means I don't need a separate cron job or cleanup script; the database handles it natively."

## What to build next (in order) so this story stays consistent

1. ~~Delivery partner assignment logic~~ ✅ done — see below
2. ~~WebSocket layer~~ ✅ done — see below
3. **Payment webhook handler** — Stripe calls your server when payment succeeds/fails; update `order.payment.status` from there, not from the frontend.
4. **Basic tests** — at least one test proving an invalid transition (e.g. `placed → delivered`) throws an error. This is an easy, high-value test to write and to mention.

---

### Q: "How do you assign a delivery partner without two orders grabbing the same one?"

**Your answer:**
"I use `findOneAndUpdate` with a status filter — I only update the partner's status to `on_delivery` if their current status is still `available` at the exact moment of the write. MongoDB does this atomically per document, so if two requests race for the same partner, only one write succeeds. The loser just retries and finds the next-nearest partner. This avoids needing an external lock or transaction for something this simple."

---

### Q: "How does the live tracking actually work end to end?"

**Your answer:**
"The delivery partner's device — or in my demo, a simulated GPS ticker — emits a `partner_location_tick` event over Socket.IO every second. The server broadcasts that to a room named after the order ID, like `order:123`. Only the customer viewing that specific order has joined that room, so they get the location update in real time without polling the server. On the frontend, I'd feed those coordinates into a Leaflet or Mapbox map to move a pin smoothly."

---

### How to demo this right now (no frontend needed yet)

1. Run the backend: `npm install && npm run dev`
2. Open `tracking-demo.html` directly in your browser (double-click it)
3. Click "Start Simulated Delivery" — you'll see a green dot move across the screen in real time, driven by actual WebSocket events from your backend
4. This IS your live-tracking proof of concept — screenshot or screen-record this for your README/LinkedIn post

Practice explaining these five things out loud once before any interview — most fresher candidates can't explain *why* they made a choice, only *what* they built. That gap is what you're closing here.
