import { supabaseConfig } from "@/config/supabase-client-config";
import { IUser } from "@/interfaces";

// Register new user and create user profile in the database 
export async function registerNewUser(payload: Partial<IUser>) {
  const supabase = supabaseConfig();
  const { data, error } = await supabase.auth.signUp({
    email: payload.email!,
    password: payload.password!,
    options: {
      data: {
        name: payload.name!,
        role: payload.role!,
      },
    },
  });
  // Throw error if user is not created successfully
  if (error) throw error;

  // Insert user profile into user_profiles table if user is created successfully 
  const { data: userData, error: userError } = await supabase.from("user_profiles").insert({
    id: data.user?.id,
    email: data.user?.email,
    name: payload.name!,
    role: "user",
    is_active: true,
    profile_pic:""
  });
 // Throw error if user profile is not created successfully
  if (userError) throw userError;
  // Return user data
  return userData;
}

// Get user profile by user id
export async function getUserProfile(userId: string) {
  const supabase = supabaseConfig();
  const { data, error } = await supabase.from("user_profiles").select("*").eq("id", userId).single();
  if (error) throw error;
  return data;
}

// Validate credentials and return the database user record
export async function loginUser(payload: Pick<IUser, "email" | "password" | "role">) {
  const supabase = supabaseConfig();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  });
  if (error) throw error;

  const authUser = data.user;
  if (!authUser) throw new Error("Unable to sign in. Please try again.");

  const { data: profileById } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();

  let userProfile = profileById;

  if (!userProfile) {
    const { data: profileByEmail, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("email", payload.email)
      .maybeSingle();
    if (profileError) throw profileError;
    userProfile = profileByEmail;
  }

  if (!userProfile) {
    await supabase.auth.signOut();
    throw new Error("User profile not found.");
  }

  if (userProfile.is_active === false) {
    await supabase.auth.signOut();
    throw new Error("This account has been deactivated.");
  }

  const profileRole = String(userProfile.role ?? "").trim().toLowerCase();
  if (profileRole !== payload.role) {
    await supabase.auth.signOut();
    throw new Error("Invalid role for this account.");
  }

  return { ...userProfile, role: profileRole as IUser["role"] };
}

// Get current user details from the database
export async function getCurrentUserDetails() {
  const supabase = supabaseConfig();
  // Get current user from the database using supabase auth
  const { data: authUser, error: authUserError } = await supabase.auth.getUser();
  // Throw error if user is not found
  if (authUserError) {
    if (authUserError.code === "user_not_authenticated") {
      throw new Error("User not authenticated.");
    }
    throw authUserError;
  }     

  // Throw error if user id is not found
  if (!authUser.user?.id) {
    await supabase.auth.signOut();
    throw new Error("User id not found.");
  } 

  // Get user profile from the database using user id
  const { data: userProfile, error: userProfileError } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("email", authUser.user?.email)
    .single();
  // Throw error if user profile is not found
  if (userProfileError) {
    await supabase.auth.signOut();
    throw new Error("User profile not found.");
  }
  const profileRole = String(userProfile.role ?? "user").trim().toLowerCase() as IUser["role"];
  return { ...userProfile, role: profileRole || "user" };
}

function normalizeProfileRole(role: unknown): IUser["role"] {
  const profileRole = String(role ?? "user").trim().toLowerCase();
  return profileRole === "admin" ? "admin" : "user";
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (
    typeof error === "object" &&
    error &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message
  ) {
    return error.message;
  }
  return fallback;
}

export async function updateCurrentUserProfile(payload: {
  name: string;
  profile_pic?: string;
}) {
  const supabase = supabaseConfig();
  const { data: authUser, error: authUserError } = await supabase.auth.getUser();
  if (authUserError || !authUser.user?.email) {
    throw new Error("User not authenticated.");
  }

  const name = payload.name.trim();
  if (!name) {
    throw new Error("Name is required.");
  }

  const { data: existing, error: lookupError } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("email", authUser.user.email)
    .single();
  if (lookupError) {
    throw new Error(getErrorMessage(lookupError, "User profile not found."));
  }
  if (existing?.id == null) {
    throw new Error("User profile not found.");
  }

  // Do not write updated_at — the live table may not have that column.
  const updates: { name: string; profile_pic?: string } = { name };
  if (payload.profile_pic !== undefined) {
    updates.profile_pic = payload.profile_pic;
  }

  const { data: userProfile, error: userProfileError } = await supabase
    .from("user_profiles")
    .update(updates)
    .eq("id", existing.id)
    .select("*")
    .maybeSingle();

  if (userProfileError) {
    throw new Error(getErrorMessage(userProfileError, "Failed to update profile."));
  }
  if (!userProfile) {
    throw new Error(
      "Profile update was blocked by database permissions. In the Supabase SQL editor, add an UPDATE policy on user_profiles that matches email = auth.jwt() ->> 'email' (do not compare auth.uid() to the bigint id)."
    );
  }

  const { error: metadataError } = await supabase.auth.updateUser({
    data: { name },
  });
  if (metadataError) {
    console.warn("Auth metadata name sync failed:", metadataError.message);
  }

  return {
    ...userProfile,
    role: normalizeProfileRole(userProfile.role),
  } as IUser;
}

