export interface IUser {
  id: string;
  email: string;
  name: string;
  password: string;
  role: "admin" | "user";
  is_active?: boolean;
  profile_pic?: string;
  created_at: string;
  updated_at: string;
}

export interface ICategory {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface IProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  created_at: string;
  images: string[];
}

export interface IAddress {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  address_line: string;
  city: string;
  state: string;
  postal_code: string;
  is_default: boolean;
  created_at: string;
}

export interface IOrderItem extends IProduct {
  quantity: number;
}

export type OrderStatus =
  | "pending"
  | "paid"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface IOrderCustomer {
  id: string;
  name: string;
  email: string;
}

export interface IOrder {
  id: string;
  created_at: string;
  user_id: string;
  subtotal: number;
  shipping_fee: number;
  total: number;
  status: OrderStatus;
  payment_id: string;
  items: IOrderItem[];
  address_id: string;
  address?: Pick<
    IAddress,
    "id" | "name" | "phone" | "address_line" | "city" | "state" | "postal_code"
  > | null;
  customer?: IOrderCustomer | null;
}

