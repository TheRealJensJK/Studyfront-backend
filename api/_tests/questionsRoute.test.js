import request from "supertest";
import express from "express";
import router from "../studies/questionsRoute.js";
import dbConnect from "../../lib/dbconnect.js";
import Study from "../../models/study.js";

jest.mock("../../lib/dbconnect.js");
jest.mock("../../models/study.js");

const app = express();
app.use(express.json());
app.use("/api/studies", router);

beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  console.error.mockRestore();
});

describe("Questions API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/studies/:id/questions", () => {
    it("should add a new question to a study", async () => {
      dbConnect.mockResolvedValueOnce();
      const mockStudy = { _id: "645c1234567890abcdef1234", questions: [] };
      Study.findByIdAndUpdate = jest.fn().mockResolvedValueOnce({
        ...mockStudy,
        questions: [{ _id: "645c1234567890abcdef5678", type: "text", data: "Sample question" }],
      });

      const response = await request(app)
        .post(`/api/studies/${mockStudy._id}/questions`)
        .send({ type: "text", data: "Sample question" });

      expect(response.status).toBe(201);
      expect(response.body.questions).toHaveLength(1);
      expect(response.body.questions[0]).toHaveProperty("type", "text");
    });

    it("should return 400 if type or data is missing", async () => {
      const response = await request(app)
        .post(`/api/studies/645c1234567890abcdef1234/questions`)
        .send({ type: "text" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Type and data are required");
    });

    it("should return 404 if the study is not found", async () => {
      dbConnect.mockResolvedValueOnce();
      Study.findByIdAndUpdate = jest.fn().mockResolvedValueOnce(null);

      const response = await request(app)
        .post(`/api/studies/645c1234567890abcdef1234/questions`)
        .send({ type: "text", data: "Sample question" });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Study not found");
    });

    it("should return 500 if adding a question fails", async () => {
      dbConnect.mockResolvedValueOnce();
      Study.findByIdAndUpdate = jest.fn().mockRejectedValueOnce(new Error("Database error"));

      const response = await request(app)
        .post(`/api/studies/645c1234567890abcdef1234/questions`)
        .send({ type: "text", data: "Sample question" });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Failed to add the question");
    });
  });

  describe("PUT /api/studies/:id/questions/:questionId", () => {
    it("should update a question in a study", async () => {
      dbConnect.mockResolvedValueOnce();
      const mockStudy = {
        _id: "645c1234567890abcdef1234",
        questions: [{ _id: "645c1234567890abcdef5678", type: "text", data: "Old question" }],
      };
      Study.findOneAndUpdate = jest.fn().mockResolvedValueOnce({
        ...mockStudy,
        questions: [{ _id: "645c1234567890abcdef5678", type: "text", data: "Updated question" }],
      });

      const response = await request(app)
        .put(`/api/studies/${mockStudy._id}/questions/645c1234567890abcdef5678`)
        .send({ data: "Updated question" });

      expect(response.status).toBe(200);
      expect(response.body.questions[0]).toHaveProperty("data", "Updated question");
    });

    it("should return 404 if the question is not found", async () => {
      dbConnect.mockResolvedValueOnce();
      Study.findOneAndUpdate = jest.fn().mockResolvedValueOnce(null);

      const response = await request(app)
        .put(`/api/studies/645c1234567890abcdef1234/questions/645c1234567890abcdef5678`)
        .send({ data: "Updated question" });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Question not found");
    });

    it("should return 500 if updating the question fails", async () => {
      dbConnect.mockResolvedValueOnce();
      Study.findOneAndUpdate = jest.fn().mockRejectedValueOnce(new Error("Database error"));

      const response = await request(app)
        .put(`/api/studies/645c1234567890abcdef1234/questions/645c1234567890abcdef5678`)
        .send({ data: "Updated question" });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Failed to update the question");
    });
  });

  describe("DELETE /api/studies/:id/questions/:questionId", () => {
    it("should delete a question from a study", async () => {
      dbConnect.mockResolvedValueOnce();
      const mockStudy = {
        _id: "645c1234567890abcdef1234",
        questions: [{ _id: "645c1234567890abcdef5678", type: "text", data: "Sample question" }],
      };
      Study.findByIdAndUpdate = jest.fn().mockResolvedValueOnce({
        ...mockStudy,
        questions: [],
      });

      const response = await request(app).delete(`/api/studies/${mockStudy._id}/questions/645c1234567890abcdef5678`);

      expect(response.status).toBe(200);
      expect(response.body.questions).toHaveLength(0);
    });

    it("should return 404 if the question is not found", async () => {
      dbConnect.mockResolvedValueOnce();
      Study.findByIdAndUpdate = jest.fn().mockResolvedValueOnce(null);

      const response = await request(app).delete(`/api/studies/645c1234567890abcdef1234/questions/645c1234567890abcdef5678`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Question not found");
    });

    it("should return 500 if deleting the question fails", async () => {
      dbConnect.mockResolvedValueOnce();
      Study.findByIdAndUpdate = jest.fn().mockRejectedValueOnce(new Error("Database error"));

      const response = await request(app).delete(`/api/studies/645c1234567890abcdef1234/questions/645c1234567890abcdef5678`);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Failed to delete the question");
    });
  });

  describe("GET /api/studies/:id/questions/:questionId", () => {
    it("should fetch a specific question", async () => {
      dbConnect.mockResolvedValueOnce();
      const mockStudy = {
        _id: "645c1234567890abcdef1234",
        questions: [{ _id: "645c1234567890abcdef5678", type: "text", data: "Sample question" }],
      };
      Study.findOne = jest.fn().mockResolvedValueOnce(mockStudy);

      const response = await request(app).get(`/api/studies/${mockStudy._id}/questions/645c1234567890abcdef5678`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data", "Sample question");
    });

    it("should return 404 if the question is not found", async () => {
      dbConnect.mockResolvedValueOnce();
      Study.findOne = jest.fn().mockResolvedValueOnce(null);

      const response = await request(app).get(`/api/studies/645c1234567890abcdef1234/questions/645c1234567890abcdef5678`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Study or question not found");
    });

    it("should return 500 if fetching the question fails", async () => {
      dbConnect.mockResolvedValueOnce();
      Study.findOne = jest.fn().mockRejectedValueOnce(new Error("Database error"));

      const response = await request(app).get(`/api/studies/645c1234567890abcdef1234/questions/645c1234567890abcdef5678`);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Failed to get question");
    });
  });
});