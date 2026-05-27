import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const buildRoleLoginUrl = (req: NextRequest, requiredRole: string, returnUrl: string) => {
  const loginUrl = new URL("/auth/login", req.url);
  loginUrl.searchParams.set("role", requiredRole);
  loginUrl.searchParams.set("returnUrl", returnUrl);
  return loginUrl;
};

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const pathWithQuery = `${req.nextUrl.pathname}${req.nextUrl.search || ""}`;

  // Use next-auth/jwt to get the token directly from cookies
  const token = await getToken({ req });

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
      if (!token) {
        const loginUrl = buildRoleLoginUrl(req, requiredRole, pathWithQuery);
        return NextResponse.redirect(loginUrl);
      }

      // If token exists, enforce onboarding steps based on decoded properties
      if (token.emailVerified === false) {
        return NextResponse.redirect(new URL('/auth/verify-email', req.url));
      }

      if (token.emailVerified === true && !token.schoolId && requiredRole === "admin") {
        return NextResponse.redirect(new URL('/auth/create-school-account', req.url));
      }

      // Ensure that user Role is obtained via token
      const userRole = (token.role as string)?.toLowerCase();

      // Missing role in token: route user to role selection so they can establish role context.
      if (!userRole) {
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
