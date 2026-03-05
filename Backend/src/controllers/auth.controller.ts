import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import {
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
    REFRESH_COOKIE_OPTIONS,
} from "../lib/jwt.js";

const SALT_ROUNDS = 12;
const ADMIN_SECRET_CODE = process.env.ADMIN_SECRET_CODE;

function buildUserResponse(user: {
    id: string;
    email: string;
    role: string;
    createdAt: Date;
    fullName: string | null;
    avatarUrl: string | null;
}) {
    return {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
    };
}

// ─── REGISTER ─────────────────────────────────────────────────
export async function register(req: Request, res: Response): Promise<void> {
    try {
        const { email, password, fullName } = req.body as {
            email?: string;
            password?: string;
            fullName?: string;
        };

        // Validate input
        if (!email || !password) {
            res.status(400).json({ message: "Email and password are required" });
            return;
        }

        if (password.length < 8) {
            res.status(400).json({ message: "Password must be at least 8 characters" });
            return;
        }

        // Check existing user
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(409).json({ message: "Email already registered" });
            return;
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        // Create user (role จะเป็น USER เสมอจาก default)
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                fullName: fullName || null,
                // avatarUrl สามารถไปอัพเดททีหลังได้
            },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                fullName: true,
                avatarUrl: true,
            },
        });

        // Sign tokens
        const payload = { userId: user.id, email: user.email, role: user.role };
        const accessToken = signAccessToken(payload);
        const refreshToken = signRefreshToken(payload);

        // Store refresh token in DB
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 วัน
        await prisma.refreshToken.create({
            data: { token: refreshToken, userId: user.id, expiresAt },
        });

        // Set refresh token as HttpOnly Cookie
        res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);

        req.log.info({ userId: user.id, email: user.email }, "User registered");

        res.status(201).json({
            message: "Registration successful",
            accessToken,
            user: buildUserResponse(user),
        });
    } catch (error) {
        req.log.error({ err: error }, "[register] failed");
        res.status(500).json({ message: "Internal server error" });
    }
}

// ─── LOGIN ────────────────────────────────────────────────────
export async function login(req: Request, res: Response): Promise<void> {
    try {
        const { email, password } = req.body as {
            email?: string;
            password?: string;
        };

        if (!email || !password) {
            res.status(400).json({ message: "Email and password are required" });
            return;
        }

        // Find user
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(401).json({ message: "Invalid email or password" });
            return;
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            res.status(401).json({ message: "Invalid email or password" });
            return;
        }

        // Sign tokens
        const payload = { userId: user.id, email: user.email, role: user.role };
        const accessToken = signAccessToken(payload);
        const refreshToken = signRefreshToken(payload);
        console.log(refreshToken);

        // Store refresh token in DB
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await prisma.refreshToken.create({
            data: { token: refreshToken, userId: user.id, expiresAt },
        });

        // Set HttpOnly Cookie
        res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);

        req.log.info({ userId: user.id, email: user.email }, "User logged in");

        res.json({
            message: "Login successful",
            accessToken,
            user: buildUserResponse(user),
        });
    } catch (error) {
        req.log.error({ err: error }, "[login] failed");
        res.status(500).json({ message: "Internal server error" });
    }
}

// ─── ADMIN LOGIN (ต้องมีรหัสพิเศษ) ─────────────────────────────
export async function adminLogin(req: Request, res: Response): Promise<void> {
    try {
        const { email, password, adminCode } = req.body as {
            email?: string;
            password?: string;
            adminCode?: string;
        };
        console.log(email);

        if (!email || !password || !adminCode) {
            res.status(400).json({ message: "Email, password and admin code are required" });
            return;
        }

        if (!ADMIN_SECRET_CODE) {
            res.status(500).json({ message: "Admin login not configured" });
            return;
        }

        if (adminCode !== ADMIN_SECRET_CODE) {
            res.status(401).json({ message: "Invalid admin code" });
            return;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(401).json({ message: "Invalid email or password" });
            return;
        }

        if (user.role !== "ADMIN") {
            res.status(403).json({ message: "User is not an admin" });
            return;
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            res.status(401).json({ message: "Invalid email or password" });
            return;
        }

        const payload = { userId: user.id, email: user.email, role: user.role };
        const accessToken = signAccessToken(payload);
        const refreshToken = signRefreshToken(payload);

        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await prisma.refreshToken.create({
            data: { token: refreshToken, userId: user.id, expiresAt },
        });

        res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);

        req.log.info({ userId: user.id, email: user.email }, "Admin login successful");

        res.json({
            message: "Admin login successful",
            accessToken,
            user: buildUserResponse(user),
        });
    } catch (error) {
        req.log.error({ err: error }, "[adminLogin] failed");
        res.status(500).json({ message: "Internal server error" });
    }
}

// ─── REFRESH TOKEN ────────────────────────────────────────────
export async function refresh(req: Request, res: Response): Promise<void> {
    try {
        const token = req.cookies?.refreshToken;

        if (!token) {
            res.status(401).json({ message: "Refresh token missing" });
            return;
        }

        // Verify JWT signature
        let payload;
        try {
            payload = verifyRefreshToken(token);
        } catch {
            res.status(401).json({ message: "Invalid or expired refresh token" });
            return;
        }

        // Check in DB (ยัง valid และยังไม่ถูก revoke)
        const storedToken = await prisma.refreshToken.findUnique({
            where: { token },
        });

        if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
            res.clearCookie("refreshToken", { path: "/api/auth" });
            res.status(401).json({ message: "Refresh token revoked or expired" });
            return;
        }

        // Rotate: revoke old token
        await prisma.refreshToken.update({
            where: { token },
            data: { revoked: true },
        });

        // Issue new tokens
        const newPayload = { userId: payload.userId, email: payload.email, role: payload.role };
        const newAccessToken = signAccessToken(newPayload);
        const newRefreshToken = signRefreshToken(newPayload);

        // Store new refresh token
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await prisma.refreshToken.create({
            data: { token: newRefreshToken, userId: payload.userId, expiresAt },
        });

        req.log.info(
          { userId: payload.userId, oldToken: token },
          "Refresh token rotated"
        );

        res.cookie("refreshToken", newRefreshToken, REFRESH_COOKIE_OPTIONS);

        res.json({ accessToken: newAccessToken });
    } catch (error) {
        req.log.error({ err: error }, "[refresh] failed");
        res.status(500).json({ message: "Internal server error" });
    }
}

// ─── LOGOUT ───────────────────────────────────────────────────
export async function logout(req: Request, res: Response): Promise<void> {
    try {
        const token = req.cookies?.refreshToken;

        if (token) {
            // Revoke token in DB
            await prisma.refreshToken.updateMany({
                where: { token },
                data: { revoked: true },
            });
        }

        res.clearCookie("refreshToken", { path: "/api/auth" });
        req.log.info({ token }, "User logged out");
        res.json({ message: "Logged out successfully" });
    } catch (error) {
        req.log.error({ err: error }, "[logout] failed");
        res.status(500).json({ message: "Internal server error" });
    }
}

// ─── GET ME ───────────────────────────────────────────────────
export async function getMe(req: Request, res: Response): Promise<void> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                fullName: true,
                avatarUrl: true,
            },
        });

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        res.json({ user: buildUserResponse(user) });
    } catch (error) {
        req.log.error({ err: error }, "[getMe] failed");
        res.status(500).json({ message: "Internal server error" });
    }
}
