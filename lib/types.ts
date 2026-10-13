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
  rating?: number;
  review_count?: number;
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

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  reviewer_name?: string;
  reviewer_avatar?: string;
}

export interface Wishlist {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export interface Analytics {
  total_products: number;
  total_users: number;
  total_reviews: number;
  total_transactions: number;
  avg_rating: number;
  products_by_category: { category: string; count: number }[];
  top_sellers: { seller_id: string; seller_name: string; product_count: number }[];
  recent_activity: { date: string; count: number }[];
}
