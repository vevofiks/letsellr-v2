import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PublicRoute } from "@/components/PublicRoute";
import { Welcome } from "@/pages/Welcome";
import { RegisterOwnerAgency } from "@/pages/RegisterOwnerAgency";
import { RegisterClient } from "@/pages/RegisterClient";
import { Login } from "@/pages/Login";
import { VerifyOTP } from "@/pages/VerifyOTP";
import { ClientDashboard, OwnerDashboard, AdminDashboard } from "@/pages/Dashboards";
import { PropertyDetailsPage } from "@/pages/PropertyDetailsPage";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex-1 w-full bg-slate-50 min-h-screen">
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/register/type"
              element={<Welcome />}
            />
            <Route
              path="/register/owner-agency"
              element={
                <PublicRoute>
                  <RegisterOwnerAgency />
                </PublicRoute>
              }
            />
            <Route
              path="/register/client"
              element={
                <PublicRoute>
                  <RegisterClient />
                </PublicRoute>
              }
            />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/verify-otp"
              element={
                <PublicRoute>
                  <VerifyOTP />
                </PublicRoute>
              }
            />

            {/* Public Client Dashboard Route */}
            <Route
              path="/dashboard"
              element={<ClientDashboard />}
            />

            <Route
              path="/properties/:propertyId"
              element={<PropertyDetailsPage />}
            />

            {/* Protected Owner/Agency Dashboard Route */}
            <Route
              path="/owner/dashboard"
              element={
                <ProtectedRoute allowedRoles={["owner", "agency"]}>
                  <OwnerDashboard />
                </ProtectedRoute>
              }
            />

            {/* Protected Admin Dashboard Route */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

             {/* Fallback Catch-all Route */}
            <Route path="*" element={<Navigate to="/register/type" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
      {/* Toast provider */}
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}

export default App;
