import request from "supertest";
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import router from "../auth/login/route.js";
import dbConnect from "../../lib/dbconnect.js";
import User from "../../models/user.js";

jest.mock("../../lib/dbconnect.js");
jest.mock("../../models/user.js");
jest.mock("bcrypt");
jest.mock("jsonwebtoken");

const app = express();
app.use(express.json());
app.use("/api/auth", router);

beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  console.error.mockRestore();
});

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should log in a user successfully and return a token", async () => {
    dbConnect.mockResolvedValueOnce();
    const mockUser = { _id: "645c1234567890abcdef1234", email: "test@example.com", password: "hashedpassword" };
    User.findOne.mockResolvedValueOnce(mockUser);
    bcrypt.compare.mockResolvedValueOnce(true);
    jwt.sign.mockReturnValueOnce("mocked-jwt-token");

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "password123" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("User logged in");
    expect(response.body.token).toBe("mocked-jwt-token");
    expect(response.header.authorization).toBe("Bearer mocked-jwt-token");
  });

  it("should return 400 if email or password is missing", async () => {
    const response = await request(app).post("/api/auth/login").send({ email: "test@example.com" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Missing fields");
  });

  it("should return 404 if the user is not found", async () => {
    dbConnect.mockResolvedValueOnce();
    User.findOne.mockResolvedValueOnce(null);

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "password123" });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("User not found");
  });

  it("should return 401 if the password is incorrect", async () => {
    dbConnect.mockResolvedValueOnce();
    const mockUser = { _id: "645c1234567890abcdef1234", email: "test@example.com", password: "hashedpassword" };
    User.findOne.mockResolvedValueOnce(mockUser);
    bcrypt.compare.mockResolvedValueOnce(false);

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "wrongpassword" });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid credentials");
  });

  it("should return 500 if an error occurs during login", async () => {
    dbConnect.mockResolvedValueOnce();
    User.findOne.mockRejectedValueOnce(new Error("Database error"));

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "password123" });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Error logging in user");
  });
});