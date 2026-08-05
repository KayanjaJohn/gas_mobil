import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';

interface DecodedToken {
  userId: string;
  email: string;
  name: string;
  role: string;
}

let io: SocketServer;

export const initializeSocket = (server: HttpServer) => {
  io = new SocketServer(server, {
    cors: {
      origin: (origin, callback) => {
        const allowedOrigins = process.env.NODE_ENV === 'production'
          ? (process.env.ALLOWED_ORIGINS?.split(',') || [])
          : ['http://localhost:8081', 'http://localhost:19006', 'http://localhost:3000'];
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) throw new Error('JWT_SECRET not configured');
      const decoded = jwt.verify(token as string, jwtSecret) as DecodedToken;
      socket.data.userId = decoded.userId;
      socket.data.userRole = decoded.role;
      socket.data.userName = decoded.name;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { userId, userRole, userName } = socket.data;
    console.log(`[Socket] ${userName} (${userRole}) connected: ${socket.id}`);

    socket.join(`user_${userId}`);

    if (userRole === 'driver') {
      socket.join('drivers');
      socket.join(`driver_${userId}`);
    }

    // CRITICAL FIX: Both admin AND agent join admins room for system-wide notifications
    if (['admin', 'agent'].includes(userRole)) {
      socket.join('admins');
    }

    socket.on('join_station', (stationId: string) => {
      socket.join(`station_${stationId}`);
      console.log(`[Socket] ${userName} joined station room: ${stationId}`);
    });

    socket.on('leave_station', (stationId: string) => {
      socket.leave(`station_${stationId}`);
      console.log(`[Socket] ${userName} left station room: ${stationId}`);
    });

    socket.on('join_order', (orderId: string) => {
      socket.join(`order_${orderId}`);
      console.log(`[Socket] ${userName} joined order room: ${orderId}`);
    });

    socket.on('leave_order', (orderId: string) => {
      socket.leave(`order_${orderId}`);
      console.log(`[Socket] ${userName} left order room: ${orderId}`);
    });

    socket.on('driver_location_update', (data: {
      orderId: string; latitude: number; longitude: number;
      accuracy?: number; speed?: number; heading?: number;
    }) => {
      if (userRole !== 'driver') {
        socket.emit('error', { message: 'Only drivers can update location' });
        return;
      }
      const locationData = {
        ...data, driverId: userId, driverName: userName,
        timestamp: new Date().toISOString(),
      };
      io.to(`order_${data.orderId}`).emit('location_update', locationData);
      io.to(`driver_${userId}`).emit('location_confirmed', {
        orderId: data.orderId, received: true,
      });
    });

    socket.on('driver_status_change', (data: {
      status: 'online' | 'offline' | 'busy' | 'on_break';
    }) => {
      if (userRole !== 'driver') return;
      io.to('admins').emit('driver_status_changed', {
        driverId: userId, driverName: userName,
        status: data.status, timestamp: new Date().toISOString(),
      });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] ${userName} disconnected: ${socket.id}`);
      if (userRole === 'driver') {
        io.to('admins').emit('driver_offline', {
          driverId: userId, driverName: userName,
          timestamp: new Date().toISOString(),
        });
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

export const broadcastToOrder = (orderId: string, event: string, data: any) => {
  if (!io) return;
  io.to(`order_${orderId}`).emit(event, data);
};

export const broadcastToUser = (userId: string, event: string, data: any) => {
  if (!io) return;
  io.to(`user_${userId}`).emit(event, data);
};

export const broadcastToAdmins = (event: string, data: any) => {
  if (!io) return;
  io.to('admins').emit(event, data);
};

export const broadcastToDrivers = (event: string, data: any) => {
  if (!io) return;
  io.to('drivers').emit(event, data);
};

export const broadcastToStation = (stationId: string, event: string, data: any) => {
  if (!io) return;
  io.to(`station_${stationId}`).emit(event, data);
};