import { supabaseConfig } from "@/config/supabase-client-config";
import { IAddress } from "@/interfaces";

type AddressWritableFields = Pick<
  IAddress,
  "name" | "phone" | "address_line" | "city" | "state" | "postal_code" | "is_default"
>;

async function getAuthenticatedUserId() {
  const supabase = supabaseConfig();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const email = data.user?.email;
  if (!email) {
    throw new Error("User not authenticated.");
  }

  // address.user_id and user_profiles.id are bigint in the live DB.
  // auth.users.id is a UUID, so never pass that into user_id filters.
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("email", email)
    .single();
  if (profileError) throw profileError;
  if (profile?.id == null) {
    throw new Error("User profile not found.");
  }

  return { supabase, userId: profile.id as number };
}

async function clearDefaultAddresses(userId: number) {
  const supabase = supabaseConfig();
  const { error } = await supabase
    .from("address")
    .update({ is_default: false })
    .eq("user_id", userId);
  if (error) throw error;
}

export async function addAddress(payload: AddressWritableFields) {
  const { supabase, userId } = await getAuthenticatedUserId();

  if (payload.is_default) {
    await clearDefaultAddresses(userId);
  }

  const { data, error } = await supabase
    .from("address")
    .insert({
      user_id: userId,
      name: payload.name,
      phone: payload.phone,
      address_line: payload.address_line,
      city: payload.city,
      state: payload.state,
      postal_code: payload.postal_code,
      is_default: payload.is_default,
    })
    .select()
    .single();
  if (error) throw error;
  return data as IAddress;
}

export async function editAddressById(
  id: string,
  payload: Partial<AddressWritableFields>
) {
  const { supabase, userId } = await getAuthenticatedUserId();

  if (payload.is_default) {
    await clearDefaultAddresses(userId);
  }

  const { data, error } = await supabase
    .from("address")
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw error;
  return data as IAddress;
}

export async function getUserAddresses() {
  const { supabase, userId } = await getAuthenticatedUserId();
  const { data, error } = await supabase
    .from("address")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as IAddress[];
}

export async function deleteAddress(id: string) {
  const { supabase, userId } = await getAuthenticatedUserId();
  const { error } = await supabase
    .from("address")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function setDefaultAddress(id: string) {
  const { userId } = await getAuthenticatedUserId();
  await clearDefaultAddresses(userId);
  await editAddressById(id, { is_default: true });
}
