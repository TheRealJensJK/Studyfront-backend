import request from "supertest";
import express from "express";
import { ObjectId } from "mongodb";
import router from "../studies/idRoute.js";
import dbConnect from "../../lib/dbconnect.js";
import Study from "../../models/study.js";

jest.mock("../../lib/dbconnect.js");
jest.mock("../../models/study.js");

beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

const app = express();
app.use(express.json());
app.use("/api/studies", router);

describe("Studies API by ID", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/studies/:id", () => {
    it("should fetch a study by ID successfully", async () => {
      dbConnect.mockResolvedValueOnce();
      const mockStudy = { _id: "645c1234567890abcdef1234", title: "Study 1", description: "Description of Study 1" };
      Study.findById = jest.fn().mockResolvedValueOnce(mockStudy);

      const response = await request(app).get(`/api/studies/${mockStudy._id}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockStudy);
    });

    it("should return 400 for an invalid study ID", async () => {
      const invalidId = "invalid-id";

      const response = await request(app).get(`/api/studies/${invalidId}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid study ID");
    });

    it("should return 404 if the study is not found", async () => {
      dbConnect.mockResolvedValueOnce();
      const validId = "645c1234567890abcdef1234";
      Study.findById = jest.fn().mockResolvedValueOnce(null);

      const response = await request(app).get(`/api/studies/${validId}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Study not found");
    });

    it("should return 500 if fetching the study fails", async () => {
      dbConnect.mockResolvedValueOnce();
      const validId = "645c1234567890abcdef1234";
      Study.findById = jest.fn().mockRejectedValueOnce(new Error("Database error"));

      const response = await request(app).get(`/api/studies/${validId}`);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Failed to fetch study");
    });
  });

  describe("DELETE /api/studies/:id", () => {
    it("should delete a study by ID successfully", async () => {
      dbConnect.mockResolvedValueOnce();
      const mockStudy = { _id: "645c1234567890abcdef1234", title: "Study 1", description: "Description of Study 1" };
      Study.findByIdAndDelete = jest.fn().mockResolvedValueOnce(mockStudy);

      const response = await request(app).delete(`/api/studies/${mockStudy._id}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Study deleted successfully");
    });

    it("should return 400 for an invalid study ID", async () => {
      const invalidId = "invalid-id";

      const response = await request(app).delete(`/api/studies/${invalidId}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid study ID");
    });

    it("should return 404 if the study is not found", async () => {
      dbConnect.mockResolvedValueOnce();
      const validId = "645c1234567890abcdef1234";
      Study.findByIdAndDelete = jest.fn().mockResolvedValueOnce(null);

      const response = await request(app).delete(`/api/studies/${validId}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Study not found");
    });

    it("should return 500 if deleting the study fails", async () => {
      dbConnect.mockResolvedValueOnce();
      const validId = "645c1234567890abcdef1234";
      Study.findByIdAndDelete = jest.fn().mockRejectedValueOnce(new Error("Database error"));

      const response = await request(app).delete(`/api/studies/${validId}`);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Failed to delete study");
    });
  });

  describe("PUT /api/studies/:id", () => {
    it("should update a study by ID successfully", async () => {
      dbConnect.mockResolvedValueOnce();
      const mockStudy = { _id: "645c1234567890abcdef1234", questions: ["Question 1", "Question 2"] };
      Study.findByIdAndUpdate = jest.fn().mockResolvedValueOnce(mockStudy);

      const response = await request(app)
        .put(`/api/studies/${mockStudy._id}`)
        .send({ questions: ["Question 1", "Question 2"] });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockStudy);
    });

    it("should return 400 for an invalid study ID", async () => {
      const invalidId = "invalid-id";

      const response = await request(app).put(`/api/studies/${invalidId}`).send({ questions: ["Question 1"] });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid study ID");
    });

    it("should return 404 if the study is not found", async () => {
      dbConnect.mockResolvedValueOnce();
      const validId = "645c1234567890abcdef1234";
      Study.findByIdAndUpdate = jest.fn().mockResolvedValueOnce(null);

      const response = await request(app)
        .put(`/api/studies/${validId}`)
        .send({ questions: ["Question 1"] });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Study not found");
    });

    it("should return 500 if updating the study fails", async () => {
      dbConnect.mockResolvedValueOnce();
      const validId = "645c1234567890abcdef1234";
      Study.findByIdAndUpdate = jest.fn().mockRejectedValueOnce(new Error("Database error"));

      const response = await request(app)
        .put(`/api/studies/${validId}`)
        .send({ questions: ["Question 1"] });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Failed to update study questions");
    });
  });
});