import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register, setToken, saveEmail, getSavedEmail } from "../auth";

export function RegisterPage() {
  const [email, setEmail] = useState(getSavedEmail());
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await register(email, username, password);
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
        <h2>Create Account</h2>
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
          <label>Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Choose a username"
            required
          />
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 6 characters"
            minLength={6}
            required
          />
          <div className="modal-btns">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Creating..." : "Continue"}
            </button>
          </div>
        </form>
        <p style={{ marginTop: 16, fontSize: 13, color: "var(--text-secondary)" }}>
          Already have an account? <Link to="/login" style={{ color: "var(--accent)" }}>Log In</Link>
        </p>
      </div>
    </div>
  );
}
