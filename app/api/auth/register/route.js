import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req) {
  console.log("Login attempt:", req);
  try {
    const { username, password } = await req.json();
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("hashedPassword", hashedPassword);

    const user = await prisma.user.create({
      data: { username, password: hashedPassword },
    });

    return new Response(JSON.stringify({ message: "User created", user }), {
      status: 201,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Error registering user" }), {
      status: 500,
    });
  }
}
