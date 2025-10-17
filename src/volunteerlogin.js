// // // volunteerlogin.js
// // import React, { useState } from "react";

// // export default function VolunteerLogin() {
// //   const [email, setEmail] = useState("");
// //   const [password, setPassword] = useState("");

// //   const handleLogin = async (e) => {
// //     e.preventDefault();
// //     try {
// //       const res = await fetch("http://localhost:4000/login", {
// //         method: "POST",
// //         headers: { "Content-Type": "application/json" },
// //         body: JSON.stringify({ email, password })
// //       });
// //       const data = await res.json();
// //       if (data.success) {
// //         // store volunteer_id so student form knows who added the record
// //         localStorage.setItem("volunteer_id", data.volunteer_id);
// //         alert("Login successful");
// //         window.location.href = "/studentform";
// //       } else {
// //         alert((data.message || "Login failed"));
// //       }
// //     } catch (err) {
// //       console.error("Login error:", err);
// //       alert(" Could not reach server. Make sure backend is running.");
// //     }
// //   };

// //   return (
// //     <div style={{ maxWidth: 420, margin: "30px auto", padding: 20 }}>
// //       <h2>Volunteer Login</h2>
// //       <form onSubmit={handleLogin}>
// //         <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
// //         <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
// //         <button type="submit">Login</button>
// //       </form>
// //       <p>Don't have an account? <a href="/register">Register</a></p>
// //     </div>
// //   );
// // }

// // volunteerlogin.js
// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom"; // Import useNavigate

// export default function VolunteerLogin() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const navigate = useNavigate(); // Initialize useNavigate

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     try {
//       const res = await fetch("http://localhost:4000/login", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email, password }),
//       });
//       const data = await res.json();

//       if (data.success && data.volunteer) {
//         // Store the entire volunteer profile object in localStorage
//         localStorage.setItem("volunteerProfile", JSON.stringify(data.volunteer));
//         alert("Login successful");
//         // Use navigate to go to the student form
//         navigate("/studentform");
//       } else {
//         alert(data.message || "Login failed. Please check your credentials.");
//       }
//     } catch (err) {
//       console.error("Login error:", err);
//       alert("Could not reach the server. Please ensure the backend is running.");
//     }
//   };

//   return (
//     <div style={{ maxWidth: 420, margin: "30px auto", padding: 20 }}>
//       <h2>Volunteer Login</h2>
//       <form onSubmit={handleLogin}>
//         <input
//           type="email"
//           placeholder="Email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           required
//         />
//         <input
//           type="password"
//           placeholder="Password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           required
//         />
//         <button type="submit">Login</button>
//       </form>
//       <p>
//         Don't have an account? <a href="/register">Register</a>
//       </p>
//     </div>
//   );
// }

// volunteerlogin.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// Import the mock volunteer data from your JSON file
import volunteerData from "./volunteer.json";

export default function VolunteerLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault(); // Prevent the form from reloading the page

    // Get the correct volunteer object from the imported JSON
    const mockVolunteer = volunteerData.volunteer;

    // Check if the entered email and password match the mock data
    if (email === mockVolunteer.email && password === mockVolunteer.password) {
      // If they match, the login is successful
      alert("Login successful");

      // Store the entire volunteer profile in localStorage
      localStorage.setItem("volunteerProfile", JSON.stringify(mockVolunteer));
      
      // Navigate to the student form
      navigate("/studentform");
    } else {
      // If they don't match, show an error
      alert("Invalid email or password. Please try again.");
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "30px auto", padding: 20 }}>
      <h2>Volunteer Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
      <p>
        Don't have an account? <a href="/register">Register</a>
      </p>
    </div>
  );
}