import { Router } from "express";
import {
  getListingReviews,
  createReview,
  deleteReview,
} from "../../controllers/reviews.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router({ mergeParams: true });

router.get("/", getListingReviews);
router.post("/", authenticate, createReview);
router.delete("/:reviewId", authenticate, deleteReview);

export default router;
/**
 * @swagger
 * /listings/{id}/reviews:
 *   get:
 *     summary: Get all reviews for a listing
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated list of reviews
 *   post:
 *     summary: Add a review to a listing
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rating, comment]
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               comment:
 *                 type: string
 *                 example: Amazing place!
 *     responses:
 *       201:
 *         description: Review created
 *       400:
 *         description: Invalid rating
 *
 * /reviews/{id}:
 *   delete:
 *     summary: Delete a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review deleted
 *       403:
 *         description: You can only delete your own reviews
 */