export async function changeUserPassword(payload: {
  currentPassword: string;
  newPassword: string;
}) {
  const supabase = supabaseConfig();
  const { data: authUser, error: authUserError } = await supabase.auth.getUser();
  if (authUserError || !authUser.user?.email) {
    throw new Error("User not authenticated.");
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: authUser.user.email,
    password: payload.currentPassword,
  });
  if (verifyError) {
    throw new Error("Current password is incorrect.");
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: payload.newPassword,
  });
  if (updateError) throw updateError;
}

export function clearClientAuthData() {
  if (typeof window === "undefined") return;

  localStorage.clear();

  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const eqPos = cookie.indexOf("=");
    const name = (eqPos > -1 ? cookie.slice(0, eqPos) : cookie).trim();
    if (!name) continue;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
  }
}

export async function clearSessionOnAuthError() {
  try {
    const supabase = supabaseConfig();
    await supabase.auth.signOut();
  } catch {
    // Session may already be invalid; still wipe client storage.
  }
  clearClientAuthData();
}

const PROFILE_COLUMNS =
  "id, email, name, role, is_active, profile_pic, created_at";

function mapProfileRow(row: Record<string, unknown>): IUser {
  return {
    id: String(row.id ?? ""),
    email: String(row.email ?? ""),
    name: String(row.name ?? ""),
    role: normalizeProfileRole(row.role),
    is_active: row.is_active !== false,
    profile_pic: typeof row.profile_pic === "string" ? row.profile_pic : "",
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? row.created_at ?? ""),
    password: "",
  };
}

async function getAdminClient() {
  const supabase = supabaseConfig();
  const { data: authUser, error: authUserError } = await supabase.auth.getUser();
  if (authUserError || !authUser.user?.email) {
    throw new Error("User not authenticated.");
  }

  const { data: actor, error: actorError } = await supabase
    .from("user_profiles")
    .select("id, email, role")
    .eq("email", authUser.user.email)
    .single();
  if (actorError) {
    throw new Error(getErrorMessage(actorError, "User profile not found."));
  }
  if (normalizeProfileRole(actor?.role) !== "admin") {
    throw new Error("Only admins can manage users.");
  }

  return {
    supabase,
    actor: {
      id: String(actor.id ?? ""),
      email: String(actor.email ?? authUser.user.email),
    },
  };
}

async function countActiveAdmins(
  supabase: ReturnType<typeof supabaseConfig>
) {
  const { count, error } = await supabase
    .from("user_profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin")
    .eq("is_active", true);
  if (error) {
    throw new Error(getErrorMessage(error, "Failed to verify admin seats."));
  }
  return count ?? 0;
}

async function getProfileById(
  supabase: ReturnType<typeof supabaseConfig>,
  userId: string
) {
  const { data, error } = await supabase
    .from("user_profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    throw new Error(getErrorMessage(error, "User not found."));
  }
  if (!data) {
    throw new Error("User not found.");
  }
  return mapProfileRow(data as Record<string, unknown>);
}

function isInvalidIdTypeError(error: { code?: string; message?: string }) {
  const message = (error.message ?? "").toLowerCase();
  return (
    error.code === "22P02" ||
    message.includes("invalid input syntax for type bigint") ||
    message.includes("invalid input syntax for type uuid")
  );
}

