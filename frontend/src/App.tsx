import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PublicRoute } from "@/components/PublicRoute";
import { Welcome } from "@/pages/Welcome";
import { RegisterOwnerAgency } from "@/pages/RegisterOwnerAgency";
import { RegisterClient } from "@/pages/RegisterClient";
import { Login } from "@/pages/Login";
import { VerifyOTP } from "@/pages/VerifyOTP";
import { ClientDashboard } from "@/pages/Dashboards";
import { OwnerDashboard } from "@/pages/OwnerDashboard";
import { OwnerPropertiesPage } from "@/pages/OwnerPropertiesPage";
import { OwnerPropertyFormPage } from "@/pages/OwnerPropertyFormPage";
import { OwnerPropertyDetailPage } from "@/pages/OwnerPropertyDetailPage";
import { OwnerSettingsPage } from "@/pages/OwnerSettingsPage";
import { PropertyDetailsPage } from "@/pages/PropertyDetailsPage";
import { AgencyProfilePage } from "@/pages/AgencyProfilePage";
import { AdminRoute } from "@/components/AdminRoute";
import { AdminLogin } from "@/pages/admin/AdminLogin";
import { AdminLayout } from "@/pages/admin/AdminLayout";
import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage";
import { AdminPropertiesQueuePage } from "@/pages/admin/AdminPropertiesQueuePage";
import { AdminAddPropertyPage } from "@/pages/admin/AdminAddPropertyPage";
import { AdminUsersPage } from "@/pages/admin/AdminUsersPage";
import { AdminReportsPage } from "@/pages/admin/AdminReportsPage";
import { AdminCategoriesPage } from "@/pages/admin/AdminCategoriesPage";
import { AdminLocationsPage } from "@/pages/admin/AdminLocationsPage";
import { AdminLandingPageConfig } from "@/pages/admin/AdminLandingPageConfig";
import { AdminSettingsPage } from "@/pages/admin/AdminSettingsPage";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <HelmetProvider>
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
              path="/dashboard/search"
              element={<ClientDashboard />}
            />
            <Route
              path="/search"
              element={<ClientDashboard />}
            />
            <Route
              path="/properties"
              element={<ClientDashboard />}
            />

            <Route
              path="/properties/:propertyId"
              element={<PropertyDetailsPage />}
            />

            <Route
              path="/agencies/:agencyId"
              element={<AgencyProfilePage />}
            />

            {/* Protected Owner/Agency Experience Routes */}
            <Route
              path="/owner/dashboard"
              element={
                <ProtectedRoute allowedRoles={["owner", "agency"]}>
                  <OwnerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/properties"
              element={
                <ProtectedRoute allowedRoles={["owner", "agency"]}>
                  <OwnerPropertiesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/properties/new"
              element={
                <ProtectedRoute allowedRoles={["owner", "agency"]}>
                  <OwnerPropertyFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/properties/:propertyId/edit"
              element={
                <ProtectedRoute allowedRoles={["owner", "agency"]}>
                  <OwnerPropertyFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/properties/:propertyId"
              element={
                <ProtectedRoute allowedRoles={["owner", "agency"]}>
                  <OwnerPropertyDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/settings"
              element={
                <ProtectedRoute allowedRoles={["owner", "agency"]}>
                  <OwnerSettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Platform Routes */}
            <Route path="/admin-platform/login" element={<AdminLogin />} />
            
            <Route
              path="/admin-platform/*"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="properties" element={<AdminPropertiesQueuePage />} />
              <Route path="properties/add" element={<AdminAddPropertyPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="categories" element={<AdminCategoriesPage />} />
              <Route path="locations" element={<AdminLocationsPage />} />
              <Route path="landing-page" element={<AdminLandingPageConfig />} />
              <Route path="testimonials" element={<Navigate to="../landing-page" replace />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>

            {/* Legacy & Alias Admin Redirects */}
            <Route path="/admin" element={<Navigate to="/admin-platform/dashboard" replace />} />
            <Route path="/admin/login" element={<Navigate to="/admin-platform/login" replace />} />
            <Route path="/admin-portal" element={<Navigate to="/admin-platform/dashboard" replace />} />
            <Route path="/admin-portal/login" element={<Navigate to="/admin-platform/login" replace />} />
            <Route path="/admin-portal/*" element={<Navigate to="/admin-platform/dashboard" replace />} />

             {/* Fallback Catch-all Route */}
            <Route path="*" element={<Navigate to="/register/type" replace />} />
          </Routes>
        </div>
        </BrowserRouter>
        {/* Toast provider */}
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
