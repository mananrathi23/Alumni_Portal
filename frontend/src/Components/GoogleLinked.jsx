import { useEffect } from "react";

const GoogleLinked = () => {
  useEffect(() => {
    // Signal the opener via localStorage (works across origins)
    localStorage.setItem("google-linked", Date.now().toString());
    // Try to close; if blocked, show message
    setTimeout(() => window.close(), 500);
  }, []);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "#0f172a", color: "#94a3b8", fontFamily: "sans-serif",
      textAlign: "center", padding: "40px"
    }}>
      <h2 style={{ color: "#4ade80", fontSize: "24px", marginBottom: "12px" }}>
        ✅ Google Calendar Linked!
      </h2>
      <p>Meet links will now be auto-generated when you accept requests.</p>
      <p style={{ fontSize: "12px", marginTop: "8px" }}>
        You can close this tab and return to the portal.
      </p>
    </div>
  );
};

export default GoogleLinked;