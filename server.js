import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { registerSockets } from './sockets/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

import userRoutes from './routes/users.js';
import tripRoutes from './routes/trips.js';
import itemRoutes from './routes/items.js';
import chatRoutes from './routes/chat.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

app.use(express.json());

// Make io available to route handlers via req.app.get('io')
app.set('io', io);

// Routes
app.use('/api/users',  userRoutes);
app.use('/api/trips',  tripRoutes);
app.use('/api/items',  itemRoutes);
app.use('/api/chat',   chatRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Serve built Vue frontend
app.use(express.static(join(__dirname, 'public')));
app.get('/{*path}', (req, res) => res.sendFile(join(__dirname, 'public', 'index.html')));

// Socket.io
registerSockets(io);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Grocery App server running on port ${PORT}`);
});
