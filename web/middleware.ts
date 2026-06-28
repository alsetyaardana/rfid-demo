import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  let mode = requestHeaders.get('x-demo-mode');
  if (!mode) {
    const cookieMode = request.cookies.get('demoMode')?.value;
    if (cookieMode === 'SIMULATION' || cookieMode === 'HARDWARE') {
      mode = cookieMode;
    }
  }

  if (mode) {
    requestHeaders.set('x-demo-mode', mode);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
