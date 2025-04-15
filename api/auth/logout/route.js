import express from "express";

const router = express.Router();

// POST /api/auth/logout - Log out the user
router.post("/", async (req, res) => {
  try {
    // Clear the token cookie by setting it to an empty value and an expired date
    res.cookie("token", "", {
      httpOnly: true,
      expires: new Date(0), // Expire the cookie immediately
      path: "/", // Ensure the cookie is cleared for all paths
    });

    res.status(200).json({ message: "User logged out" });
  } catch (error) {
    console.error("Error logging out user", error);
    res.status(500).json({ message: "Error logging out user" });
  }
});

export default router;
