export interface Listing {
  id: number;
  title: string;
  description: string;
  location: string;
  pricePerNight: number;
  guests: number;
  type: "apartment" | "house" | "villa" | "cabin";
  amenities: string[];
  rating?: number;
  host: string;
}

export const listings: Listing[] = [
  {
    id: 1,
    title: "Cozy Apartment in Kigali City Center",
    description:
      "A bright, modern apartment steps away from Kigali's best restaurants and attractions.",
    location: "Kigali, Rwanda",
    pricePerNight: 75,
    guests: 2,
    type: "apartment",
    amenities: ["WiFi", "Air Conditioning", "Kitchen", "TV"],
    rating: 4.8,
    host: "alice",
  },
  {
    id: 2,
    title: "Lakeside Villa with Stunning Views",
    description :
      "Luxurious villa overlooking Lake Kivu — perfect for families or group retreats.",
    location: "Gisenyi, Rwanda",
    pricePerNight: 220,
    guests: 8,
    type: "villa",
    amenities: ["WiFi", "Pool", "Kitchen", "Garden", "Parking", "BBQ Grill"],
    rating: 4.9,
    host: "gashema",
  },
  {
    id: 3,
    title: "Rustic Cabin in Nyungwe Forest",
    description:
      "Escape into nature with this charming off-grid cabin near Nyungwe National Park.",
    location: "Nyungwe, Rwanda",
    pricePerNight: 55,
    guests: 4,
    type: "cabin",
    amenities: ["Fireplace", "Hiking Trails", "Outdoor Shower"],
    rating: 4.6,
    host: "alice",
  },
];