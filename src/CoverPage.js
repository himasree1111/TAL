// import React from "react";
// import { useNavigate } from "react-router-dom";
// import "./CoverPage.css";

// export default function CoverPage() {
//   const navigate = useNavigate();

//   const handleLogin = () => {
//     navigate("/login"); // navigate to a generic login page
//   };

//   return (
//     <div className="cover-container">
//       {/* Top navigation area */}
//       <header className="cover-header">
//         <img
//           src="https://touchalifeorg.com/wp-content/uploads/2025/04/logo-e1745902555693.png"
//           alt="Touch A Life logo"
//           className="logo"
//           loading="lazy"
//           width="180"
//           height="60"
//         />
//         <button className="login-btn" onClick={handleLogin}>
//           LOGIN
//         </button>
//       </header>

//       {/* Centered content */}
//       <main className="cover-main">
//         <h1>Touch A Life Foundation</h1>
//         <h3>Touching Lives Since 2014</h3>
//         <p>Welcome! Click the login button above to continue.</p>
//       </main>
//     </div>
//   );
// }

// import React from "react";
// import { useNavigate } from "react-router-dom";
// import "./CoverPage.css";

// export default function CoverPage() {
//   const navigate = useNavigate();

//   const handleLogin = () => {
//     navigate("/login");
//   };

//   return (
//     <div className="cover-container">
//       {/* Top navigation area */}
//       <header className="cover-header">
//         <img
//           src="https://touchalifeorg.com/wp-content/uploads/2025/04/logo-e1745902555693.png"
//           alt="Touch A Life logo"
//           className="logo"
//           loading="lazy"
//           width="180"
//           height="60"
//         />
//         <button className="login-btn" onClick={handleLogin}>
//           LOGIN
//         </button>
//       </header>

//       {/* Centered content */}
//       <main className="cover-main">
//         <h1>Touch A Life Foundation</h1>
//       </main>
//     </div>
//   );
// }

// ...existing code...
import React from "react";
import { useNavigate } from "react-router-dom";
import "./CoverPage.css";

export default function CoverPage() {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate("/login");
  };

  return (
    <div className="cover-container">
      {/* Full-bleed header with inner constrained content */}
      <header className="cover-header">
        <div className="header-inner">
          <img
            src="https://touchalifeorg.com/wp-content/uploads/2025/04/logo-e1745902555693.png"
            alt="Touch A Life logo"
            className="logo"
            loading="lazy"
            width="180"
            height="60"
          />
          <button className="login-btn" onClick={handleLogin}>
            LOGIN
          </button>
        </div>
      </header>

      {/* Centered main content */}
      <main className="cover-main">
        <h1>Touch A Life Foundation</h1>
      </main>
    </div>
  );
}
// ...existing code...