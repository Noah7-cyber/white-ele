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
  const userRole = req.cookies.get("userRole")?.value?.toLowerCase();

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
