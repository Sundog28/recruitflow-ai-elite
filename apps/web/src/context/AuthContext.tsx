import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

type User = {
  id: number;
  email: string;
  full_name?: string;
  company_name?: string;
};

type AuthContextType = {
  token: string | null;
  user: User | null;

  login: (
    token: string,
    user: User
  ) => void;

  logout: () => void;
};

const AuthContext =
  createContext<AuthContextType | null>(null);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [token, setToken] =
    useState<string | null>(null);

  const [user, setUser] =
    useState<User | null>(null);

  useEffect(() => {
    const storedToken =
      localStorage.getItem("rf_token");

    const storedUser =
      localStorage.getItem("rf_user");

    if (storedToken) {
      setToken(storedToken);
    }

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  function login(
    newToken: string,
    newUser: User
  ) {
    localStorage.setItem(
      "rf_token",
      newToken
    );

    localStorage.setItem(
      "rf_user",
      JSON.stringify(newUser)
    );

    setToken(newToken);
    setUser(newUser);
  }

  function logout() {
    localStorage.removeItem("rf_token");

    localStorage.removeItem("rf_user");

    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }

  return context;
}