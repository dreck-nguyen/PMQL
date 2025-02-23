import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
export async function POST(req) {
  try {
    const { username, password } = await req.json();
    console.log("Login attempt:", username);

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        password: true,
        role_id: true,
        is_first_login: true,
      },
    });

    if (!user) {
      console.log("User not found");
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      console.log("Invalid password");
      return new Response(JSON.stringify({ error: "Invalid password" }), {
        status: 401,
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role_id: user.role_id,
        is_first_login: user.is_first_login,
      },
      "secret",
      { expiresIn: "1h" }
    );

    console.log("Login successful:", user.username);

    return new Response(
      JSON.stringify({
        message: "Login successful",
        token,
        role_id: user.role_id,
        is_first_login: user.is_first_login,
      }),
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Login error:", error);
    return new Response(
      JSON.stringify({ error: "Login error", details: error.message }),
      { status: 500 }
    );
  }
}
