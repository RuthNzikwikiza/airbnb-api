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