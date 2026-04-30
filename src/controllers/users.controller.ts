import { Request, Response } from "express";
import prisma from "../config/prisma.js";
import { getCache, setCache } from "../config/cache.js";
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query["page"] as string) || 1;
  const limit = parseInt(req.query["limit"] as string) || 10;
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({ skip, take: limit }),
    prisma.user.count(),
  ]);

  res.status(200).json({
    data: users,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
};

export async function getUserById(req: Request, res: Response) {
const id = req.params.id;
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    res.status(404).json({ error: `User with id ${id} not found.` });
    return;
  }

  res.status(200).json(user);
}

import bcrypt from "bcrypt";
export const createUser = async (req: Request, res: Response): Promise<void> => {
  const { name, email, username, phone, role, avatar, bio } = req.body;

  if (!name || !email || !username || !phone || !role) {
    res.status(400).json({
      error: "Missing required fields: name, email, username, phone, role.",
    });
    return;
  }

  if (role !== "host" && role !== "guest" && role !== "HOST" && role !== "GUEST") {
    res.status(400).json({ error: 'Role must be either "HOST" or "GUEST".' });
    return;
  }

  try {
    const hashedPassword = await bcrypt.hash("changeme123", 10);
    
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        username,
        phone,
        role,
        avatar,
        bio,
        password: hashedPassword,
      },
    });

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error: any) {
    if (error.code === "P2002") {
      res.status(400).json({ error: "Email or username already exists." });
      return;
    }
    res.status(500).json({ error: "Something went wrong." });
  }
};

export async function updateUser(req: Request, res: Response) {
  const id = req.params.id;
  const existing = await prisma.user.findUnique({ where: { id } });

  if (!existing) {
    res.status(404).json({ error: `User with id ${id} not found.` });
    return;
  }

  const updated = await prisma.user.update({
    where: { id },
    data: req.body,
  });

  res.status(200).json(updated);
}

export async function deleteUser(req: Request, res: Response) {
const id = req.params.id;
  const existing = await prisma.user.findUnique({ where: { id } });

  if (!existing) {
    res.status(404).json({ error: `User with id ${id} not found.` });
    return;
  }

  await prisma.user.delete({ where: { id } });
  res.status(200).json({ message: `User "${existing.name}" deleted successfully.` });
}
export const getUserStats = async (req: Request, res: Response): Promise<void> => {
  const cacheKey = "user_stats";
  const cached = getCache(cacheKey);
  if (cached) {
    res.status(200).json(cached);
    return;
  }

  const [totalUsers, byRole] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({
      by: ["role"],
      _count: { role: true },
    }),
  ]);

  const result = { totalUsers, byRole };
  setCache(cacheKey, result, 300); 
  res.status(200).json(result);
};