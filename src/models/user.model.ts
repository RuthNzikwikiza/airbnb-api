export interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  phone: string;
  role: "host" | "guest";
  avatar?: string;
  bio?: string;
}

export const users: User[] = [
  {
    id: 1,
    name: "Alice",
    email: "alice@example.com",
    username: "alice",
    phone: "+250788888888",
    role: "host",
    avatar: "https://i.pravatar.cc/150?img=1",
  },
  {
    id: 2,
    name: "Bob",
    email: "bob@example.com",
    username: "bob",
    phone: "+250788888888",
    role: "guest",
    avatar: "https://i.pravatar.cc/150?img=2",
  },
  {
    id: 3,
    name: "Gashema",
    email: "gashema@example.com",
    username: "gash_m",
    phone: "+250788888888",
    role: "host",
    bio: "I rent out cozy spaces in Kigali and Kampala.",
  },
];