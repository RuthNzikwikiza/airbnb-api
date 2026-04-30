import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
} from "../../controllers/users.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * /users/stats:
 *   get:
 *     summary: Get user statistics
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: User stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: integer
 *                   example: 5
 *                 byRole:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get("/stats", getUserStats);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     description: Returns a paginated list of all registered users. Requires authentication.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 meta:
 *                   type: object
 *       401:
 *         description: No token provided or token is invalid
 */
router.get("/", authenticate, getAllUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:id", authenticate, getUserById);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserInput'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Missing required fields
 */
router.post("/", createUser);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user
 *     tags: [Users]
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
 *             $ref: '#/components/schemas/UpdateUserInput'
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */
router.put("/:id", authenticate, updateUser);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Users]
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
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/:id", authenticate, deleteUser);

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: Alice
 *         email:
 *           type: string
 *           example: alice@gmail.com
 *         username:
 *           type: string
 *           example: alice123
 *         avatar:
 *           type: string
 *           nullable: true
 *           example: https://res.cloudinary.com/demo/image/upload/sample.jpg
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2024-01-15T10:30:00.000Z
 *
 *     CreateUserInput:
 *       type: object
 *       required: [name, email, username]
 *       properties:
 *         name:
 *           type: string
 *           example: Alice
 *         email:
 *           type: string
 *           example: alice@gmail.com
 *         username:
 *           type: string
 *           example: alice123
 *
 *     UpdateUserInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         username:
 *           type: string
 *
 *     RegisterInput:
 *       type: object
 *       required: [name, email, username, password]
 *       properties:
 *         name:
 *           type: string
 *           example: Alice
 *         email:
 *           type: string
 *           example: alice@gmail.com
 *         username:
 *           type: string
 *           example: alice123
 *         password:
 *           type: string
 *           example: secret123
 *
 *     LoginInput:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email:
 *           type: string
 *           example: alice@gmail.com
 *         password:
 *           type: string
 *           example: secret123
 *
 *     AuthResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiJ9...
 *         user:
 *           $ref: '#/components/schemas/User'
 */

export default router;