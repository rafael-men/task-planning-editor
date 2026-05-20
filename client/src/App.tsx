import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { RequireAuth } from "./auth/RequireAuth";
import { ThemeProvider } from "./theme/ThemeProvider";
import { AppLayout } from "./components/AppLayout";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { Perfil } from "./pages/Perfil";
import { PlaybookPage } from "./pages/Playbook";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              element={
                <RequireAuth>
                  <AppLayout />
                </RequireAuth>
              }
            >
              <Route path="/" element={<Home />} />
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/playbooks/:id" element={<PlaybookPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
