import axios from "axios";
import api from "../api";

// Mock axios
jest.mock("axios");

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value; }),
    removeItem: jest.fn((key) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

beforeEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
});

describe("QueryBuilder via api.from()", () => {
  test("select builds GET request with correct params", async () => {
    axios.get.mockResolvedValue({ data: { data: [{ id: 1 }], error: null } });
    const result = await api.from("student_form_submissions").select("*");
    expect(axios.get).toHaveBeenCalledWith(
      "/api/student-forms",
      expect.objectContaining({ params: expect.any(Object) })
    );
    expect(result.data).toEqual([{ id: 1 }]);
  });

  test("eq filter adds query param", async () => {
    axios.get.mockResolvedValue({ data: { data: [], error: null } });
    await api.from("student_form_submissions").select("*").eq("volunteer_email", "test@test.com");
    const params = axios.get.mock.calls[0][1].params;
    expect(params.volunteer_email).toBe("test@test.com");
  });

  test("order adds ordering params", async () => {
    axios.get.mockResolvedValue({ data: { data: [], error: null } });
    await api.from("student_form_submissions").select("*").order("created_at", { ascending: true });
    const params = axios.get.mock.calls[0][1].params;
    expect(params.order_field).toBe("created_at");
    expect(params.order_ascending).toBe("true");
  });

  test("single flag adds single param", async () => {
    axios.get.mockResolvedValue({ data: { data: { id: 1 }, error: null } });
    await api.from("student_form_submissions").select("*").eq("id", 1).single();
    const params = axios.get.mock.calls[0][1].params;
    expect(params.single).toBe("true");
  });

  test("count mode sends count_only param", async () => {
    axios.get.mockResolvedValue({ data: { count: 5, data: null, error: null } });
    const result = await api.from("eligible_students").select("*", { count: "exact", head: true });
    const params = axios.get.mock.calls[0][1].params;
    expect(params.count_only).toBe("true");
    expect(result.count).toBe(5);
  });

  test("insert sends POST request", async () => {
    axios.post.mockResolvedValue({ data: { data: [{ id: 1 }], error: null } });
    const result = await api.from("student_form_submissions").insert({ first_name: "Test" });
    expect(axios.post).toHaveBeenCalledWith(
      "/api/student-forms",
      [{ first_name: "Test" }],
      expect.any(Object)
    );
    expect(result.data).toEqual([{ id: 1 }]);
  });

  test("update with id sends PUT request", async () => {
    axios.put.mockResolvedValue({ data: { data: { id: 1, first_name: "Updated" }, error: null } });
    await api.from("student_form_submissions").update({ first_name: "Updated" }).eq("id", 1);
    expect(axios.put).toHaveBeenCalledWith(
      "/api/student-forms/1",
      { first_name: "Updated" },
      expect.any(Object)
    );
  });

  test("update without id returns error", async () => {
    const result = await api.from("student_form_submissions").update({ first_name: "X" });
    expect(result.error).toBeTruthy();
    expect(result.error.message).toMatch(/id/i);
  });

  test("delete with id sends DELETE request", async () => {
    axios.delete.mockResolvedValue({ data: { data: null, error: null } });
    await api.from("student_form_submissions").delete().eq("id", 1);
    expect(axios.delete).toHaveBeenCalledWith(
      "/api/student-forms/1",
      expect.any(Object)
    );
  });

  test("delete without id returns error", async () => {
    const result = await api.from("student_form_submissions").delete();
    expect(result.error).toBeTruthy();
    expect(result.error.message).toMatch(/id/i);
  });

  test("TABLE_ENDPOINT_MAP routes correctly", async () => {
    axios.get.mockResolvedValue({ data: { data: [], error: null } });
    await api.from("fee_payments").select("*");
    expect(axios.get.mock.calls[0][0]).toBe("/api/fee-payments");
  });

  test("unknown table falls back to /api/<table>", async () => {
    axios.get.mockResolvedValue({ data: { data: [], error: null } });
    await api.from("unknown_table").select("*");
    expect(axios.get.mock.calls[0][0]).toBe("/api/unknown_table");
  });
});
