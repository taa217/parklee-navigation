// AuthProvider.tsx
import React, { createContext, useContext, useState, ReactNode } from "react";

// Define types for the context state and actions
type AuthContextType = {
  isAuthenticated: boolean;
  isGuest: boolean; // Add guest state
  userRole: string | null;
  userName: string | null;
  userId: number | null;
  userEmail: string | null; // User email
  login: (id: number, username: string, role: string, email: string) => void;
  logout: () => void;
  loginAsGuest: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userId, setUserId] = useState<number | null>(null); // ID of the user
  const [userName, setUserName] = useState<string | null>(null); // Username
  const [userRole, setUserRole] = useState<string | null>(null); // User role
  const [userEmail, setEmail] = useState<string | null>(null); // User role
  const [isGuest, setIsGuest] = useState<boolean>(false); // Add guest state

  // The login function now takes id, username, role, and sets isAuthenticated to true
  const login = (id: number, username: string, role: string, email: string) => {
    setUserId(id);               // Set the user ID
    setUserName(username);       // Set the username
    setUserRole(role);           // Set the user role
    setIsAuthenticated(true);
    setEmail(email)
    setIsGuest(false); 
    // Set the authentication status to true
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setUserId(null);
    setUserName(null);
    setEmail(null)
    localStorage.clear();
  };

  const loginAsGuest = () => {
    setIsAuthenticated(true);
    setIsGuest(true);
    setUserRole('guest');
  };


  return (
    <AuthContext.Provider value={{ isAuthenticated, isGuest, userName, userId, userRole, userEmail, login, logout, loginAsGuest }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
