import { Request, Response } from "express";
import prisma from "../config/prisma.js";

export async function getAllUsers(req: Request, res: Response) {
  const users = await prisma.user.findMany();
  res.status(200).json(users);
}

export async function getUserById(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    res.status(404).json({ error: `User with id ${id} not found.` });
    return;
  }

  res.status(200).json(user);
}

export async function createUser(req: Request, res: Response) {
  const { name, email, username, phone, role, avatar, bio } = req.body;

  if (!name || !email || !username || !phone || !role) {
    res.status(400).json({
      error: "Missing required fields: name, email, username, phone, role.",
    });
    return;
  }

  if (role !== "host" && role !== "guest") {
    res.status(400).json({ error: 'Role must be either "host" or "guest".' });
    return;
  }

  try {
    const newUser = await prisma.user.create({
      data: { name, email, username, phone, role, avatar, bio },
    });
    res.status(201).json(newUser);
  } catch (error: any) {
    if (error.code === "P2002") {
      res.status(400).json({ error: "Email or username already exists." });
      return;
    }
    res.status(500).json({ error: "Something went wrong." });
  }
}

export async function updateUser(req: Request, res: Response) {
  const id = parseInt(req.params.id);
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
  const id = parseInt(req.params.id);
  const existing = await prisma.user.findUnique({ where: { id } });

  if (!existing) {
    res.status(404).json({ error: `User with id ${id} not found.` });
    return;
  }

  await prisma.user.delete({ where: { id } });
  res.status(200).json({ message: `User "${existing.name}" deleted successfully.` });
}