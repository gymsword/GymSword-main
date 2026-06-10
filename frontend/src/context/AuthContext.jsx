import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, formatApiErrorDetail } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = unknown / loading
  const [ready, setReady] = useState(false);

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me"); 
      setUser(data);
    } catch {
      setUser(false);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    if (data.access_token) localStorage.setItem("gs_token", data.access_token);
    setUser(data.user);
    return data.user;
  };

const adminLogin = async (email, password) => {
// Manual Admin Login
if (
email === "[gymsword2024@gmail.com](mailto:gymsword2024@gmail.com)" &&
password === "#Sword@2024"
) {
const adminUser = {
id: "admin-1",
name: "GymSword Admin",
email: "[gymsword2024@gmail.com](mailto:gymsword2024@gmail.com)",
role: "admin",
};

```
localStorage.setItem("gs_token", "admin-token");
setUser(adminUser);

return adminUser;
```

}

// Existing Backend Login Logic
const { data } = await api.post("/auth/admin-login", {
email,
password,
});

if (data.access_token) {
localStorage.setItem("gs_token", data.access_token);
}

setUser(data.user);
return data.user;
};

  const register = async (name, email, password,referralCode) => {
    const { data } = await api.post("/auth/register", { name, email, password,referralCode });
    if (data.access_token) localStorage.setItem("gs_token", data.access_token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    localStorage.removeItem("gs_token");
    setUser(false);
  };

  return (
    <AuthContext.Provider
      value={{ user, ready, login, adminLogin, register, logout, refresh: fetchMe, formatErr: formatApiErrorDetail }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
