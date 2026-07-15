import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const stored = localStorage.getItem("airbnb_session");
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (session) localStorage.setItem("airbnb_session", JSON.stringify(session));
    else localStorage.removeItem("airbnb_session");
  }, [session]);

  const value = useMemo(() => ({ session, setSession, logout: () => setSession(null) }), [session]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
