"use client";

import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
interface Customer {
  id: number;
  full_name: string;
  year_of_birth: number;
  phone_number: string;
  note: string;
  status: string;
  user: {
    name: string; // Người gọi
    team: { team_name: string } | null; // Tổ (nếu có)
  };
}
interface DecodedToken {
  id: number; // Lấy user_id từ token
  username: string;
}
const formatDate = (isoString: string) => {
  const date = new Date(isoString);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();

  return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
};
export default function Dashboard() {
  const [time, setTime] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      // Lấy thông tin về thứ trong tuần (Thứ Hai, Thứ Ba, ...)
      const daysOfWeek = [
        "Chủ Nhật",
        "Thứ Hai",
        "Thứ Ba",
        "Thứ Tư",
        "Thứ Năm",
        "Thứ Sáu",
        "Thứ Bảy",
      ];
      const dayOfWeek = daysOfWeek[now.getDay()];

      // Lấy ngày, tháng, năm
      const day = now.getDate();
      const month = now.getMonth() + 1; // getMonth() trả về từ 0-11 nên +1
      const year = now.getFullYear();

      // Lấy giờ, phút, giây
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const seconds = now.getSeconds().toString().padStart(2, "0");

      setTime(
        `${dayOfWeek}, ${day}/${month}/${year} - ${hours}:${minutes}:${seconds}`
      );
    };

    updateTime(); // Cập nhật ngay lần đầu
    const interval = setInterval(updateTime, 1000); // Cập nhật mỗi giây

    return () => clearInterval(interval);
  }, []);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    year_of_birth: "",
    phone_number: "",
    note: "",
    status: "Đang đợi",
    user_id: 1,
    team_id: 1,
  });

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch("/api/customers");

        if (!response.ok) throw new Error("Failed to fetch customers");

        const data = await response.json();
        setCustomers(data);
      } catch (error) {
        console.error("Lỗi khi lấy khách hàng:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);
  // Lấy user_id từ token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded: DecodedToken = jwtDecode(token);
        setUserId(decoded.id);
      } catch (error) {
        console.error("Lỗi khi decode token:", error);
      }
    }
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      console.error("User ID chưa được xác định");
      return;
    }

    const customerData = {
      ...formData,
      year_of_birth: Number(formData.year_of_birth), // Đảm bảo là số
      user_id: userId, // Gán user_id từ token
    };

    try {
      console.log("Dữ liệu gửi lên:", customerData);

      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerData),
      });

      if (!response.ok) throw new Error("Failed to add customer");

      const newCustomer = await response.json();
      setCustomers([...customers, newCustomer]);
      setShowForm(false);
      setFormData({
        full_name: "",
        year_of_birth: "",
        phone_number: "",
        note: "",
        status: "Đang đợi",
        user_id: userId,
        team_id: 1,
      });
    } catch (error) {
      console.error("Lỗi khi thêm khách hàng:", error);
    }
  };
  const router = useRouter();
  const handleLogout = () => {
    localStorage.removeItem("token"); // Xóa token
    router.push("/login"); // Chuyển hướng về trang login
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("PUT Dữ liệu gửi lên:", formData);

    try {
      const response = await fetch(`/api/customers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to update customer");

      const updatedCustomer = await response.json();
      setCustomers((prev) =>
        prev.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c))
      );
      setEditingCustomer(null);
    } catch (error) {
      console.error("Lỗi khi cập nhật khách hàng:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-8 bg-gray-100">
      <button
        onClick={handleLogout}
        className="fixed top-4 right-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded shadow-lg"
      >
        Đăng xuất
      </button>
      <div className="text-3xl font-bold bg-white px-6 py-3 rounded-lg shadow-md mb-6">
        {time ? time : "Đang tải..."}
      </div>
      <button
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
        onClick={() => setShowForm(!showForm)}
      >
        {showForm ? "Đóng form" : "Thêm khách hàng"}
      </button>
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-10"></div>
      )}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center z-20">
          <div className="bg-white p-6 shadow-lg rounded-lg w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
              onClick={() => setShowForm(false)}
            >
              ✖
            </button>
            <h2 className="text-lg font-semibold mb-4">Thêm khách hàng</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder="Họ và tên"
                className="border p-2 rounded"
                required
              />
              <input
                type="number"
                name="year_of_birth"
                value={formData.year_of_birth}
                onChange={handleInputChange}
                placeholder="Năm sinh"
                className="border p-2 rounded"
                required
              />
              <input
                type="text"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                placeholder="Số điện thoại"
                className="border p-2 rounded"
                required
              />
              <input
                type="text"
                name="note"
                value={formData.note}
                onChange={handleInputChange}
                placeholder="Ghi chú"
                className="border p-2 rounded"
              />
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="border p-2 rounded"
              >
                <option value="Đang đợi">Đang đợi</option>
                <option value="OK">OK</option>
                <option value=">Not OK">Not OK</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-700"
              >
                Lưu khách hàng
              </button>
            </form>
          </div>
        </div>
      )}
      <div className="flex flex-col items-center justify-start min-h-screen p-8 bg-gray-100">
        <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-6xl">
          <h2 className="text-xl font-semibold mb-4">Danh sách khách hàng</h2>

          {loading ? (
            <p>Đang tải dữ liệu...</p>
          ) : (
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 p-2">Họ và tên</th>
                  <th className="border border-gray-300 p-2">Năm sinh</th>
                  <th className="border border-gray-300 p-2">Số điện thoại</th>
                  <th className="border border-gray-300 p-2">Ghi chú</th>
                  <th className="border border-gray-300 p-2">Người gọi</th>
                  <th className="border border-gray-300 p-2">Tổ</th>
                  <th className="border border-gray-300 p-2">Trạng thái</th>
                  <th className="border border-gray-300 p-2">Thời gian nhập</th>
                  <th className="border border-gray-300 p-2">
                    Thời gian chốt khách
                  </th>
                </tr>
              </thead>
              <tbody>
                {customers.length > 0 ? (
                  customers.map((customer, index) => (
                    <tr
                      key={customer.id ?? `customer-${index}`}
                      className="text-center hover:bg-gray-100 cursor-pointer relative"
                      onClick={() => {
                        setEditingCustomer(customer);
                        setFormData({
                          id: customer.id,
                          full_name: customer.full_name,
                          year_of_birth: customer.year_of_birth,
                          phone_number: customer.phone_number,
                          note: customer.note ?? "",
                          status: customer.status ?? "Đang dợi",
                          team_id: customer.team_id ?? 1,
                          user_id: customer.team_id ?? 1,
                        });
                      }}
                    >
                      <td className="border border-gray-300 p-2">
                        {customer.full_name}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {customer.year_of_birth}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {customer.phone_number}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {customer.note}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {customer.user?.name ?? "Không có"}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {customer.user?.team?.team_name ?? "Không có"}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {customer.status}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {formatDate(customer.created_at)}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {formatDate(customer.updated_at)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-4">
                      Không có khách hàng nào.
                    </td>
                  </tr>
                )}
                {editingCustomer && (
                  <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
                    <div className="bg-white p-6 shadow-lg rounded-lg w-full max-w-md relative">
                      <button
                        className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
                        onClick={() => setEditingCustomer(null)}
                      >
                        ✖
                      </button>
                      <h2 className="text-lg font-semibold mb-4">
                        Chỉnh sửa khách hàng
                      </h2>
                      <form
                        onSubmit={handleUpdateCustomer}
                        className="flex flex-col gap-3"
                      >
                        <input
                          type="text"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleChange}
                          placeholder="Họ và tên"
                          className="border p-2 rounded"
                          required
                        />
                        <input
                          type="number"
                          name="year_of_birth"
                          value={formData.year_of_birth}
                          onChange={handleChange}
                          placeholder="Năm sinh"
                          className="border p-2 rounded"
                          required
                        />
                        <input
                          type="text"
                          name="phone_number"
                          value={formData.phone_number}
                          onChange={handleChange}
                          placeholder="Số điện thoại"
                          className="border p-2 rounded"
                          required
                        />
                        <input
                          type="text"
                          name="note"
                          value={formData.note}
                          onChange={handleChange}
                          placeholder="Ghi chú"
                          className="border p-2 rounded"
                        />
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleChange} // Sửa lại onChange
                          className="border p-2 rounded"
                        >
                          <option value="Đang đợi">Đang đợi</option>
                          <option value="OK">OK</option>
                          <option value="Not OK">Not OK</option>
                        </select>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-700"
                        >
                          Cập nhật
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
