import request from "supertest";
import express from "express";
import bcrypt from "bcrypt";
import router from "../auth/signup/route.js";
import dbConnect from "../../lib/dbconnect.js";
import User from "../../models/user.js";

jest.mock("../../lib/dbconnect.js");
jest.mock("../../models/user.js");
jest.mock("bcrypt");

beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  console.error.mockRestore();
});

const app = express();
app.use(express.json());
app.use("/", router); // The router is already mounted at /api/auth/signup

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    bcrypt.hash.mockResolvedValue("hashed_password");
  });

  it("should register a new user successfully", async () => {
    dbConnect.mockResolvedValueOnce();
    User.findOne.mockResolvedValueOnce(null);
    
    const mockUser = {
      name: "John Doe",
      email: "john@example.com",
      password: "hashed_password",
      _id: "645c1234567890abcdef1234",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      __v: 0
    };
    
    User.create.mockResolvedValueOnce(mockUser);

    const response = await request(app)
      .post("/")
      .send({ name: "John Doe", email: "john@example.com", password: "password123" });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("User registered");
    expect(response.body.user).toHaveProperty("name", "John Doe");
  });

  it("should return 400 if required fields are missing", async () => {
    const response = await request(app)
      .post("/")
      .send({ email: "john@example.com", password: "password123" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("All fields are required");
  });

  it("should return 400 if the user already exists", async () => {
    dbConnect.mockResolvedValueOnce();
    User.findOne.mockResolvedValueOnce({ email: "john@example.com" });

    const response = await request(app)
      .post("/")
      .send({ name: "John Doe", email: "john@example.com", password: "password123" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("User already exists");
  });

  it("should return 500 for internal server errors", async () => {
    dbConnect.mockResolvedValueOnce();
    User.findOne.mockRejectedValueOnce(new Error("Database error"));

    const response = await request(app)
      .post("/")
      .send({ name: "John Doe", email: "john@example.com", password: "password123" });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe("Internal Server Error");
  });
});