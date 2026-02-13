import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function RoleLogin() {
  const { role } = useParams();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success(`Logging in as ${role}`);
    navigate("/studentform"); // After login, redirect to homepage or dashboard
  };

  return (
    <div className="flex h-screen justify-center items-center bg-gray-100">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="p-8 bg-white shadow-lg rounded-xl w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center capitalize">
          {role} Login
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username/Email */}
          <div>
            <label className="block text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2 rounded-lg hover:from-indigo-600 hover:to-purple-600 shadow-md"
          >
            Login
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Not a {role}?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-indigo-500 cursor-pointer hover:underline"
          >
            Go back
          </span>
        </p>
      </div>
    </div>
  );
}
