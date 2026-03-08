export function registerSockets(io) {
  io.on('connection', (socket) => {
    // Client joins the room for the active trip
    socket.on('join-trip', (tripId) => {
      socket.join(`trip-${tripId}`);
    });

    socket.on('leave-trip', (tripId) => {
      socket.leave(`trip-${tripId}`);
    });
  });
}

// Broadcast a new item to all clients on a trip
export function emitItemAdded(io, tripId, item) {
  io.to(`trip-${tripId}`).emit('item-added', item);
}

// Broadcast a check toggle
export function emitItemChecked(io, tripId, item) {
  io.to(`trip-${tripId}`).emit('item-checked', item);
}

// Broadcast an item deletion
export function emitItemDeleted(io, tripId, itemId) {
  io.to(`trip-${tripId}`).emit('item-deleted', { id: itemId });
}

// Broadcast a chat message
export function emitChatMessage(io, tripId, message) {
  io.to(`trip-${tripId}`).emit('chat-message', message);
}

// Broadcast trip completion
export function emitTripCompleted(io, tripId) {
  io.to(`trip-${tripId}`).emit('trip-completed', { trip_id: tripId });
}
