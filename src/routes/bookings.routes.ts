import { Router } from "express";
import {
  createBooking,
  cancelBooking,
  getMyBookings,
} from "../controllers/bookings.controller.js";
import {
  authenticate,
  requireGuest,
} from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Booking:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         listingId:
 *           type: integer
 *           example: 1
 *         guestId:
 *           type: integer
 *           example: 2
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
 *           example: 2026-04-27T22:26:19.790Z
 *
 *     CreateBookingInput:
 *       type: object
 *       required: [listingId, checkIn, checkOut]
 *       properties:
 *         listingId:
 *           type: integer
 *           example: 1
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
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
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
 *     description: Only guests can create bookings. Total price is calculated automatically.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBookingInput'
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Missing fields or invalid dates
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only guests can make bookings
 *       404:
 *         description: Listing not found
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
 *           type: integer
 *         description: The booking ID
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *       400:
 *         description: Booking already cancelled
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: You can only cancel your own bookings
 *       404:
 *         description: Booking not found
 */
router.delete("/:id", authenticate, cancelBooking);

export default router;