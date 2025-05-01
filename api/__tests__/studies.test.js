import request from "supertest";
import express from "express";
import router from "../studies/route.js";
import dbConnect from "../../lib/dbconnect.js";
import Study from "../../models/study.js";

jest.mock("../../lib/dbconnect.js");
jest.mock("../../models/study.js");

beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  console.error.mockRestore();
});

const app = express();
app.use(express.json());
app.use("/api/studies", router);

describe("Studies API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/studies", () => {
    it("should create a new study successfully", async () => {
      dbConnect.mockResolvedValueOnce();
      const mockStudy = { title: "Study 1", description: "Description of Study 1" };
      Study.prototype.save = jest.fn().mockResolvedValueOnce(mockStudy);

      const response = await request(app)
        .post("/api/studies")
        .send(mockStudy);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockStudy);
    });

    it("should return 500 if study creation fails", async () => {
      dbConnect.mockResolvedValueOnce();
      Study.prototype.save = jest.fn().mockRejectedValueOnce(new Error("Database error"));

      const response = await request(app)
        .post("/api/studies")
        .send({ title: "Study 1", description: "Description of Study 1" });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Failed to create study");
    });
  });

  describe("GET /api/studies", () => {
    it("should fetch all studies successfully", async () => {
      dbConnect.mockResolvedValueOnce();
      const mockStudies = [
        { title: "Study 1", description: "Description of Study 1" },
        { title: "Study 2", description: "Description of Study 2" },
      ];
      Study.find = jest.fn().mockResolvedValueOnce(mockStudies);

      const response = await request(app).get("/api/studies");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockStudies);
    });

    it("should return 500 if fetching studies fails", async () => {
      dbConnect.mockResolvedValueOnce();
      Study.find = jest.fn().mockRejectedValueOnce(new Error("Database error"));

      const response = await request(app).get("/api/studies");

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Failed to fetch studies");
    });
  });
});