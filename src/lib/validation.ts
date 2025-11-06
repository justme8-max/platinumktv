import { z } from "zod";

// Employee validation schema
export const employeeSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(100, "Nama maksimal 100 karakter"),
  division: z.string().trim().min(1, "Divisi wajib diisi").max(50, "Divisi maksimal 50 karakter"),
  phone: z.string().trim().regex(/^(\+?62|0)[0-9]{9,13}$/, "Format nomor telepon tidak valid").optional().or(z.literal("")),
  employee_id: z.string().trim().min(1, "ID Karyawan wajib diisi").max(50, "ID maksimal 50 karakter"),
});

// Product validation schema
export const productSchema = z.object({
  name_id: z.string().trim().min(1, "Nama produk (ID) wajib diisi").max(200, "Nama maksimal 200 karakter"),
  name_en: z.string().trim().min(1, "Nama produk (EN) wajib diisi").max(200, "Nama maksimal 200 karakter"),
  sku: z.string().trim().min(1, "SKU wajib diisi").max(50, "SKU maksimal 50 karakter"),
  category_id: z.string().uuid("Kategori tidak valid"),
  price: z.number().positive("Harga harus lebih dari 0"),
  cost: z.number().positive("Harga beli harus lebih dari 0"),
  stock_quantity: z.number().int("Stok harus bilangan bulat").nonnegative("Stok tidak boleh negatif"),
  min_stock_level: z.number().int("Level stok minimum harus bilangan bulat").nonnegative("Level tidak boleh negatif"),
});

// Purchase order validation schema
export const purchaseOrderSchema = z.object({
  product_id: z.string().uuid("Produk tidak valid"),
  quantity: z.number().int("Kuantitas harus bilangan bulat").positive("Kuantitas harus lebih dari 0"),
  unit_price: z.number().positive("Harga satuan harus lebih dari 0"),
  notes: z.string().max(500, "Catatan maksimal 500 karakter").optional(),
});

// Login validation schema
export const loginSchema = z.object({
  email: z.string().trim().email("Format email tidak valid").max(255, "Email maksimal 255 karakter"),
  password: z.string().min(6, "Password minimal 6 karakter").max(100, "Password maksimal 100 karakter"),
});

// Registration validation schema
export const registerSchema = z.object({
  email: z.string().trim().email("Format email tidak valid").max(255, "Email maksimal 255 karakter"),
  password: z.string()
    .min(8, "Password minimal 8 karakter")
    .max(100, "Password maksimal 100 karakter")
    .regex(/[A-Z]/, "Password harus memiliki minimal 1 huruf kapital")
    .regex(/[a-z]/, "Password harus memiliki minimal 1 huruf kecil")
    .regex(/[0-9]/, "Password harus memiliki minimal 1 angka"),
  confirmPassword: z.string(),
  fullName: z.string().trim().min(2, "Nama lengkap minimal 2 karakter").max(100, "Nama maksimal 100 karakter"),
  phone: z.string().trim().regex(/^(\+?62|0)[0-9]{9,13}$/, "Format nomor telepon tidak valid").optional().or(z.literal("")),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
});

// Transaction validation schema
export const transactionSchema = z.object({
  room_id: z.string().uuid("Ruangan tidak valid"),
  amount: z.number().positive("Jumlah harus lebih dari 0"),
  payment_method: z.union([
    z.literal("cash"),
    z.literal("card"),
    z.literal("transfer"),
    z.literal("ewallet")
  ]),
});
