
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";


// ==========================================
// PROTECTED ROUTE
// ==========================================

const ProtectedRoute = () => {

  const {
    isAuthenticated,
    isLoading,
  } = useAuth();

  const location = useLocation();


  // ========================================
  // CHECKING AUTHENTICATION
  // ========================================

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">

          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />

          <p className="text-sm text-slate-400">
            Checking authentication...
          </p>

        </div>
      </div>
    );
  }


  // ========================================
  // NOT AUTHENTICATED
  // ========================================

  if (!isAuthenticated) {

    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
        }}
      />
    );
  }


  // ========================================
  // AUTHENTICATED
  // ========================================

  return <Outlet />;
};


export default ProtectedRoute;

