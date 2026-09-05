import { type NextRequest, NextResponse } from "next/server";
import {
  copyAuthCookies,
  createProxySupabaseClient,
} from "@/config/supabase-proxy-config";

const PUBLIC_ROUTES = new Set(["/", "/login", "/register"]);

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.has(pathname);
}

export async function proxy(request: NextRequest) {
  const { supabase, getResponse } = createProxySupabaseClient(request);

  // Validate the JWT instead of trusting getSession() from cookies.
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims);
  const pathname = request.nextUrl.pathname;

  if (!isPublicRoute(pathname) && !isAuthenticated) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);

    return copyAuthCookies(getResponse(), NextResponse.redirect(loginUrl));
  }

  return getResponse();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
