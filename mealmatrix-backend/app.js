require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/db');
const orderRoutes = require('./routes/orderRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const groupOrderRoutes = require('./routes/groupOrderRoutes');
const { errorHandler } = require('./middlewares/errorHandler');
const initSocket = require('./utils/socket');

const app = express();
const server = http.createServer(app); // wrap express in a raw HTTP server
const io = initSocket(server); // attach Socket.IO to that same server

// Make io available inside controllers via req.app.get('io')
app.set('io', io);

connectDB();

app.use(cors()); // allows the React frontend (different port) to call this API
app.use(express.json());

// Simple health check — this is what a deployment platform (Render/Railway)
// or a monitoring tool pings to know your service is alive.
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/orders', orderRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/group-orders', groupOrderRoutes);

// Must be LAST — Express only treats a 4-arg function as error middleware.
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
// IMPORTANT: listen on `server`, not `app` — this is what makes both
// regular HTTP routes and WebSocket connections work on the same port.
server.listen(PORT, () => console.log(`MealMatrix backend running on port ${PORT}`));

module.exports = app;
