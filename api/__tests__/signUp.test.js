import request from "supertest";
import express from "express";
import bcrypt from "bcrypt";
import router from "../auth/signup/route.js";
import dbConnect from "../../lib/dbconnect.js";
import User from "../../models/user.js";

jest.mock("../../lib/dbconnect.js");
jest.mock("../../models/user.js");

beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  console.error.mockRestore();
});

const app = express();
app.use(express.json());
app.use("/api/auth", router);

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should register a new user successfully", async () => {
    dbConnect.mockResolvedValueOnce();
    User.findOne.mockResolvedValueOnce(null);
    User.create.mockResolvedValueOnce({
      name: "John Doe",
      email: "john@example.com",
      password: await bcrypt.hash("password123", 10),
    });

    const response = await request(app)
      .post("/api/auth/signup")
      .send({ name: "John Doe", email: "john@example.com", password: "password123" });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("User registered");
    expect(response.body.user).toHaveProperty("name", "John Doe");
    expect(response.body.user).toHaveProperty("email", "john@example.com");
  });

  it("should return 400 if required fields are missing", async () => {
    const response = await request(app)
      .post("/api/auth/signup")
      .send({ email: "john@example.com", password: "password123" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("All fields are required");
  });

  it("should return 400 if the user already exists", async () => {
    dbConnect.mockResolvedValueOnce();
    User.findOne.mockResolvedValueOnce({ email: "john@example.com" });

    const response = await request(app)
      .post("/api/auth/signup")
      .send({ name: "John Doe", email: "john@example.com", password: "password123" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("User already exists");
  });

  it("should return 500 for internal server errors", async () => {
    dbConnect.mockResolvedValueOnce();
    User.findOne.mockRejectedValueOnce(new Error("Database error"));

    const response = await request(app)
      .post("/api/auth/signup")
      .send({ name: "John Doe", email: "john@example.com", password: "password123" });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe("Internal Server Error");
  });
});