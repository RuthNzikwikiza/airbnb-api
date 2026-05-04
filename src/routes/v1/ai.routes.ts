import { Router } from "express";
import {
  naturalLanguageSearch,
  generateDescription,
  chat,
  getRecommendations,
  getReviewSummary,
} from "../../controllers/ai.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * /ai/search:
 *   post:
 *     summary: Search listings using natural language
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [query]
 *             properties:
 *               query:
 *                 type: string
 *                 example: apartment in Kigali under $100 for 2 guests
 *     responses:
 *       200:
 *         description: Listings matching the natural language query
 *       400:
 *         description: Could not extract filters from query
 */
router.post("/search", naturalLanguageSearch);

/**
 * @swagger
 * /ai/listings/{id}/generate-description:
 *   post:
 *     summary: Generate a listing description using AI
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tone:
 *                 type: string
 *                 enum: [professional, casual, luxury]
 *                 example: luxury
 *     responses:
 *       200:
 *         description: Generated description and updated listing
 *       403:
 *         description: Not your listing
 *       404:
 *         description: Listing not found
 */
router.post("/listings/:id/generate-description", authenticate, generateDescription);

/**
 * @swagger
 * /ai/chat:
 *   post:
 *     summary: Chat with the Airbnb AI assistant
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message, sessionId]
 *             properties:
 *               message:
 *                 type: string
 *                 example: Does this place have WiFi?
 *               sessionId:
 *                 type: string
 *                 example: user-123-session-1
 *               listingId:
 *                 type: string
 *                 example: a3f8c2d1-4b5e-4f6a-8c9d-1e2f3a4b5c6d
 *     responses:
 *       200:
 *         description: AI response
 */
router.post("/chat", chat);

/**
 * @swagger
 * /ai/recommend:
 *   post:
 *     summary: Get AI listing recommendations based on booking history
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recommended listings
 *       400:
 *         description: No booking history found
 */
router.post("/recommend", authenticate, getRecommendations);

/**
 * @swagger
 * /ai/listings/{id}/review-summary:
 *   get:
 *     summary: Get an AI summary of all reviews for a listing
 *     tags: [AI]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: AI review summary
 *       400:
 *         description: Not enough reviews
 *       404:
 *         description: Listing not found
 */
router.get("/listings/:id/review-summary", getReviewSummary);

export default router;