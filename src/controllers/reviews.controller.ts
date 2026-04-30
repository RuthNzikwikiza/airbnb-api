import { Response } from "express";
import prisma from "../config/prisma.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { getCache, setCache, clearCache } from "../config/cache.js";

export async function getListingReviews(req: AuthRequest, res: Response) {
  const listingId = req.params.id;
  const page = parseInt(req.query["page"] as string) || 1;
  const limit = parseInt(req.query["limit"] as string) || 10;
  const skip = (page - 1) * limit;

  const cacheKey = `reviews_listing_${listingId}_${page}_${limit}`;
  const cached = getCache(cacheKey);
  if (cached) return res.status(200).json(cached);

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) {
    res.status(404).json({ error: "Listing not found." });
    return;
  }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { listingId },
      skip,
      take: limit,
      include: { user: { select: { name: true, avatar: true } } },
    }),
    prisma.review.count({ where: { listingId } }),
  ]);

  const result = {
    data: reviews,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };

  setCache(cacheKey, result, 30);
  res.status(200).json(result);
}

export async function createReview(req: AuthRequest, res: Response) {
  const listingId = req.params.id;
  const { rating, comment } = req.body;

  if (!rating || !comment) {
    res.status(400).json({ error: "rating and comment are required." });
    return;
  }

  if (rating < 1 || rating > 5) {
    res.status(400).json({ error: "Rating must be between 1 and 5." });
    return;
  }

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) {
    res.status(404).json({ error: "Listing not found." });
    return;
  }

  const review = await prisma.review.create({
    data: {
      rating,
      comment,
      userId: req.userId!,
      listingId,
    },
  });

  clearCache(`reviews_listing_${listingId}_1_10`);
  res.status(201).json(review);
}

export async function deleteReview(req: AuthRequest, res: Response) {
  const id = req.params.id;

  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) {
    res.status(404).json({ error: "Review not found." });
    return;
  }

  if (review.userId !== req.userId && req.role !== "ADMIN") {
    res.status(403).json({ error: "You can only delete your own reviews." });
    return;
  }

  await prisma.review.delete({ where: { id } });
  res.status(200).json({ message: "Review deleted successfully." });
}