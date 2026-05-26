import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const buildRoleLoginUrl = (req: NextRequest, requiredRole: string, returnUrl: string) => {
  const loginUrl = new URL("/auth/login", req.url);
  loginUrl.searchParams.set("role", requiredRole);
  loginUrl.searchParams.set("returnUrl", returnUrl);
  return loginUrl;
};

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const pathWithQuery = `${req.nextUrl.pathname}${req.nextUrl.search || ""}`;

  // Get access token from cookie
  const accessToken = req.cookies.get("accessToken")?.value;
  const refreshToken = req.cookies.get("refreshToken")?.value;
  const keepMeLoggedIn = req.cookies.get("keepMeLoggedIn")?.value === "true";
  const canAttemptSessionRestore = !accessToken && keepMeLoggedIn && Boolean(refreshToken);

  // Get user role from cookie (set during login)
  let userRole = req.cookies.get("userRole")?.value?.toLowerCase();

  // Decode JWT to extract flags if accessToken exists
  let isVerified = true;
  let schoolId = null;
  if (accessToken) {
    try {
      const base64Url = accessToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const decoded = JSON.parse(jsonPayload);
      if (decoded.isVerified !== undefined) isVerified = decoded.isVerified;
      if (decoded.schoolId !== undefined) schoolId = decoded.schoolId;
      if (!userRole && decoded.role) userRole = decoded.role.toLowerCase();
    } catch (e) {
      console.error('Failed to parse token in middleware', e);
    }
  }

  // Define route-to-role mapping
  const routeRoleMap: Record<string, string> = {
    "/admin": "admin",
    "/staff": "staff",
    "/parent": "parent",
  };

  // Check if the path matches any protected route
  for (const [routePrefix, requiredRole] of Object.entries(routeRoleMap)) {
    if (path.startsWith(routePrefix)) {
      // If no token, redirect to login
      if (!accessToken && !canAttemptSessionRestore) {
        const loginUrl = buildRoleLoginUrl(req, requiredRole, pathWithQuery);
        return NextResponse.redirect(loginUrl);
      }

      // If token exists, enforce onboarding steps based on decoded properties
      if (accessToken) {
        if (!isVerified) {
          return NextResponse.redirect(new URL('/auth/verify-email', req.url));
        }

        if (!schoolId && requiredRole === "admin") {
          return NextResponse.redirect(new URL('/auth/create-school-account', req.url));
        }
      }

      // Missing role cookie: route user to role selection so they can establish role context.
      if (!userRole && !canAttemptSessionRestore) {
        const loginUrl = buildRoleLoginUrl(req, requiredRole, pathWithQuery);
        return NextResponse.redirect(loginUrl);
      }

      // Role cookie is used as a routing hint; mismatched role remains concealed with 404.
      if (userRole !== requiredRole) {
        // Return 404 so unauthorized users don't know the route exists
        return new NextResponse(null, { status: 404 });
      }

      // Role matches, allow access
      return NextResponse.next();
    }
  }

  // If path doesn't match any protected route, allow access
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/staff/:path*", "/parent/:path*"],
};
