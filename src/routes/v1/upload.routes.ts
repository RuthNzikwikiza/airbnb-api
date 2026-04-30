import { Router } from "express";
import upload from "../../config/multer.js";
import {
  uploadAvatar,
  deleteAvatar,
  uploadListingPhotos,
  deleteListingPhoto,
} from "../../controllers/upload.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

export const userUploadRouter = Router();
userUploadRouter.post("/:id/avatar", authenticate, upload.single("image"), uploadAvatar);
userUploadRouter.delete("/:id/avatar", authenticate, deleteAvatar);

export const listingUploadRouter = Router();
listingUploadRouter.post("/:id/photos", authenticate, upload.array("photos", 5), uploadListingPhotos);
listingUploadRouter.delete("/:id/photos/:photoId", authenticate, deleteListingPhoto);

export default router;