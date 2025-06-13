import { createSupabaseServerInstance } from "@/db/supabase.client";
import { defineMiddleware } from "astro:middleware";

// Public paths that don't require authentication
const PUBLIC_PATHS = ["/", "/login", "/register", "/api/auth/login", "/api/auth/register"];

// Paths that an authenticated user should not access
const AUTH_ONLY_PATHS = ["/login", "/register"];

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (user) {
    locals.user = {
      email: user.email!,
      id: user.id,
    };
  } else {
    locals.user = null;
  }
  
  // For Astro type-safety
  locals.supabase = supabase;

  if (!user && !PUBLIC_PATHS.includes(url.pathname)) {
    // If user is not logged in and tries to access a protected route
    return redirect("/login");
  }

  if (user && AUTH_ONLY_PATHS.includes(url.pathname)) {
    // If user is logged in and tries to access login or register page
    return redirect("/app/dashboard");
  }

  return next();
});
