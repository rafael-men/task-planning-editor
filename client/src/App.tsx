import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { RequireAuth } from "./auth/RequireAuth";
import { ThemeProvider } from "./theme/ThemeProvider";
import { AppLayout } from "./components/AppLayout";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { Perfil } from "./pages/Perfil";
import { Playbooks } from "./pages/Playbooks";
import { PlaybookPage } from "./pages/Playbook";
import { Onboardings } from "./pages/Onboardings";
import { OnboardingNew } from "./pages/OnboardingNew";
import { OnboardingDetail } from "./pages/OnboardingDetail";
import { AdminPerfis } from "./pages/AdminPerfis";
import { RequireAdmin } from "./auth/RequireRH";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <AppLayout />
                </RequireAuth>
              }
            >
              <Route index element={<Home />} />
              <Route path="playbooks" element={<Playbooks />} />
              <Route path="playbooks/:id" element={<PlaybookPage />} />
              <Route path="onboardings" element={<Onboardings />} />
              <Route path="onboardings/novo" element={<OnboardingNew />} />
              <Route path="onboardings/:id" element={<OnboardingDetail />} />
              <Route path="perfil" element={<Perfil />} />
              <Route
                path="admin/perfis"
                element={
                  <RequireAdmin>
                    <AdminPerfis />
                  </RequireAdmin>
                }
              />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
