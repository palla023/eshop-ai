import { IAddress } from "@/interfaces";
import { supabaseConfig } from "@/config/supabase-client-config";

export type StripeShipping = {
  name: string;
  phone?: string;
  address: {
    line1: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
};

export function toStripeShipping(address: IAddress): StripeShipping {
  return {
    name: address.name,
    phone: address.phone,
    address: {
      line1: address.address_line,
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: "IN",
    },
  };
}

export function buildExportDescription(
  items: { name: string; quantity: number }[]
) {
  const summary = items
    .map((item) =>
      item.quantity > 1 ? `${item.name} x${item.quantity}` : item.name
    )
    .join(", ");

  return summary
    ? `Export of goods: ${summary}`
    : "Export of goods from India";
}

export async function getStripeClientSecret(
  amount: number,
  options: {
    description: string;
    shipping: StripeShipping;
  }
) {
  const supabase = supabaseConfig();
  const { data, error } = await supabase.functions.invoke<{
    clientSecret: string | null;
    error?: string;
  }>("stripe-backend", {
    body: {
      amount: Math.round(amount * 100),
      currency: "inr",
      description: options.description,
      shipping: options.shipping,
    },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  if (!data?.clientSecret) {
    throw new Error("Could not start Stripe checkout.");
  }

  return data.clientSecret;
}
