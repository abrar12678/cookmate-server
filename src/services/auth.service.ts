import { ObjectId, WithId, Document } from "mongodb";
import { getDb } from "../config/db";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwt";

export interface UserDocument extends Document {
  _id: ObjectId;
  name: string;
  email: string;
  password?: string;
  role?: string;
  avatar?: string;
  bio?: string;
  createdAt: Date;
}

export type SafeUser = Omit<UserDocument, "password">;

export function excludePassword(user: UserDocument): SafeUser {
  const { password, ...safeUser } = user;
  return safeUser;
}

export const authService = {
  async register(name: string, email: string, password: string) {
    const db = getDb();
    const users = db.collection("users");

    const existing = await users.findOne({ email: email.toLowerCase() });
    if (existing) throw { status: 409, message: "Email already registered" };

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await users.insertOne({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: "user",
      avatar: "",
      bio: "",
      createdAt: new Date(),
    });

    const user = (await users.findOne({ _id: result.insertedId })) as UserDocument;
    const token = generateToken({ id: result.insertedId.toString(), role: user.role || "user" });

    return { user: excludePassword(user), token };
  },

  async login(email: string, password: string) {
    const db = getDb();
    const users = db.collection("users");

    const user = (await users.findOne({ email: email.toLowerCase() })) as UserDocument | null;
    if (!user || !user.password) throw { status: 401, message: "Invalid email or password" };

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw { status: 401, message: "Invalid email or password" };

    const token = generateToken({ id: user._id.toString(), role: user.role || "user" });
    return { user: excludePassword(user), token };
  },
};
