import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

export const socketAuthMiddleware = (io: Server) => {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      (socket as any).user = decoded;

      // Join role-based rooms
      socket.join(`user_${decoded.id}`);
      socket.join(`role_${decoded.role}`);

      if (decoded.role === 'driver') {
        socket.join('drivers');
        socket.join(`driver_${decoded.id}`);
      }
      if (decoded.role === 'admin') {
        socket.join('admins');
      }
      if (decoded.role === 'agent') {
        socket.join(`station_${decoded.stationId}`);
      }

      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });
};

export const setupSocketEvents = (io: Server) => {
  io.on('connection', (socket) => {
    const user = (socket as any).user;
    console.log(`User connected: ${user.id} (${user.role})`);

    // Driver location updates
    socket.on('driver_location_update', (data) => {
      if (user.role !== 'driver') return;

      // Broadcast to customers tracking this order
      io.to(`order_${data.orderId}`).emit('location_update', {
        driverId: user.id,
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        speed: data.speed,
        heading: data.heading
      });
    });

    // Driver status changes
    socket.on('driver_status_change', (data) => {
      if (user.role !== 'driver') return;

      io.to('admins').emit('driver_status_change', {
        driverId: user.id,
        status: data.status
      });
    });

    // Customer joins order tracking room
    socket.on('join_order_tracking', (orderId: string) => {
      socket.join(`order_${orderId}`);
    });

    socket.on('leave_order_tracking', (orderId: string) => {
      socket.leave(`order_${orderId}`);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${user.id}`);
    });
  });
};
