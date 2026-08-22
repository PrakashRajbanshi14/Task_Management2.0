
import { Navigate, Outlet } from "react-router-dom";


// ==========================================
// MAINTENANCE ROUTE PROPS
// ==========================================

interface MaintenanceRouteProps {
  isMaintenanceMode: boolean;
}


// ==========================================
// MAINTENANCE ROUTE
// ==========================================

const MaintenanceRoute = ({
  isMaintenanceMode,
}: MaintenanceRouteProps) => {

  // ========================================
  // MAINTENANCE ENABLED
  // ========================================

  if (isMaintenanceMode) {
    return <Navigate to="/maintenance" replace />;
  }


  // ========================================
  // NORMAL MODE
  // ========================================

  return <Outlet />;
};


export default MaintenanceRoute;

