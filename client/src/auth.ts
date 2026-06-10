const API = import.meta.env.VITE_API_URL || "https://discord-replica-server.onrender.com";

interface AuthResponse {
  token: string;
  user: { id: string; email: string; username: string };
}

export async function register(email: string, username: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Registration failed");
  return data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  return data;
}

export function getToken(): string | null {
  return localStorage.getItem("dr_token");
}

export function setToken(token: string) {
  localStorage.setItem("dr_token", token);
}

export function clearToken() {
  localStorage.removeItem("dr_token");
}

export function getSavedEmail(): string {
  return localStorage.getItem("dr_email") || "";
}

export function saveEmail(email: string) {
  localStorage.setItem("dr_email", email);
}
