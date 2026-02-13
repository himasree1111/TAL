import React, { useState } from "react";
import axios from "axios";
import { validatePassword, validateName, validateEmail } from "./utils/validation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [touched, setTouched] = useState({ name: false, email: false, password: false });

  const handleRegister = async (e) => {
    e.preventDefault();

    const emailErr = validateEmail(email);
    const passErrs = validatePassword(password);

    setEmailError(emailErr);
    setPasswordErrors(passErrs);

    if (emailErr || passErrs.length > 0) {
      toast.warn("Please fix errors before registering");
      return;
    }

    try {
      const response = await axios.post("/register", {
        name,
        email,
        password,
      });

      if (response.data.success) {
        toast.success("Registered successfully! Please login now.");
        window.location.href = "/volunteerlogin";
      } else {
        toast.error(response.data.error || "Registration failed");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto" }}>
      <ToastContainer position="top-right" autoClose={3000} />
      <h2>Volunteer Registration</h2>
      <form onSubmit={handleRegister}>
        {/* Name */}
        <div>
          <label>Name: </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (touched.name) {
                setNameError(validateName(e.target.value));
              }
            }}
            onBlur={() => {
              setTouched({ ...touched, name: true });
              setNameError(validateName(name));
            }}
            required
          />
          {touched.name && nameError && (
            <p style={{ color: "red" }}>{nameError}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label>Email: </label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (touched.email) {
                setEmailError(validateEmail(e.target.value));
              }
            }}
            onBlur={() => {
              setTouched({ ...touched, email: true });
              setEmailError(validateEmail(email));
            }}
            required
          />
          {touched.email && emailError && (
            <p style={{ color: "red" }}>{emailError}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label>Password: </label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (touched.password) {
                setPasswordErrors(validatePassword(e.target.value));
              }
            }}
            onBlur={() => {
              setTouched({ ...touched, password: true });
              setPasswordErrors(validatePassword(password));
            }}
            required
          />
          {touched.password && passwordErrors.length > 0 && (
            <ul style={{ color: "red" }}>
              {passwordErrors.map((err, index) => (
                <li key={index}>{err}</li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="submit"
          disabled={
            !name ||
            !email ||
            !password ||
            nameError ||
            emailError ||
            passwordErrors.length > 0
          }
        >
          Register
        </button>
      </form>

      <p>
        Already registered?{" "}
        <a href="/volunteerlogin">Click here to login</a>
      </p>
    </div>
  );
}

export default Register;