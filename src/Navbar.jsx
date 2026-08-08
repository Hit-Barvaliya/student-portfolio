import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav
      style={{
        display: "flex",
        gap: "20px",
        padding: "15px",
        background: "#f2f2f2",
      }}
    >
      <Link to="/">Home</Link>

      <Link to="/projects">Projects</Link>

      <Link to="/contact">Contact</Link>
    </nav>
  );
}

export default Navbar;