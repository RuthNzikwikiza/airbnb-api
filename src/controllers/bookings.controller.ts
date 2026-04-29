import { Response } from "express";
import prisma from "../config/prisma.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { sendEmail } from "../config/email.js";
import { bookingConfirmationEmail, bookingCancellationEmail } from "../templates/emails.js";
export async function createBooking(req: AuthRequest, res: Response) {
  const { listingId, checkIn, checkOut } = req.body;

  if (!listingId || !checkIn || !checkOut) {
    res.status(400).json({
      error: "Missing required fields: listingId, checkIn, checkOut.",
    });
    return;
  }

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  if (checkInDate >= checkOutDate) {
    res.status(400).json({ error: "checkIn must be before checkOut." });
    return;
  }

  if (checkInDate <= new Date()) {
    res.status(400).json({ error: "checkIn must be in the future." });
    return;
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
  });

  if (!listing) {
    res.status(404).json({ error: "Listing not found." });
    return;
  }

  const days = Math.ceil(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const totalPrice = days * listing.pricePerNight;

  try {
    const booking = await prisma.$transaction(async (tx: any) => {
      const conflict = await tx.booking.findFirst({
        where: {
          listingId,
          status: "CONFIRMED",
          AND: [
            { checkIn: { lt: checkOutDate } },
            { checkOut: { gt: checkInDate } },
          ],
        },
      });

      if (conflict) {
        throw new Error("BOOKING_CONFLICT");
      }

      return tx.booking.create({
        data: {
          listingId,
          guestId: req.userId!,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          totalPrice,
          status: "PENDING",
        },
      });
    });

    // Send email outside the transaction
    try {
      const guest = await prisma.user.findUnique({ where: { id: req.userId } });
      if (guest) {
        await sendEmail(
          guest.email,
          "Booking Confirmed!",
          bookingConfirmationEmail(
            guest.name,
            listing.title,
            listing.location,
            checkInDate.toDateString(),
            checkOutDate.toDateString(),
            totalPrice
          )
        );
      }
    } catch (emailError) {
      console.error("Booking confirmation email failed:", emailError);
    }

    res.status(201).json(booking);

  } catch (error: any) {
    if (error.message === "BOOKING_CONFLICT") {
      res.status(409).json({ error: "Listing is already booked for these dates." });
      return;
    }
    res.status(500).json({ error: "Something went wrong." });
  }
}

export async function cancelBooking(req: AuthRequest, res: Response) {
  const id = parseInt(req.params.id);

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { listing: true },
  });

  if (!booking) {
    res.status(404).json({ error: "Booking not found." });
    return;
  }

  if (booking.guestId !== req.userId && req.role !== "ADMIN") {
    res.status(403).json({ error: "You can only cancel your own bookings." });
    return;
  }

  if (booking.status === "CANCELLED") {
    res.status(400).json({ error: "Booking is already cancelled." });
    return;
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  // Send cancellation email
  try {
    const guest = await prisma.user.findUnique({ where: { id: req.userId } });
    if (guest) {
      await sendEmail(
        guest.email,
        "Booking Cancelled",
        bookingCancellationEmail(
          guest.name,
          booking.listing.title,
          booking.checkIn.toDateString(),
          booking.checkOut.toDateString()
        )
      );
    }
  } catch (error) {
    console.error("Cancellation email failed:", error);
  }

  res.status(200).json(updated);
}

export async function getMyBookings(req: AuthRequest, res: Response) {
  const bookings = await prisma.booking.findMany({
    where: { guestId: req.userId },
    include: { listing: true },
  });

  res.status(200).json(bookings);
}