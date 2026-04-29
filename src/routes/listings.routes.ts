import { Router } from "express";
import {
  getAllListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  getListingStats,
} from "../controllers/listings.controller.js";
import {
  authenticate,
  requireHost,
} from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Listing:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         title:
 *           type: string
 *           example: Cozy Apartment in Kigali
 *         description:
 *           type: string
 *           example: A bright modern apartment in the city center
 *         location:
 *           type: string
 *           example: Kigali, Rwanda
 *         pricePerNight:
 *           type: number
 *           example: 75
 *         guests:
 *           type: integer
 *           example: 2
 *         type:
 *           type: string
 *           enum: [apartment, house, villa, cabin]
 *           example: apartment
 *         amenities:
 *           type: array
 *           items:
 *             type: string
 *           example: [WiFi, Kitchen, TV]
 *         rating:
 *           type: number
 *           nullable: true
 *           example: 4.8
 *         hostId:
 *           type: integer
 *           example: 1
 *
 *     CreateListingInput:
 *       type: object
 *       required: [title, description, location, pricePerNight, guests, type, amenities]
 *       properties:
 *         title:
 *           type: string
 *           example: Cozy Apartment in Kigali
 *         description:
 *           type: string
 *           example: A bright modern apartment in the city center
 *         location:
 *           type: string
 *           example: Kigali, Rwanda
 *         pricePerNight:
 *           type: number
 *           example: 75
 *         guests:
 *           type: integer
 *           example: 2
 *         type:
 *           type: string
 *           enum: [apartment, house, villa, cabin]
 *           example: apartment
 *         amenities:
 *           type: array
 *           items:
 *             type: string
 *           example: [WiFi, Kitchen, TV]
 *         rating:
 *           type: number
 *           nullable: true
 *           example: 4.8
 */

/**
 * @swagger
 * /listings/stats:
 *   get:
 *     summary: Get listing statistics grouped by location
 *     tags: [Listings]
 *     responses:
 *       200:
 *         description: Stats per location
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   location:
 *                     type: string
 *                     example: Kigali, Rwanda
 *                   total:
 *                     type: integer
 *                     example: 2
 *                   avg_price:
 *                     type: number
 *                     example: 112.50
 *                   min_price:
 *                     type: number
 *                     example: 75
 *                   max_price:
 *                     type: number
 *                     example: 150
 */
router.get("/stats", getListingStats);

/**
 * @swagger
 * /listings:
 *   get:
 *     summary: Get all listings
 *     tags: [Listings]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [apartment, house, villa, cabin]
 *         description: Filter by type
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price per night
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price per night
 *       - in: query
 *         name: guests
 *         schema:
 *           type: integer
 *         description: Minimum number of guests
 *     responses:
 *       200:
 *         description: List of listings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Listing'
 */
router.get("/", getAllListings);

/**
 * @swagger
 * /listings/{id}:
 *   get:
 *     summary: Get a listing by ID
 *     tags: [Listings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The listing ID
 *     responses:
 *       200:
 *         description: Listing found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Listing'
 *       404:
 *         description: Listing not found
 */
router.get("/:id", getListingById);

/**
 * @swagger
 * /listings:
 *   post:
 *     summary: Create a new listing
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateListingInput'
 *     responses:
 *       201:
 *         description: Listing created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Listing'
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only hosts can create listings
 */
router.post("/", authenticate, requireHost, createListing);

/**
 * @swagger
 * /listings/{id}:
 *   put:
 *     summary: Update a listing
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateListingInput'
 *     responses:
 *       200:
 *         description: Listing updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: You can only edit your own listings
 *       404:
 *         description: Listing not found
 */
router.put("/:id", authenticate, updateListing);

/**
 * @swagger
 * /listings/{id}:
 *   delete:
 *     summary: Delete a listing
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Listing deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: You can only delete your own listings
 *       404:
 *         description: Listing not found
 */
router.delete("/:id", authenticate, deleteListing);

export default router;