import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const publicRoutes = [
  "/auth/register",
  "/auth/login",
  "/",
  "/home",
  "/listing",
  "/cart",
  "/wishlist",
  "/deals",
  "/new-arrivals",
  "/about",
  "/contact",
];
const protectedRoutes = ["/checkout", "/account", "/order-success"];
const superAdminRoutes = ["/super-admin", "/super-admin/:path*"];

export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("accessToken")?.value;
  const { pathname } = request.nextUrl;

  // Check if route is a public route (accessible without auth)
  const isPublicRoute =
    publicRoutes.includes(pathname) ||
    pathname.startsWith("/listing/") ||
    pathname === "/";

  // Check if route is protected (requires auth)
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if route is super admin route
  const isSuperAdminRoute = superAdminRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (accessToken) {
    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        console.error("JWT_SECRET is not set");
        throw new Error("JWT_SECRET is not configured");
      }
      
      const { payload } = await jwtVerify(
        accessToken,
        new TextEncoder().encode(jwtSecret)
      );
      const { role } = payload as {
        role: string;
      };

      // If authenticated user tries to access login/register, redirect them
      if (pathname === "/auth/login" || pathname === "/auth/register") {
        return NextResponse.redirect(
          new URL(
            role === "SUPER_ADMIN" ? "/super-admin" : "/home",
            request.url
          )
        );
      }

      // Super admin should not access user routes
      if (
        role === "SUPER_ADMIN" &&
        (pathname === "/home" || pathname === "/")
      ) {
        return NextResponse.redirect(new URL("/super-admin", request.url));
      }

      // Regular users should not access super admin routes
      if (role !== "SUPER_ADMIN" && isSuperAdminRoute) {
        return NextResponse.redirect(new URL("/home", request.url));
      }

      return NextResponse.next();
    } catch (e) {
      console.error("Token verification failed", e);
      
      // Token verification failed - clear tokens and redirect if needed
      const response = NextResponse.next();
      response.cookies.delete("accessToken");
      response.cookies.delete("refreshToken");
      
      // If trying to access protected route, redirect to login
      if (isProtectedRoute || isSuperAdminRoute) {
        return NextResponse.redirect(new URL("/auth/login", request.url));
      }
      
      return response;
    }
  }

  // No access token - check if route requires authentication
  if (isProtectedRoute || isSuperAdminRoute) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Allow access to public routes
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
