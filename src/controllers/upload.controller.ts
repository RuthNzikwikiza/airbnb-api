import { Response } from "express";
import prisma from "../config/prisma.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";

export async function uploadAvatar(req: AuthRequest, res: Response) {
  const id = req.params.id;

  if (req.userId !== id) {
    res.status(403).json({ error: "You can only change your own avatar." });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: "No file uploaded." });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    res.status(404).json({ error: "User not found." });
    return;
  }

  if (user.avatarPublicId) {
    await deleteFromCloudinary(user.avatarPublicId);
  }

  const { url, publicId } = await uploadToCloudinary(
    req.file.buffer,
    "airbnb/avatars"
  );

  const updated = await prisma.user.update({
    where: { id },
    data: { avatar: url, avatarPublicId: publicId },
  });

  const { password: _, ...userWithoutPassword } = updated;
  res.status(200).json({ message: "Avatar uploaded successfully.", user: userWithoutPassword });
}

export async function deleteAvatar(req: AuthRequest, res: Response) {
  const id = req.params.id;

  if (req.userId !== id) {
    res.status(403).json({ error: "You can only delete your own avatar." });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    res.status(404).json({ error: "User not found." });
    return;
  }

  if (!user.avatar) {
    res.status(400).json({ error: "No avatar to remove." });
    return;
  }

  if (user.avatarPublicId) {
    await deleteFromCloudinary(user.avatarPublicId);
  }

  await prisma.user.update({
    where: { id },
    data: { avatar: null, avatarPublicId: null },
  });

  res.status(200).json({ message: "Avatar removed successfully." });
}

export async function uploadListingPhotos(req: AuthRequest, res: Response) {
  const id = req.params.id;

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { photos: true },
  });

  if (!listing) {
    res.status(404).json({ error: "Listing not found." });
    return;
  }

  if (listing.hostId !== req.userId) {
    res.status(403).json({ error: "You can only upload photos to your own listings." });
    return;
  }

  if (listing.photos.length >= 5) {
    res.status(400).json({ error: "Maximum of 5 photos allowed per listing." });
    return;
  }

  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    res.status(400).json({ error: "No files uploaded." });
    return;
  }

  const remainingSlots = 5 - listing.photos.length;
  const filesToProcess = files.slice(0, remainingSlots);

  const uploadedPhotos = await Promise.all(
    filesToProcess.map(async (file) => {
      const { url, publicId } = await uploadToCloudinary(
        file.buffer,
        "airbnb/listings"
      );
      return prisma.listingPhoto.create({
        data: { url, publicId, listingId: id },
      });
    })
  );

  res.status(201).json({
    message: `${uploadedPhotos.length} photo(s) uploaded successfully.`,
    photos: uploadedPhotos,
  });
}

export async function deleteListingPhoto(req: AuthRequest, res: Response) {
  const id = req.params.id;
  const photoId = req.params.photoId;

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) {
    res.status(404).json({ error: "Listing not found." });
    return;
  }

  if (listing.hostId !== req.userId) {
    res.status(403).json({ error: "You can only delete photos from your own listings." });
    return;
  }

  const photo = await prisma.listingPhoto.findUnique({ where: { id: photoId } });
  if (!photo) {
    res.status(404).json({ error: "Photo not found." });
    return;
  }

  if (photo.listingId !== id) {
    res.status(403).json({ error: "Photo does not belong to this listing." });
    return;
  }

  await deleteFromCloudinary(photo.publicId);
  await prisma.listingPhoto.delete({ where: { id: photoId } });

  res.status(200).json({ message: "Photo deleted successfully." });
}