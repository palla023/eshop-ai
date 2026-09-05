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