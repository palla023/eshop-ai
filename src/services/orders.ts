import { supabaseConfig } from "@/config/supabase-client-config";
import {
  IAddress,
  IOrder,
  IOrderCustomer,
  IOrderItem,
  OrderStatus,
} from "@/interfaces";

export const PENDING_ORDER_KEY = "eshop-pending-order";

const ORDER_SELECT =
  "*, address:address!address_id(id, name, phone, address_line, city, state, postal_code)";

const ADMIN_ORDER_SELECT =
  "*, address:address!address_id(id, name, phone, address_line, city, state, postal_code), customer:user_profiles!user_id(id, name, email)";

export type CreateOrderPayload = {
  subtotal: number;
  shipping_fee: number;
  total: number;
  payment_id: string;
  items: IOrderItem[];
  address_id: string;
  status?: OrderStatus;
};

function snapshotOrderItems(items: IOrderItem[]): IOrderItem[] {
  return items.map((item) => ({
    id: String(item.id),
    name: item.name,
    description: item.description ?? "",
    price: Number(item.price),
    category_id: String(item.category_id ?? ""),
    created_at: item.created_at,
    images: Array.isArray(item.images) ? item.images : [],
    quantity: Number(item.quantity) || 1,
  }));
}

type OrderRow = {
  id: string | number;
  created_at: string;
  user_id: string | number;
  address_id: string | number;
  subtotal: number | string;
  shipping_fee: number | string;
  total: number | string;
  status: OrderStatus;
  payment_id?: string | null;
  items?: IOrderItem[] | null;
  address?: IOrder["address"] | IAddress | IAddress[] | null;
  customer?: IOrderCustomer | IOrderCustomer[] | null;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function normalizeOrder(row: OrderRow) {
  const address = Array.isArray(row.address)
    ? row.address[0] ?? null
    : row.address ?? null;
  const customer = firstRelation(row.customer);
  return {
    id: String(row.id),
    created_at: row.created_at,
    user_id: String(row.user_id),
    address_id: String(row.address_id),
    subtotal: Number(row.subtotal),
    shipping_fee: Number(row.shipping_fee),
    total: Number(row.total),
    status: row.status,
    payment_id: row.payment_id ?? "",
    items: snapshotOrderItems(Array.isArray(row.items) ? row.items : []),
    address: address ? { ...address, id: String(address.id) } : null,
    customer: customer
      ? {
          id: String(customer.id),
          name: String(customer.name ?? ""),
          email: String(customer.email ?? ""),
        }
      : null,
  } as IOrder;
}

type OrderUpdatePayload = Partial<Pick<IOrder, "status" | "payment_id">>;

async function getAuthenticatedProfile() {
  const supabase = supabaseConfig();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const email = data.user?.email;
  if (!email) {
    throw new Error("User not authenticated.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("id, role")
    .eq("email", email)
    .single();
  if (profileError) throw profileError;
  if (profile?.id == null) {
    throw new Error("User profile not found.");
  }

  return {
    supabase,
    userId: profile.id as number,
    role: String(profile.role ?? "user").trim().toLowerCase(),
  };
}

async function findOrderByPaymentId(paymentId: string) {
  const supabase = supabaseConfig();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("payment_id", paymentId)
    .maybeSingle();
  if (error) throw error;
  return data ? normalizeOrder(data as unknown as OrderRow) : null;
}

export async function getOrderByPaymentId(paymentId: string) {
  return findOrderByPaymentId(paymentId);
}

export async function createOrder(payload: CreateOrderPayload) {
  const { supabase, userId } = await getAuthenticatedProfile();

  const { data, error } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      subtotal: payload.subtotal,
      shipping_fee: payload.shipping_fee,
      total: payload.total,
      status: payload.status ?? "paid",
      payment_id: payload.payment_id,
      items: snapshotOrderItems(payload.items),
      address_id: payload.address_id,
    })
    .select(ORDER_SELECT)
    .single();

  if (error) {
    if (error.code === "23505" && payload.payment_id) {
      const existing = await findOrderByPaymentId(payload.payment_id);
      if (existing) return existing;
    }
    throw error;
  }

  return normalizeOrder(data as unknown as OrderRow);
}

export async function getUserOrders() {
  const { supabase, userId } = await getAuthenticatedProfile();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as OrderRow[]).map(normalizeOrder);
}

async function selectAllOrders(
  supabase: ReturnType<typeof supabaseConfig>,
  columns: string
) {
  return supabase
    .from("orders")
    .select(columns)
    .order("created_at", { ascending: false });
}

export async function getAllOrders() {
  const { supabase, role } = await getAuthenticatedProfile();
  if (role !== "admin") {
    throw new Error("Only admins can view all orders.");
  }

  const primary = await selectAllOrders(supabase, ADMIN_ORDER_SELECT);
  if (!primary.error) {
    return ((primary.data ?? []) as unknown as OrderRow[]).map(normalizeOrder);
  }

  const fallback = await selectAllOrders(supabase, ORDER_SELECT);
  if (fallback.error) throw fallback.error;
  return ((fallback.data ?? []) as unknown as OrderRow[]).map(normalizeOrder);
}

export async function getOrderById(id: string) {
  const { supabase, userId, role } = await getAuthenticatedProfile();
  const columns = role === "admin" ? ADMIN_ORDER_SELECT : ORDER_SELECT;
  let query = supabase.from("orders").select(columns).eq("id", id);

  if (role !== "admin") {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query.single();
  if (!error) {
    return normalizeOrder(data as unknown as OrderRow);
  }

  if (role === "admin") {
    const fallback = await supabase
      .from("orders")
      .select(ORDER_SELECT)
      .eq("id", id)
      .single();
    if (fallback.error) throw fallback.error;
    return normalizeOrder(fallback.data as unknown as OrderRow);
  }

  throw error;
}

async function assertAdmin() {
  const auth = await getAuthenticatedProfile();
  if (auth.role !== "admin") {
    throw new Error("Only admins can update orders.");
  }
  return auth;
}

export async function updateOrderById(id: string, payload: OrderUpdatePayload) {
  const { supabase } = await assertAdmin();
  const query = supabase.from("orders").update(payload).eq("id", id);
  const primary = await query.select(ADMIN_ORDER_SELECT).single();
  if (!primary.error) {
    return normalizeOrder(primary.data as unknown as OrderRow);
  }

  const fallback = await supabase
    .from("orders")
    .update(payload)
    .eq("id", id)
    .select(ORDER_SELECT)
    .single();
  if (fallback.error) throw fallback.error;
  return normalizeOrder(fallback.data as unknown as OrderRow);
}

export async function updateOrdersStatus(ids: string[], status: OrderStatus) {
  const { supabase } = await assertAdmin();
  if (ids.length === 0) return [] as IOrder[];

  const primary = await supabase
    .from("orders")
    .update({ status })
    .in("id", ids)
    .select(ADMIN_ORDER_SELECT);
  if (!primary.error) {
    return ((primary.data ?? []) as unknown as OrderRow[]).map(normalizeOrder);
  }

  const fallback = await supabase
    .from("orders")
    .update({ status })
    .in("id", ids)
    .select(ORDER_SELECT);
  if (fallback.error) throw fallback.error;
  return ((fallback.data ?? []) as unknown as OrderRow[]).map(normalizeOrder);
}
