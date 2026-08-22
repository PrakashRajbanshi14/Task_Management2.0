
import {
  useDispatch,
  useSelector,
} from "react-redux";

import type {
  TypedUseSelectorHook,
} from "react-redux";

import type {
  RootState,
  AppDispatch,
} from "../store/store";


// ==========================================
// TYPED REDUX HOOKS
// ==========================================

export const useAppDispatch =
  () => useDispatch<AppDispatch>();


export const useAppSelector: TypedUseSelectorHook<RootState> =
  useSelector;


// ==========================================
// AUTH HOOK
// ==========================================

export const useAuth = () => {

  const dispatch = useAppDispatch();

  const {
    user,
    isAuthenticated,
    isLoading,
    error,
  } = useAppSelector(
    (state) => state.auth,
  );


  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    dispatch,
  };
};

