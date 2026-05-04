import { Router } from "express";
import { naturalLanguageSearch } from "../../controllers/ai.controller.js";

const router = Router();

// /**
//  * @swagger
//  * /ai/search:
//  *   post:
//  *     summary: Search listings using natural language
//  *     tags: [AI]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required: [query]
//  *             properties:
//  *               query:
//  *                 type: string
//  *                 example: apartment in Kigali under $100 for 2 guests
//  *     responses:
//  *       200:
//  *         description: Listings matching the natural language query
//  *       400:
//  *         description: Could not extract filters from query
//  */
router.post("/search", naturalLanguageSearch);

export default router;