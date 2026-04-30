import { Response } from "express";
import prisma from "../config/prisma.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { getCache, setCache, clearCache } from "../config/cache.js";

export async function getAllListings(req: AuthRequest, res: Response) {
  const cacheKey = "all_listings";
  const cached = getCache(cacheKey);
  if (cached) return res.status(200).json(cached);

  const page = parseInt(req.query["page"] as string) || 1;
  const limit = parseInt(req.query["limit"] as string) || 10;
  const skip = (page - 1) * limit;

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({ skip, take: limit }),
    prisma.listing.count(),
  ]);

  const result = {
    data: listings,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };

  setCache(cacheKey, result, 60);
  res.status(200).json(result);
}

export async function searchListings(req: AuthRequest, res: Response) {
  const page = parseInt(req.query["page"] as string) || 1;
  const limit = parseInt(req.query["limit"] as string) || 10;
  const skip = (page - 1) * limit;

  const { location, type, minPrice, maxPrice, guests } = req.query;

  const where: any = {};
  if (location) where.location = { contains: location as string, mode: "insensitive" };
  if (type) where.type = type as string;
  if (minPrice || maxPrice) {
    where.pricePerNight = {};
    if (minPrice) where.pricePerNight.gte = parseFloat(minPrice as string);
    if (maxPrice) where.pricePerNight.lte = parseFloat(maxPrice as string);
  }
  if (guests) where.guests = { gte: parseInt(guests as string) };

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      skip,
      take: limit,
      include: { host: { select: { name: true, email: true } } },
    }),
    prisma.listing.count({ where }),
  ]);

  res.status(200).json({
    data: listings,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}

export async function getListingById(req: AuthRequest, res: Response) {
  const id = req.params.id;
  const listing = await prisma.listing.findUnique({ where: { id } });

  if (!listing) {
    res.status(404).json({ error: `Listing with id ${id} not found.` });
    return;
  }

  res.status(200).json(listing);
}

export async function createListing(req: AuthRequest, res: Response) {
  const { title, description, location, pricePerNight, guests, type, amenities, rating } = req.body;

  clearCache("all_listings");
  clearCache("listing_stats");

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
  const id = req.params.id;
  const existing = await prisma.listing.findUnique({ where: { id } });

  clearCache("all_listings");
  clearCache("listing_stats");

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
  const id = req.params.id;
  const existing = await prisma.listing.findUnique({ where: { id } });

  clearCache("all_listings");
  clearCache("listing_stats");

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
  const cacheKey = "listing_stats";
  const cached = getCache(cacheKey);
  if (cached) return res.status(200).json(cached);

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

  setCache(cacheKey, stats, 300);
  res.status(200).json(stats);
}