/**
 * Example unit test demonstrating Vitest capabilities.
 *
 * TODO: Remove this file once you have real unit tests in place.
 */
import { describe, expect, it, vi } from "vitest";

describe("Example Unit Tests", () => {
  describe("Basic assertions", () => {
    it("should pass basic equality checks", () => {
      expect(1 + 1).toBe(2);
      expect("hello").toBe("hello");
    });

    it("should handle object comparisons", () => {
      const obj = { name: "test", value: 42 };
      expect(obj).toEqual({ name: "test", value: 42 });
    });

    it("should handle array operations", () => {
      const arr = [1, 2, 3];
      expect(arr).toContain(2);
      expect(arr).toHaveLength(3);
    });
  });

  describe("Mocking with vi", () => {
    it("should create and verify mock functions", () => {
      const mockFn = vi.fn();

      mockFn("arg1", "arg2");

      expect(mockFn).toHaveBeenCalled();
      expect(mockFn).toHaveBeenCalledWith("arg1", "arg2");
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it("should mock return values", () => {
      const mockFn = vi.fn().mockReturnValue(42);

      const result = mockFn();

      expect(result).toBe(42);
    });

    it("should mock async functions", async () => {
      const mockAsync = vi.fn().mockResolvedValue({ data: "test" });

      const result = await mockAsync();

      expect(result).toEqual({ data: "test" });
    });
  });

  describe("Async operations", () => {
    it("should handle promises", async () => {
      const fetchData = async () => {
        return new Promise((resolve) => {
          setTimeout(() => resolve("data"), 10);
        });
      };

      const result = await fetchData();
      expect(result).toBe("data");
    });
  });
});
