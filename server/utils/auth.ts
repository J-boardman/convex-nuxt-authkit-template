import { WorkOS } from "@workos-inc/node";
import * as ironWebcrypto from "iron-webcrypto";
import type { H3Event } from "h3";

export interface SessionUser {
  id: string;
  email: string;
  emailVerified: boolean;
  profilePictureUrl: string | null;
  firstName: string | null;
  lastName: string | null;
  object: "user";
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
  expiresAt: number;
}

const COOKIE_NAME = "wos-session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 400; // 400 days

let _workos: WorkOS | null = null;

export function getWorkOS(): WorkOS {
  if (!_workos) {
    const config = useRuntimeConfig();
    _workos = new WorkOS(config.workosApiKey as string, {
      clientId: config.workosClientId as string,
    });
  }
  return _workos;
}

export function getWorkOSClientId(): string {
  return useRuntimeConfig().workosClientId as string;
}

function getCookiePassword(): string {
  const password = useRuntimeConfig().workosCookiePassword as string;
  if (!password || password.length < 32) {
    throw new Error(
      "WORKOS_COOKIE_PASSWORD must be at least 32 characters long"
    );
  }
  return password;
}

async function sealSession(session: Session): Promise<string> {
  return ironWebcrypto.seal(session, getCookiePassword(), {
    ...ironWebcrypto.defaults,
    ttl: 0, // no TTL — we manage expiry ourselves
  });
}

async function unsealSession(sealed: string): Promise<Session | null> {
  try {
    return (await ironWebcrypto.unseal(
      sealed,
      getCookiePassword(),
      ironWebcrypto.defaults
    )) as Session;
  } catch {
    return null;
  }
}

export async function getSession(event: H3Event): Promise<Session | null> {
  const cookie = getCookie(event, COOKIE_NAME);
  if (!cookie) return null;

  const session = await unsealSession(cookie);
  if (!session) return null;

  // If token is expired, try to refresh
  if (session.expiresAt <= Date.now()) {
    try {
      const workos = getWorkOS();
      const { accessToken, refreshToken } =
        await workos.userManagement.authenticateWithRefreshToken({
          refreshToken: session.refreshToken,
        });

      // Decode new expiry from JWT
      const jwtParts = accessToken.split(".");
      const payload = JSON.parse(
        Buffer.from(jwtParts[1]!, "base64url").toString()
      );

      const refreshedSession: Session = {
        ...session,
        accessToken,
        refreshToken,
        expiresAt: payload.exp * 1000,
      };

      await setSession(event, refreshedSession);
      return refreshedSession;
    } catch {
      // Refresh failed — clear session
      clearSessionCookie(event);
      return null;
    }
  }

  return session;
}

export async function setSession(
  event: H3Event,
  session: Session
): Promise<void> {
  const sealed = await sealSession(session);
  setCookie(event, COOKIE_NAME, sealed, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export function clearSessionCookie(event: H3Event): void {
  deleteCookie(event, COOKIE_NAME, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });
}
