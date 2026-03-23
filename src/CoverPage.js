// import React from "react";
// import { useNavigate } from "react-router-dom";
// import "./CoverPage.css"; // Using the updated CSS

// export default function CoverPage() {
//   const navigate = useNavigate();

//   const handleLogin = () => {
//     navigate("/login");
//   };

//   const handleDonate = () => {
//     // Navigate to a donation link or section
//     console.log("Navigating to Donation Page...");
//   };

//   return (
//     <div className="cover-container-minimal">
//       {/* Header with Logo and CTA */}
//       <header className="header-minimal">
//         <div className="header-inner-minimal">
//           <h1 className="logo-text-minimal">Touch A Life</h1>
//           <button className="login-btn-minimal" onClick={handleLogin}>
//             LOGIN
//           </button>
//         </div>
//       </header>

//       {/* Centered Hero Content */}
//       <main className="hero-content-minimal">
        
//         {/* Eyebrow Text (Context) */}
//         <p className="eyebrow-text">
//           Touching 
//         </p>

//         {/* Main Headline (Outcome-Focused) */}
//         <h2 className="main-headline">
//           Empower a Girl to <span className="highlight-text-minimal">Learn, Dream, and Lead</span>
//         </h2>
        
//         {/* Subtext (Reduced Hesitation) */}
//         <p className="cta-subtext">
//           100% of your donation goes directly to educational needs.
//         </p>

//         {/* Primary Call to Action */}
//         <button className="donate-btn-minimal" onClick={handleDonate}>
//           DONATE NOW
//         </button>
        
//         {/* Secondary Low-Friction CTA */}
//         <p className="secondary-cta">
//           Need details first? <a href="#" className="explore-link">Explore Our Impact Stories</a>
//         </p>

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
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CoverPage.css"; // Using the updated CSS


export default function CoverPage() {
  const navigate = useNavigate();
  const [isRolesDropdownOpen, setIsRolesDropdownOpen] = useState(false);
  const [currentWord, setCurrentWord] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [scrollY, setScrollY] = useState(0);

  // Dynamic words that cycle in the headline
  const impactWords = ["Learn", "Dream", "Lead", "Grow", "Succeed", "Thrive"];

  // Word cycling animation
  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentWord((prev) => (prev + 1) % impactWords.length);
        setIsVisible(true);
      }, 300); // Wait for fade out
    }, 2500); // Change word every 2.5 seconds

    return () => clearInterval(interval);
  }, [impactWords.length]);

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleHome = () => {
    // Do nothing for now
  };

  const handleAbout = () => {
    window.open('https://touchalifeorg.com/about-pages/about-us/', '_blank');
  };

  const handleLearnMore = () => {
    window.open('https://touchalifeorg.com/', '_blank');
  };

  const handleContactUs = () => {
    // Scroll to contact info section
    document.getElementById('contact-info').scrollIntoView({ behavior: 'smooth' });
  };

  const handleRolesClick = () => {
    setIsRolesDropdownOpen(!isRolesDropdownOpen);
  };

const handleRoleSelect = (role) => {
  setIsRolesDropdownOpen(false);

  // ⭐ ADD THIS LINE (VERY IMPORTANT)
  sessionStorage.setItem("allowAccess", "true");

  // Navigate based on role
  if (role === 'Volunteer') {
    navigate('/volunteerlogin');
  } else if (role === 'Student') {
    navigate('/student-login');
  } else if (role === 'Donor') {
    navigate('/donorlogin'); } else if (role === 'Admin') {
    navigate('/adminlogin');
  }
};

// eslint-disable-next-line no-unused-vars
const handleDonate = () => {
  // Navigate to a donation link or section
  console.log("Navigating to Donation Page...");
};
  return (
    <div className="cover-container-minimal">
      {/* Header with Logo and Navigation */}
      <header className="header-minimal">
        <div className="header-inner-minimal">
          {/* LOGO IMAGE RE-ADDED HERE */}
          <img
            src="https://touchalifeorg.com/wp-content/uploads/2025/04/logo-e1745902555693.png"
            alt="Touch A Life logo"
            className="logo-image-minimal"
            loading="lazy"
            width="140"
            height="45"
          />
          <nav className="navigation-menu">
            <button className="nav-btn" onClick={handleHome}><span className="nav-icon">🏠</span> Home</button>
            <button className="nav-btn" onClick={handleAbout}><span className="nav-icon">ℹ️</span> About</button>
            <button className="nav-btn" onClick={handleLearnMore}><span className="nav-icon">📚</span> Learn More</button>
            <button className="nav-btn" onClick={handleContactUs}><span className="nav-icon">📞</span> Contact Us</button>
            <div className="dropdown">
              <button className="nav-btn dropdown-btn" onClick={handleRolesClick}>
                <span className="nav-icon">👥</span> Choose Your Role <span className="dropdown-arrow">▼</span>
              </button>
              {isRolesDropdownOpen && (
                <div className="dropdown-content">
                  <button className="dropdown-item" onClick={() => handleRoleSelect('Volunteer')}>Volunteer</button>
                  <button className="dropdown-item" onClick={() => handleRoleSelect('Student')}>Student</button>
                  <button className="dropdown-item" onClick={() => handleRoleSelect('Donor')}>Donor</button>
                  <button className="dropdown-item" onClick={() => handleRoleSelect('Admin')}>Admin</button>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Centered Hero Content */}
      <main className="hero-content-minimal" style={{ transform: `translateY(${scrollY * 0.3}px)` }}>
        
        {/* Eyebrow Text (Context) */}
        <p className="eyebrow-text fade-in-up">
          For the Future of India's Daughters
        </p>

        {/* Main Headline with Dynamic Word */}
        <h2 className="main-headline">
          Empower a Girl to{" "}
          <span className="highlight-text-minimal dynamic-word">
            {isVisible ? impactWords[currentWord] : ""}
          </span>
        </h2>
        
        {/* Animated Subtext */}
        <p className="cta-subtext slide-in-left">
          100% of your donation goes directly to educational needs.
        </p>

        {/* Animated Stats Counter */}
        <div className="stats-container">
          <div className="stat-item fade-in-up" style={{ animationDelay: "0.2s" }}>
            <div className="stat-number">500+</div>
            <div className="stat-label">Students Impacted</div>
          </div>
          <div className="stat-item fade-in-up" style={{ animationDelay: "0.4s" }}>
            <div className="stat-number">50+</div>
            <div className="stat-label">Schools Partnered</div>
          </div>
          <div className="stat-item fade-in-up" style={{ animationDelay: "0.6s" }}>
            <div className="stat-number">100%</div>
            <div className="stat-label">Transparent</div>
          </div>
        </div>
      </main>

      {/* Contact Info Section */}
      <section id="contact-info" className="contact-info-section">
        <div className="contact-info-container">
          <h3 className="contact-info-title">CONTACT INFO</h3>
          <div className="contact-details">
            <p><strong>Phone:</strong> +91 7993726302</p>
            <p><strong>Email:</strong> info@touchalifeorg.com</p>
            <p><strong>Address:</strong> 2nd floor, Isprout, Profound tech park, Whitefield Road. Kondapur.</p>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="footer-section">
        <div className="footer-container">
          <p>Copyright © 2025 Touch a Life, All rights reserved.</p>
          <p>Designed & Developed by Galaxy Tech Solution</p>
        </div>
      </footer>
    </div>
  );
}
