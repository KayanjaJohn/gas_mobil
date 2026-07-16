import { Request, Response, NextFunction } from 'express';

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

// Convenience middlewares
export const requireAdmin = requireRole('admin');
export const requireAgent = requireRole('admin', 'agent');
export const requireDriver = requireRole('driver');
export const requireCustomer = requireRole('customer');
export const requireAuth = requireRole('admin', 'agent', 'driver', 'customer');
