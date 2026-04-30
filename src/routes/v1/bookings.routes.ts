import { Router } from "express";
import {
  createBooking,
  cancelBooking,
  getMyBookings,
} from "../../controllers/bookings.controller.js";
import {
  authenticate,
  requireGuest,
} from "../../middlewares/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Booking:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: a3f8c2d1-4b5e-4f6a-8c9d-1e2f3a4b5c6d
 *         listingId:
 *           type: string
 *         guestId:
 *           type: string
 *         checkIn:
 *           type: string
 *           format: date-time
 *           example: 2026-08-01T00:00:00.000Z
 *         checkOut:
 *           type: string
 *           format: date-time
 *           example: 2026-08-05T00:00:00.000Z
 *         totalPrice:
 *           type: number
 *           example: 300
 *         status:
 *           type: string
 *           enum: [PENDING, CONFIRMED, CANCELLED]
 *           example: PENDING
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     CreateBookingInput:
 *       type: object
 *       required: [listingId, checkIn, checkOut]
 *       properties:
 *         listingId:
 *           type: string
 *           example: a3f8c2d1-4b5e-4f6a-8c9d-1e2f3a4b5c6d
 *         checkIn:
 *           type: string
 *           format: date
 *           example: "2026-08-01"
 *         checkOut:
 *           type: string
 *           format: date
 *           example: "2026-08-05"
 */

/**
 * @swagger
 * /bookings:
 *   get:
 *     summary: Get my bookings
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bookings for logged in user
 *       401:
 *         description: Unauthorized
 */
router.get("/", authenticate, getMyBookings);

/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBookingInput'
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       400:
 *         description: Missing fields or invalid dates
 *       403:
 *         description: Only guests can make bookings
 *       409:
 *         description: Listing already booked for these dates
 */
router.post("/", authenticate, requireGuest, createBooking);

/**
 * @swagger
 * /bookings/{id}:
 *   delete:
 *     summary: Cancel a booking
 *     tags: [Bookings]
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
 *         description: Booking cancelled successfully
 *       404:
 *         description: Booking not found
 */
router.delete("/:id", authenticate, cancelBooking);

export default router;