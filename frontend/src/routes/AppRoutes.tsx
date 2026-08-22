
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import GoogleCallback from "../pages/auth/GoogleCallback";

import Maintenance from "../pages/Maintenance";
import NotFound from "../pages/NotFound";
import Unauthorized from "../pages/Unauthorized";

import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

import AdminLayout from "../layouts/AdminLayout";
import ProjectManagerLayout from "../layouts/ProjectManagerLayout";
import EmployeeLayout from "../layouts/EmployeeLayout";

import { UserRole } from "../types/auth";


// ==========================================
// APP ROUTES
// ==========================================

const AppRoutes = () => {
  /*
   * Maintenance mode is primarily controlled
   * by the backend.
   *
   * The Axios interceptor will redirect to
   * /maintenance when the backend returns 503.
   */

  return (
    <BrowserRouter>
      <Routes>

        {/* ================================== */}
        {/* PUBLIC AUTH ROUTES */}
        {/* ================================== */}

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route
          path="/auth/google/callback"
          element={<GoogleCallback />}
        />


        {/* ================================== */}
        {/* MAINTENANCE */}
        {/* ================================== */}

        <Route
          path="/maintenance"
          element={<Maintenance />}
        />


        {/* ================================== */}
        {/* UNAUTHORIZED */}
        {/* ================================== */}

        <Route
          path="/unauthorized"
          element={<Unauthorized />}
        />


        {/* ================================== */}
        {/* PROTECTED ROUTES */}
        {/* ================================== */}

        <Route element={<ProtectedRoute />}>

          {/* ================================= */}
          {/* ADMIN */}
          {/* ================================= */}

          <Route
            element={
              <RoleRoute
                allowedRoles={[UserRole.Admin]}
              />
            }
          >
            <Route
              path="/admin/*"
              element={<AdminLayout />}
            />
          </Route>


          {/* ================================= */}
          {/* PROJECT MANAGER */}
          {/* ================================= */}

          <Route
            element={
              <RoleRoute
                allowedRoles={[
                  UserRole.ProjectManager,
                ]}
              />
            }
          >
            <Route
              path="/project-manager/*"
              element={<ProjectManagerLayout />}
            />
          </Route>


          {/* ================================= */}
          {/* EMPLOYEE */}
          {/* ================================= */}

          <Route
            element={
              <RoleRoute
                allowedRoles={[
                  UserRole.Employee,
                ]}
              />
            }
          >
            <Route
              path="/employee/*"
              element={<EmployeeLayout />}
            />
          </Route>


          {/* ================================= */}
          {/* DEFAULT PROTECTED ROUTE */}
          {/* ================================= */}

          <Route
            path="/"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />

        </Route>


        {/* ================================== */}
        {/* 404 */}
        {/* ================================== */}

        <Route
          path="*"
          element={<NotFound />}
        />

      </Routes>
    </BrowserRouter>
  );
};


export default AppRoutes;

