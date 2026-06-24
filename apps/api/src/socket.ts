import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const initializeSocket = (io: Server) => {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('No token'));

      const decoded = jwt.verify(token, JWT_SECRET) as any;
      socket.data.user = decoded;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;
    console.log(`User connected: ${user.id} (${user.role})`);

    // Join role-based rooms
    socket.join(`user_${user.id}`);
    socket.join(`${user.role}s`);

    if (user.role === 'driver') {
      socket.join(`driver_${user.id}`);
      socket.join('drivers');

      // Update driver status to online
      socket.on('driver_status_change', (data) => {
        socket.broadcast.emit('driver_status_update', {
          driverId: user.id,
          status: data.status
        });
      });

      // Handle location updates
      socket.on('driver_location_update', (data) => {
        socket.to(`order_${data.orderId}`).emit('location_update', {
          driverId: user.id,
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: data.accuracy,
          speed: data.speed
        });
      });
    }

    if (user.role === 'customer') {
      socket.on('join_order', (orderId) => {
        socket.join(`order_${orderId}`);
      });

      socket.on('leave_order', (orderId) => {
        socket.leave(`order_${orderId}`);
      });
    }

    if (user.role === 'agent' || user.role === 'admin') {
      socket.join('admins');
    }

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${user.id}`);
      if (user.role === 'driver') {
        socket.broadcast.emit('driver_status_update', {
          driverId: user.id,
          status: 'offline'
        });
      }
    });
  });
};
