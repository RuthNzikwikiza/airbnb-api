import { Response } from "express";
import prisma from "../config/prisma.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";

export async function getAllListings(req: AuthRequest, res: Response) {
  const listings = await prisma.listing.findMany();
  res.status(200).json(listings);
}

export async function getListingById(req: AuthRequest, res: Response) {
  const id = parseInt(req.params.id);
  const listing = await prisma.listing.findUnique({ where: { id } });

  if (!listing) {
    res.status(404).json({ error: `Listing with id ${id} not found.` });
    return;
  }

  res.status(200).json(listing);
}

export async function createListing(req: AuthRequest, res: Response) {
  const { title, description, location, pricePerNight, guests, type, amenities, rating } = req.body;

  if (!title || !description || !location || pricePerNight === undefined || guests === undefined || !type || !amenities) {
    res.status(400).json({
      error: "Missing required fields: title, description, location, pricePerNight, guests, type, amenities.",
    });
    return;
  }

  const validTypes = ["apartment", "house", "villa", "cabin"];
  if (!validTypes.includes(type)) {
    res.status(400).json({ error: `Type must be one of: ${validTypes.join(", ")}.` });
    return;
  }

  if (!Array.isArray(amenities)) {
    res.status(400).json({ error: "amenities must be an array of strings." });
    return;
  }

  try {
    const newListing = await prisma.listing.create({
      data: {
        title,
        description,
        location,
        pricePerNight,
        guests,
        type,
        amenities,
        rating,
        hostId: req.userId!, 
      },
    });
    res.status(201).json(newListing);
  } catch (error: any) {
    res.status(500).json({ error: "Something went wrong." });
  }
}

export async function updateListing(req: AuthRequest, res: Response) {
  const id = parseInt(req.params.id);
  const existing = await prisma.listing.findUnique({ where: { id } });

  if (!existing) {
    res.status(404).json({ error: `Listing with id ${id} not found.` });
    return;
  }

  if (existing.hostId !== req.userId && req.role !== "ADMIN") {
    res.status(403).json({ error: "You can only edit your own listings." });
    return;
  }

  const updated = await prisma.listing.update({
    where: { id },
    data: req.body,
  });

  res.status(200).json(updated);
}

export async function deleteListing(req: AuthRequest, res: Response) {
  const id = parseInt(req.params.id);
  const existing = await prisma.listing.findUnique({ where: { id } });

  if (!existing) {
    res.status(404).json({ error: `Listing with id ${id} not found.` });
    return;
  }
  if (existing.hostId !== req.userId && req.role !== "ADMIN") {
    res.status(403).json({ error: "You can only delete your own listings." });
    return;
  }

  await prisma.listing.delete({ where: { id } });
  res.status(200).json({ message: `Listing "${existing.title}" deleted successfully.` });
}

export async function getListingStats(req: AuthRequest, res: Response) {
  const stats = await prisma.$queryRaw`
    SELECT
      location,
      COUNT(*)::int AS total,
      ROUND(AVG("pricePerNight")::numeric, 2) AS avg_price,
      MIN("pricePerNight") AS min_price,
      MAX("pricePerNight") AS max_price
    FROM "Listing"
    GROUP BY location
    ORDER BY total DESC
  `;

  res.status(200).json(stats);
}