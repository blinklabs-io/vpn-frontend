import { describe, it, expect, beforeEach, vi } from "vitest";
import { apiClient, get, post, API_BASE_URL } from "../client";

describe("API Client", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("apiClient", () => {
    it("should make successful GET request", async () => {
      const mockData = { message: "success" };
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await apiClient("/test");

      expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/test`, {
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
      });
      expect(result).toEqual(mockData);
    });

    it("should handle API errors", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        text: async () => "Resource not found",
      });

      await expect(apiClient("/test")).rejects.toThrow(
        "API Error: 404 Not Found - Resource not found",
      );
    });

    it("should handle network errors", async () => {
      global.fetch = vi
        .fn()
        .mockRejectedValueOnce(new TypeError("Failed to fetch"));

      await expect(apiClient("/test")).rejects.toThrow(
        "Network error: Unable to connect to the API",
      );
    });

    it("should include custom headers", async () => {
      const mockData = { data: "test" };
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      await apiClient("/test", {
        headers: {
          Authorization: "Bearer token123",
        },
      });

      expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/test`, {
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
          Authorization: "Bearer token123",
        },
      });
    });
  });

  describe("get helper", () => {
    it("should make GET request", async () => {
      const mockData = { id: 1, name: "test" };
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await get("/users/1");

      expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/users/1`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
      });
      expect(result).toEqual(mockData);
    });
  });

  describe("post helper", () => {
    it("should make POST request with data", async () => {
      const mockData = { id: 1, name: "created" };
      const postData = { name: "test" };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await post("/users", postData);

      expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/users`, {
        method: "POST",
        body: JSON.stringify(postData),
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
      });
      expect(result).toEqual(mockData);
    });

    it("should make POST request without data", async () => {
      const mockData = { message: "success" };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await post("/action");

      expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/action`, {
        method: "POST",
        body: undefined,
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
      });
      expect(result).toEqual(mockData);
    });
  });
});
