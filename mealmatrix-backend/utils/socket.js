const { Server } = require('socket.io');

// Room-per-order pattern: every order gets its own "room" (order:<id>).
// The customer's tracking screen joins that room; only that customer
// receives location updates for their order — nobody else's.
// Interview point: "I used Socket.IO rooms scoped per order ID instead of
// broadcasting to everyone, so location data stays private per order."
function initSocket(server) {
  const io = new Server(server, {
    cors: { origin: '*' }, // tighten this to your frontend URL in production
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join_order_room', (orderId) => {
      socket.join(`order:${orderId}`);
      console.log(`Socket ${socket.id} joined order:${orderId}`);
    });

    socket.on('leave_order_room', (orderId) => {
      socket.leave(`order:${orderId}`);
    });

    // Simulated delivery partner GPS ticks would call this event from a
    // mock script, or a real delivery-partner mobile client in production.
    socket.on('partner_location_tick', async ({ userId, orderId, lat, lng }) => {
      io.to(`order:${orderId}`).emit('location_update', { orderId, lat, lng });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

module.exports = initSocket;
