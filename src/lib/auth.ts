// Client-side authentication helpers

export function setSession(userId: string, userEmail: string, userName: string) {
  if (typeof window === "undefined") return;
  
  // Save to cookie (accessible by Next.js Middleware)
  // Max-age: 30 minutes (1800 seconds)
  document.cookie = `admin_session=${userId}; path=/; max-age=1800; SameSite=Lax`;
  
  // Save user details to localStorage for client-side display
  localStorage.setItem("admin_user", JSON.stringify({ id: userId, email: userEmail, name: userName }));
}

export function getSession(): string | null {
  if (typeof window === "undefined") return null;
  
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "admin_session") {
      return value;
    }
  }
  return null;
}

export function getAdminUser() {
  if (typeof window === "undefined") return null;
  
  const user = localStorage.getItem("admin_user");
  if (!user) return null;
  
  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  
  // Delete cookie
  document.cookie = "admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
  
  // Clear localStorage
  localStorage.removeItem("admin_user");
}
