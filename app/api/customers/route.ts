import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - Lấy danh sách khách hàng
export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        full_name: true,
        year_of_birth: true,
        phone_number: true,
        note: true,
        status: true,
        created_at: true,
        updated_at: true,
        user: {
          select: {
            id: true,
            name: true,
            team: {
              select: { team_name: true },
            },
          },
        },
      },
    });
    return NextResponse.json(customers);
  } catch (error) {
    console.error("Lỗi lấy danh sách khách hàng:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
export async function POST(req: Request) {
  try {
    const body = await req.json(); // Đọc body từ request

    if (!body || typeof body !== "object") {
      throw new Error("Request body is invalid");
    }

    const {
      full_name,
      year_of_birth,
      phone_number,
      note,
      status,
      user_id,
      team_id,
    } = body;

    // Kiểm tra dữ liệu có hợp lệ không
    if (!full_name || !phone_number || !status || !user_id || !team_id) {
      return new Response("Thiếu thông tin bắt buộc", { status: 400 });
    }

    const newCustomer = {
      full_name,
      year_of_birth: Number(year_of_birth), // Chuyển đổi dữ liệu nếu cần
      phone_number,
      note,
      status,
      user_id: Number(user_id),
      team_id: Number(team_id),
    };

    console.log("Dữ liệu nhận được:", newCustomer);

    const savedCustomer = await prisma.customer.create({ data: newCustomer });

    return new Response(JSON.stringify(newCustomer), { status: 201 });
  } catch (error) {
    console.error("Lỗi khi thêm khách hàng:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json(); // Đọc body từ request

    const id = body.id;
    if (!id || isNaN(Number(id))) {
      console.error("Lỗi: ID khách hàng không hợp lệ");
      return new Response("BE: Thiếu hoặc ID không hợp lệ", { status: 400 });
    }

    // ✅ Lấy dữ liệu từ request

    if (!body || typeof body !== "object") {
      return new Response("Request body không hợp lệ", { status: 400 });
    }

    const {
      full_name,
      year_of_birth,
      phone_number,
      note,
      status,
      user_id,
      team_id,
    } = body;
    console.table(body);

    // ✅ Kiểm tra dữ liệu bắt buộc
    if (!full_name || !phone_number || !status || !user_id || !team_id) {
      return new Response("Thiếu thông tin bắt buộc", { status: 400 });
    }

    // ✅ Chuẩn hóa dữ liệu
    const updatedCustomer = {
      full_name,
      year_of_birth: year_of_birth ? Number(year_of_birth) : null,
      phone_number,
      note,
      status,
      user_id: Number(user_id),
      team_id: Number(team_id),
    };

    console.log("Dữ liệu cập nhật:", updatedCustomer);

    // ✅ Cập nhật database bằng Prisma
    const result = await prisma.customer.update({
      where: { id: Number(id) },
      data: updatedCustomer,
    });

    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error("Lỗi khi cập nhật khách hàng:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
