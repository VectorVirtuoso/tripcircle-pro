import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for an existing session token
    const storedUser = localStorage.getItem("tripcircle_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Custom login function to save the JWT
  const login = (userData) => {
    localStorage.setItem("tripcircle_user", JSON.stringify(userData));
    setUser(userData);
  };

  // Custom logout function to wipe the JWT
  const logout = () => {
    localStorage.removeItem("tripcircle_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);