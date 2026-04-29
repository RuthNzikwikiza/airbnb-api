import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import crypto from "crypto";
import { sendEmail } from "../config/email.js";
import { welcomeEmail, passwordResetEmail } from "../templates/emails.js";

const JWT_SECRET = process.env["JWT_SECRET"] as string;
const JWT_EXPIRES_IN = process.env["JWT_EXPIRES_IN"] as string;

export async function register(req: Request, res: Response) {
  const { name, email, username, phone, password, role } = req.body;

  if (!name || !email || !username || !phone || !password) {
    res.status(400).json({
      error: "Missing required fields: name, email, username, phone, password.",
    });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters." });
    return;
  }

  if (role && role !== "HOST" && role !== "GUEST") {
    res.status(400).json({ error: 'Role must be either "HOST" or "GUEST".' });
    return;
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });

  if (existing) {
    res.status(409).json({ error: "Email or username already taken." });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      username,
      phone,
      password: hashedPassword,
      role: role ?? "GUEST",
    },
  });

  const { password: _, ...userWithoutPassword } = user;

  try {
    await sendEmail(
      email,
      "Welcome to Airbnb!",
      welcomeEmail(name, role ?? "GUEST")
    );
  } catch (error: any) {
    console.error("Welcome email failed:", error.message);
  }

  res.status(201).json(userWithoutPassword);
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    res.status(401).json({ error: "Invalid credentials." });
    return;
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    res.status(401).json({ error: "Invalid credentials." });
    return;
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  const { password: _, ...userWithoutPassword } = user;

  res.status(200).json({ token, user: userWithoutPassword });
}

export async function getMe(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: {
      listings: req.role === "HOST",
      bookings: req.role === "GUEST",
    },
  });

  if (!user) {
    res.status(404).json({ error: "User not found." });
    return;
  }

  const { password: _, ...userWithoutPassword } = user;
  res.status(200).json(userWithoutPassword);
}

export async function changePassword(req: AuthRequest, res: Response) {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400).json({
      error: "Both currentPassword and newPassword are required.",
    });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.userId },
  });

  if (!user) {
    res.status(404).json({ error: "User not found." });
    return;
  }

  const passwordMatch = await bcrypt.compare(currentPassword, user.password);
  if (!passwordMatch) {
    res.status(401).json({ error: "Current password is incorrect." });
    return;
  }

  if (newPassword.length < 8) {
    res.status(400).json({ error: "New password must be at least 8 characters." });
    return;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: req.userId },
    data: { password: hashedPassword },
  });

  res.status(200).json({ message: "Password changed successfully." });
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: "Email is required." });
    return;
  }

  const genericResponse = {
    message: "If that email is registered, a reset link has been sent.",
  };

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    res.status(200).json(genericResponse);
    return;
  }

  const rawToken = crypto.randomBytes(32).toString("hex");

  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: hashedToken,
      resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const resetLink = `${process.env["API_URL"] || "http://localhost:3000"}/auth/reset-password/${rawToken}`;

  try {
    await sendEmail(
      user.email,
      "Password Reset Request",
      passwordResetEmail(user.name, resetLink)
    );
  } catch (error: any) {
    console.error("Password reset email failed:", error.message);
  }

  res.status(200).json(genericResponse);
}

export async function resetPassword(req: Request, res: Response) {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) {
    res.status(400).json({ error: "newPassword is required." });
    return;
  }

  if (newPassword.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters." });
    return;
  }

  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await prisma.user.findFirst({
    where: {
      resetToken: hashedToken,
      resetTokenExpiry: { gt: new Date() },
    },
  });

  if (!user) {
    res.status(400).json({ error: "Invalid or expired reset token." });
    return;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  res.status(200).json({ message: "Password reset successfully. You can now log in." });
}