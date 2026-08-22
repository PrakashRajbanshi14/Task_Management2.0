
import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

import type { UserRole } from "../types/auth";


// ==========================================
// ROLE ROUTE PROPS
// ==========================================

interface RoleRouteProps {
  allowedRoles: UserRole[];
}


// ==========================================
// ROLE ROUTE
// ==========================================

const RoleRoute = ({
  allowedRoles,
}: RoleRouteProps) => {

  const {
    user,
    isAuthenticated,
    isLoading,
  } = useAuth();


  // ========================================
  // AUTH CHECK
  // ========================================

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950">
        <div className="flex flex-col items-center gap-4">

          <div className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-700 border-t-teal-500" />

          <p className="text-sm text-slate-400">
            Loading...
          </p>

        </div>
      </div>
    );
  }


  // ========================================
  // NOT AUTHENTICATED
  // ========================================

  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  // ========================================
  // ROLE CHECK
  // ========================================

  if (!allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to="/unauthorized"
        replace
      />
    );
  }


  // ========================================
  // AUTHENTICATED + AUTHORIZED
  // ========================================

  return <Outlet />;
};


export default RoleRoute;

