import express from "express";

const router = express.Router();

// GET /api/auth/me - Verify current authentication state
router.get("/me", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
  }

  const token = authHeader.split(" ")[1];
  if (token === "gor_admin_token_2026" || token === "demo_admin_token") {
    return res.status(200).json({
      success: true,
      user: {
        id: "usr_admin",
        name: "Admin",
        email: "admin@gormenswear.com",
        role: "admin",
      },
    });
  }

  return res.status(401).json({
    success: false,
    message: "Invalid or expired session token",
  });
});

// POST /api/auth/login - Admin Login
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (email === "admin@gormenswear.com" && (password === "admin123" || password === "gor2026")) {
    return res.status(200).json({
      success: true,
      token: "gor_admin_token_2026",
      user: {
        id: "usr_admin",
        name: "Admin",
        email: "admin@gormenswear.com",
        role: "admin",
      },
    });
  }

  // Fallback demo login for any valid formatted request
  if (email && password && password.length >= 6) {
    return res.status(200).json({
      success: true,
      token: "gor_admin_token_2026",
      user: {
        id: "usr_admin",
        name: email.split("@")[0] || "User",
        email,
        role: "admin",
      },
    });
  }

  return res.status(400).json({
    success: false,
    error: "Invalid email or password",
  });
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

export default router;
