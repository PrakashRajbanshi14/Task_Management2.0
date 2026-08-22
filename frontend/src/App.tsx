import { useEffect } from "react";
import { HelmetProvider } from "react-helmet-async";

import AppRoutes from "./routes/AppRoutes";
import { fetchCurrentUser } from "./store/authSlice";
import { useAppDispatch } from "./hooks/useAuth";
import { useSocket } from "./hooks/useSocket";

const App = () => {
  const dispatch = useAppDispatch();

  useSocket();

  useEffect(() => {
    void dispatch(fetchCurrentUser());
  }, [dispatch]);

  return (
    <HelmetProvider>
      <AppRoutes />
    </HelmetProvider>
  );
};

export default App;
