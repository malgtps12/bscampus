export interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  category: string;
  seller_name: string;
  seller_student_id: string;
  seller_contact: string;
  images?: string[];
  condition: "baru" | "bekas";
  created_at: string;
  updated_at: string;
  sold?: boolean;
}

export interface User {
  id: string;
  name: string;
  studentId: string;
  email: string;
  phone: string;
  campus: string;
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
  ewalletType?: string;
  ewalletNumber?: string;
}