export async function getAllUserProfiles() {
  const { supabase } = await getAdminClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select(PROFILE_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return ((data ?? []) as Record<string, unknown>[]).map(mapProfileRow);
}

export async function createUserAsAdmin(payload: {
  name: string;
  email: string;
  password: string;
  role: IUser["role"];
  is_active?: boolean;
}) {
  const { supabase, actor } = await getAdminClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const adminSession = sessionData.session;
  if (!adminSession) {
    throw new Error("User not authenticated.");
  }

  const name = payload.name.trim();
  const email = payload.email.trim().toLowerCase();
  const role = payload.role === "admin" ? "admin" : "user";
  const isActive = payload.is_active !== false;

  if (!name) throw new Error("Name is required.");
  if (!email) throw new Error("Email is required.");
  if (payload.password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  const { data: existing } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existing) {
    throw new Error("A user with this email already exists.");
  }

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password: payload.password,
    options: {
      data: { name, role },
    },
  });
  if (signUpError) {
    throw new Error(getErrorMessage(signUpError, "Failed to create account."));
  }

  await supabase.auth.setSession({
    access_token: adminSession.access_token,
    refresh_token: adminSession.refresh_token,
  });
  const { data: restored } = await supabase.auth.getUser();
  if (
    restored.user?.email?.trim().toLowerCase() !==
    actor.email.trim().toLowerCase()
  ) {
    throw new Error(
      "Could not restore the admin session after creating the account. Sign in again, then retry."
    );
  }

  const profile: Record<string, unknown> = {
    email,
    name,
    role,
    is_active: isActive,
    profile_pic: "",
  };
  if (signUpData.user?.id) {
    profile.id = signUpData.user.id;
  }

  let insert = await supabase
    .from("user_profiles")
    .insert(profile)
    .select(PROFILE_COLUMNS)
    .maybeSingle();

  if (insert.error && profile.id && isInvalidIdTypeError(insert.error)) {
    const withoutAuthId = { ...profile };
    delete withoutAuthId.id;
    insert = await supabase
      .from("user_profiles")
      .insert(withoutAuthId)
      .select(PROFILE_COLUMNS)
      .maybeSingle();
  }

  if (insert.error) {
    throw new Error(
      getErrorMessage(
        insert.error,
        "The login account was created, but saving the profile failed. Confirm the admin INSERT policy on user_profiles."
      )
    );
  }
  if (!insert.data) {
    throw new Error(
      "Profile create was blocked by database permissions. In the Supabase SQL editor, add an INSERT policy on user_profiles for admins (public.is_admin())."
    );
  }

  return mapProfileRow(insert.data as Record<string, unknown>);
}

export async function updateUserProfileById(
  userId: string,
  payload: {
    name?: string;
    role?: IUser["role"];
    is_active?: boolean;
    profile_pic?: string;
  }
) {
  const { supabase, actor } = await getAdminClient();
  const current = await getProfileById(supabase, userId);
  const isSelf = current.id === actor.id;

  const updates: Record<string, unknown> = {};
  if (payload.name !== undefined) {
    const name = payload.name.trim();
    if (!name) throw new Error("Name is required.");
    updates.name = name;
  }
  if (payload.profile_pic !== undefined) {
    updates.profile_pic = payload.profile_pic;
  }
  if (payload.role !== undefined) {
    const nextRole = payload.role === "admin" ? "admin" : "user";
    if (isSelf && nextRole !== current.role) {
      throw new Error("You cannot change your own role.");
    }
    if (
      current.role === "admin" &&
      nextRole === "user" &&
      current.is_active !== false
    ) {
      const admins = await countActiveAdmins(supabase);
      if (admins <= 1) {
        throw new Error("There must be at least one active admin.");
      }
    }
    updates.role = nextRole;
  }
  if (payload.is_active !== undefined) {
    if (isSelf && payload.is_active === false) {
      throw new Error("You cannot deactivate your own account.");
    }
    if (
      current.role === "admin" &&
      current.is_active !== false &&
      payload.is_active === false
    ) {
      const admins = await countActiveAdmins(supabase);
      if (admins <= 1) {
        throw new Error("There must be at least one active admin.");
      }
    }
    updates.is_active = payload.is_active;
  }

  if (Object.keys(updates).length === 0) {
    return current;
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .update(updates)
    .eq("id", userId)
    .select(PROFILE_COLUMNS)
    .maybeSingle();
  if (error) {
    throw new Error(getErrorMessage(error, "Failed to update user."));
  }
  if (!data) {
    throw new Error(
      "User update was blocked by database permissions. In the Supabase SQL editor, add an UPDATE policy on user_profiles for admins (public.is_admin())."
    );
  }

  return mapProfileRow(data as Record<string, unknown>);
}

export async function deleteUserProfileById(userId: string) {
  const { supabase, actor } = await getAdminClient();
  const current = await getProfileById(supabase, userId);

  if (current.id === actor.id) {
    throw new Error("You cannot delete your own account.");
  }
  if (current.role === "admin" && current.is_active !== false) {
    const admins = await countActiveAdmins(supabase);
    if (admins <= 1) {
      throw new Error("There must be at least one active admin.");
    }
  }

  const { error, data } = await supabase
    .from("user_profiles")
    .delete()
    .eq("id", userId)
    .select("id")
    .maybeSingle();
  if (error) {
    throw new Error(getErrorMessage(error, "Failed to delete user."));
  }
  if (!data) {
    throw new Error(
      "User delete was blocked by database permissions. In the Supabase SQL editor, add a DELETE policy on user_profiles for admins (public.is_admin())."
    );
  }
}