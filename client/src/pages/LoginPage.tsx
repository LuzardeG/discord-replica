import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login, setToken, saveEmail, getSavedEmail } from "../auth";

export function LoginPage() {
  const [email, setEmail] = useState(getSavedEmail());
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(email, password);
      setToken(data.token);
      saveEmail(email);
      localStorage.setItem("dr_user", JSON.stringify(data.user));
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-bg">
      <div className="modal">
        <h2>Welcome Back</h2>
        {error && <div style={{ color: "var(--red)", marginBottom: 12, fontSize: 13 }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            autoFocus
            required
          />
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
          <div className="modal-btns">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Logging in..." : "Log In"}
            </button>
          </div>
        </form>
        <p style={{ marginTop: 16, fontSize: 13, color: "var(--text-secondary)" }}>
          Need an account? <Link to="/register" style={{ color: "var(--accent)" }}>Register</Link>
        </p>
      </div>
    </div>
  );
}
