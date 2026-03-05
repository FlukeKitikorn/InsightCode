import "dotenv/config";
import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

export interface JwtPayload {
    userId: string;
    email: string;
    role: string;
}

// ─── Access Token ──────────────────────────────────────────────
export function signAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, ACCESS_SECRET, {
        expiresIn: ACCESS_EXPIRES,
    } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
}

// ─── Refresh Token ─────────────────────────────────────────────
export function signRefreshToken(payload: JwtPayload): string {
    return jwt.sign(payload, REFRESH_SECRET, {
        expiresIn: REFRESH_EXPIRES,
    } as jwt.SignOptions);
}

export function verifyRefreshToken(token: string): JwtPayload {
    return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
}

// ─── Cookie Config ─────────────────────────────────────────────
export const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true, // ป้องกัน XSS (JavaScript อ่านไม่ได้)
    secure: process.env.NODE_ENV === "production", // HTTPS only ใน production
    sameSite: "strict" as const, // ป้องกัน CSRF
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 วัน (milliseconds)
    path: "/api/auth", // จำกัด cookie ให้ใช้แค่ auth routes
};
