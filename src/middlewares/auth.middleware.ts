import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env["JWT_SECRET"] as string;

export interface AuthRequest extends Request {
  userId?: number;
  role?: string;
}

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "No token provided." });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      role: string;
    };

    req.userId = decoded.userId;
    req.role = decoded.role;

    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token." });
  }
}
export function requireHost(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (req.role !== "HOST" && req.role !== "ADMIN") {
    res.status(403).json({ error: "Access denied. Hosts only." });
    return;
  }
  next();
}

export function requireGuest(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (req.role !== "GUEST" && req.role !== "ADMIN") {
    res.status(403).json({ error: "Access denied. Guests only." });
    return;
  }
  next();
}

export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (req.role !== "ADMIN") {
    res.status(403).json({ error: "Access denied. Admins only." });
    return;
  }
  next();
}