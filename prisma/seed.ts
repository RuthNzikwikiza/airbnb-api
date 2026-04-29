import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

const adapter = new PrismaPg({ connectionString: process.env["DATABASE_URL"] as string });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(" Seeding database...");

  await prisma.booking.deleteMany();
  await prisma.listingPhoto.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.user.deleteMany();

  console.log("  Cleared existing data");

  const hashedPassword = await bcrypt.hash("password123", 10);

  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      name: "Alice Johnson",
      email: "alice@example.com",
      username: "alice_host",
      phone: "+250788000001",
      password: hashedPassword,
      role: "HOST",
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      name: "Bob Smith",
      email: "bob@example.com",
      username: "bob_host",
      phone: "+250788000002",
      password: hashedPassword,
      role: "HOST",
    },
  });

  const carol = await prisma.user.upsert({
    where: { email: "carol@example.com" },
    update: {},
    create: {
      name: "Carol White",
      email: "carol@example.com",
      username: "carol_guest",
      phone: "+250788000003",
      password: hashedPassword,
      role: "GUEST",
    },
  });

  const david = await prisma.user.upsert({
    where: { email: "david@example.com" },
    update: {},
    create: {
      name: "David Brown",
      email: "david@example.com",
      username: "david_guest",
      phone: "+250788000004",
      password: hashedPassword,
      role: "GUEST",
    },
  });

  const eve = await prisma.user.upsert({
    where: { email: "eve@example.com" },
    update: {},
    create: {
      name: "Eve Davis",
      email: "eve@example.com",
      username: "eve_guest",
      phone: "+250788000005",
      password: hashedPassword,
      role: "GUEST",
    },
  });

  console.log(" Created users");

  const apartment = await prisma.listing.create({
    data: {
      title: "Cozy Apartment in Kigali",
      description: "A bright modern apartment in the city center",
      location: "Kigali, Rwanda",
      pricePerNight: 75,
      guests: 2,
      type: "apartment",
      amenities: ["WiFi", "Kitchen", "TV"],
      hostId: alice.id,
    },
  });

  const house = await prisma.listing.create({
    data: {
      title: "Spacious Family House",
      description: "Perfect for families visiting Kigali",
      location: "Kigali, Rwanda",
      pricePerNight: 150,
      guests: 6,
      type: "house",
      amenities: ["WiFi", "Kitchen", "Garden", "Parking"],
      hostId: alice.id,
    },
  });

  const villa = await prisma.listing.create({
    data: {
      title: "Luxury Villa with Pool",
      description: "Stunning villa with private pool and lake views",
      location: "Gisenyi, Rwanda",
      pricePerNight: 300,
      guests: 8,
      type: "villa",
      amenities: ["WiFi", "Pool", "Kitchen", "BBQ", "Lake view"],
      hostId: bob.id,
    },
  });

  const cabin = await prisma.listing.create({
    data: {
      title: "Mountain Cabin Retreat",
      description: "Escape the city in this peaceful mountain cabin",
      location: "Musanze, Rwanda",
      pricePerNight: 120,
      guests: 4,
      type: "cabin",
      amenities: ["Fireplace", "Hiking trails", "WiFi", "Kitchen"],
      hostId: bob.id,
    },
  });

  console.log(" Created listings");

  await prisma.booking.create({
    data: {
      listingId: apartment.id,
      guestId: carol.id,
      checkIn: new Date("2026-08-01"),
      checkOut: new Date("2026-08-05"),
      totalPrice: 4 * apartment.pricePerNight,
      status: "CONFIRMED",
    },
  });

  await prisma.booking.create({
    data: {
      listingId: villa.id,
      guestId: david.id,
      checkIn: new Date("2026-09-10"),
      checkOut: new Date("2026-09-15"),
      totalPrice: 5 * villa.pricePerNight,
      status: "PENDING",
    },
  });

  await prisma.booking.create({
    data: {
      listingId: cabin.id,
      guestId: eve.id,
      checkIn: new Date("2026-10-01"),
      checkOut: new Date("2026-10-04"),
      totalPrice: 3 * cabin.pricePerNight,
      status: "CONFIRMED",
    },
  });

  console.log(" Created bookings");
  console.log(" Seeding complete!");
}

main()
  .catch((e) => {
    console.error(" Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());