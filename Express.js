import dotenv from "dotenv";
import express from "express";
import jwt from "jsonwebtoken";
import cors from "cors";
import signupRoute from "./api/auth/signup/route.js";
import loginRoute from "./api/auth/login/route.js";
import logoutRoute from "./api/auth/logout/route.js";
import studiesRoute from "./api/studies/route.js";
import studyCreationRoute from "./api/studyCreation/route.js";
import idRoute from "./api/studies/idRoute.js";
import questionsRoute from "./api/studies/questionsRoute.js";
import uploadRoute from "./api/upload/route.js";
import usersRoute from "./api/users/route.js";
import { authMiddleware } from "./middleware/authMiddleware.js";
import resultsRouter from './api/studies/results.js';
import responsesRoute from "./api/responses/route.js";

dotenv.config({ path:"./.env" }); // Load environment variables

const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());

// Middleware
app.use(cors({
  origin: "http://localhost:3000", // Allow requests from the frontend
  credentials: true, // Allow cookies and credentials
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Dashboard Route
app.get('/dashboard', authMiddleware , (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify the token
    res.json({ message: 'Welcome to the dashboard!', user: decoded });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token', error });
  }
});

// Signup Route
app.use("/api/auth", signupRoute);

app.use("/api/auth/logout", logoutRoute);

app.use("/api/studies", studiesRoute);

app.use("/api/studyCreation", studyCreationRoute);

app.use("/api/studies", idRoute);

app.use("/api/studies", questionsRoute);

app.use("/api/upload", uploadRoute);

app.use("/api/users", usersRoute);

// Login Route
app.use("/api/auth", loginRoute);

// results Route
app.use('/api/studies/results', resultsRouter);

// responses Route
app.use("/api/responses", responsesRoute);

// Start the server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);

});