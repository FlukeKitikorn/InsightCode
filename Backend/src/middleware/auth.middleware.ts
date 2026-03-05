import { Request, Response, NextFunction } from "express"
import { verifyAccessToken, JwtPayload } from "../lib/jwt.js"

// ─── Extend Express Request ────────────────────────────────────
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

// ─── Authenticate Middleware ───────────────────────────────────
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.log.warn(
      { path: req.path, ip: req.ip },
      "Access token missing"
    )

    res.status(401).json({ message: "Access token missing" })
    return
  }

  const token = authHeader.split(" ")[1]

  try {
    const payload = verifyAccessToken(token)

    req.user = payload

    req.log.debug(
      { userId: payload.userId, role: payload.role },
      "User authenticated"
    )

    next()
  } catch (error) {
    req.log.warn(
      { path: req.path, ip: req.ip },
      "Invalid or expired access token"
    )

    res.status(401).json({
      message: "Invalid or expired access token",
    })
  }
}

// ─── Authorize Middleware (Role-based) ────────────────────────
export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      req.log.warn(
        { path: req.path },
        "Unauthorized access attempt"
      )

      res.status(401).json({ message: "Unauthorized" })
      return
    }

    if (!roles.includes(req.user.role)) {
      req.log.warn(
        {
          userId: req.user.userId,
          role: req.user.role,
          requiredRoles: roles,
        },
        "Forbidden: insufficient permissions"
      )

      res
        .status(403)
        .json({ message: "Forbidden: insufficient permissions" })
      return
    }

    next()
  }
}