import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  deleteWorkShot,
  getAdminWorkDetails,
  getEmployeeMonthlyWorkDetails,
  getEmployeeWorkDetails,
  getMyMonthlyWorkDetails,
  getMyWorkDetails,
  getMyWorkShots,
  getUnpaidWorkDetails,
  getWorkShot,
  getWorkShots,
  updateSalaryStatus,
} from "../api/employeeApi";
import type { EmployeeWorkDetail, EmployeeWorkShot } from "../types/employee";
import { getErrorMessage, toArray, unwrapApiData } from "../utils/api";

interface EmployeeState {
  myWorkDetails: EmployeeWorkDetail[];
  adminWorkDetails: EmployeeWorkDetail[];
  unpaidWorkDetails: EmployeeWorkDetail[];
  workShots: Record<string, EmployeeWorkShot[]>;
  selectedWorkShot: EmployeeWorkShot | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: EmployeeState = {
  myWorkDetails: [],
  adminWorkDetails: [],
  unpaidWorkDetails: [],
  workShots: {},
  selectedWorkShot: null,
  isLoading: false,
  error: null,
};

type WorkFilter = { month?: number; year?: number };

const getArray = <T>(response: unknown) => toArray<T>(unwrapApiData(response));

export const fetchMyWorkDetails = createAsyncThunk<
  EmployeeWorkDetail[],
  WorkFilter | undefined,
  { rejectValue: string }
>("employee/fetchMyWorkDetails", async (params, { rejectWithValue }) => {
  try {
    return getArray<EmployeeWorkDetail>(await getMyWorkDetails(params));
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Unable to load your work details."));
  }
});

export const fetchMyMonthlyWorkDetail = createAsyncThunk<
  EmployeeWorkDetail,
  { year: number; month: number },
  { rejectValue: string }
>("employee/fetchMyMonthlyWorkDetail", async ({ year, month }, { rejectWithValue }) => {
  try {
    return unwrapApiData<EmployeeWorkDetail>(await getMyMonthlyWorkDetails(year, month));
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Unable to load monthly work details."));
  }
});

export const fetchAdminWorkDetails = createAsyncThunk<
  EmployeeWorkDetail[],
  WorkFilter | undefined,
  { rejectValue: string }
>("employee/fetchAdminWorkDetails", async (params, { rejectWithValue }) => {
  try {
    return getArray<EmployeeWorkDetail>(await getAdminWorkDetails(params));
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Unable to load employee work details."));
  }
});

export const fetchEmployeeWorkDetails = createAsyncThunk<
  EmployeeWorkDetail[],
  { employeeId: string; params?: WorkFilter },
  { rejectValue: string }
>("employee/fetchEmployeeWorkDetails", async ({ employeeId, params }, { rejectWithValue }) => {
  try {
    return getArray<EmployeeWorkDetail>(await getEmployeeWorkDetails(employeeId, params));
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Unable to load employee work details."));
  }
});

export const fetchEmployeeMonthlyWorkDetail = createAsyncThunk<
  EmployeeWorkDetail,
  { employeeId: string; year: number; month: number },
  { rejectValue: string }
>("employee/fetchEmployeeMonthlyWorkDetail", async (input, { rejectWithValue }) => {
  try {
    return unwrapApiData<EmployeeWorkDetail>(
      await getEmployeeMonthlyWorkDetails(input.employeeId, input.year, input.month),
    );
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Unable to load monthly work details."));
  }
});

export const fetchUnpaidWorkDetails = createAsyncThunk<
  EmployeeWorkDetail[],
  void,
  { rejectValue: string }
>("employee/fetchUnpaidWorkDetails", async (_, { rejectWithValue }) => {
  try {
    return getArray<EmployeeWorkDetail>(await getUnpaidWorkDetails());
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Unable to load unpaid work details."));
  }
});

export const updateSalaryStatusAction = createAsyncThunk<
  { workDetailId: string; salaryStatus: "paid" | "unpaid" },
  { workDetailId: string; salaryStatus: "paid" | "unpaid" },
  { rejectValue: string }
>("employee/updateSalaryStatus", async (input, { rejectWithValue }) => {
  try {
    await updateSalaryStatus(input.workDetailId, input.salaryStatus);
    return input;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Unable to update salary status."));
  }
});

export const fetchWorkShots = createAsyncThunk<
  { workDetailId: string; workShots: EmployeeWorkShot[] },
  string,
  { rejectValue: string }
>("employee/fetchWorkShots", async (workDetailId, { rejectWithValue }) => {
  try {
    return {
      workDetailId,
      workShots: getArray<EmployeeWorkShot>(await getWorkShots(workDetailId)),
    };
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Unable to load work shots."));
  }
});

export const fetchMyWorkShots = createAsyncThunk<
  { workDetailId: string; workShots: EmployeeWorkShot[] },
  string,
  { rejectValue: string }
>("employee/fetchMyWorkShots", async (workDetailId, { rejectWithValue }) => {
  try {
    return {
      workDetailId,
      workShots: getArray<EmployeeWorkShot>(await getMyWorkShots(workDetailId)),
    };
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Unable to load your work shots."));
  }
});

export const fetchWorkShot = createAsyncThunk<
  EmployeeWorkShot,
  string,
  { rejectValue: string }
>("employee/fetchWorkShot", async (workShotId, { rejectWithValue }) => {
  try {
    return unwrapApiData<EmployeeWorkShot>(await getWorkShot(workShotId));
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Unable to load work shot."));
  }
});

export const deleteWorkShotAction = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("employee/deleteWorkShot", async (workShotId, { rejectWithValue }) => {
  try {
    await deleteWorkShot(workShotId);
    return workShotId;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Unable to delete work shot."));
  }
});

const replaceWorkDetail = (items: EmployeeWorkDetail[], workDetail: EmployeeWorkDetail) => {
  const index = items.findIndex((item) => item.id === workDetail.id);

  if (index >= 0) {
    items[index] = workDetail;
  } else {
    items.unshift(workDetail);
  }
};

const employeeSlice = createSlice({
  name: "employee",
  initialState,
  reducers: {
    clearEmployeeError: (state) => {
      state.error = null;
    },
    clearEmployeeData: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyWorkDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyWorkDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myWorkDetails = action.payload;
      })
      .addCase(fetchMyWorkDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Unable to load your work details.";
      })
      .addCase(fetchMyMonthlyWorkDetail.fulfilled, (state, action) => {
        replaceWorkDetail(state.myWorkDetails, action.payload);
      })
      .addCase(fetchAdminWorkDetails.fulfilled, (state, action) => {
        state.adminWorkDetails = action.payload;
      })
      .addCase(fetchEmployeeWorkDetails.fulfilled, (state, action) => {
        state.adminWorkDetails = action.payload;
      })
      .addCase(fetchEmployeeMonthlyWorkDetail.fulfilled, (state, action) => {
        replaceWorkDetail(state.adminWorkDetails, action.payload);
      })
      .addCase(fetchUnpaidWorkDetails.fulfilled, (state, action) => {
        state.unpaidWorkDetails = action.payload;
      })
      .addCase(updateSalaryStatusAction.fulfilled, (state, action) => {
        const applyStatus = (items: EmployeeWorkDetail[]) => {
          const workDetail = items.find((item) => item.id === action.payload.workDetailId);
          if (workDetail) {
            workDetail.salaryStatus = action.payload.salaryStatus;
          }
        };

        applyStatus(state.myWorkDetails);
        applyStatus(state.adminWorkDetails);
        applyStatus(state.unpaidWorkDetails);
      })
      .addCase(fetchWorkShots.fulfilled, (state, action) => {
        state.workShots[action.payload.workDetailId] = action.payload.workShots;
      })
      .addCase(fetchMyWorkShots.fulfilled, (state, action) => {
        state.workShots[action.payload.workDetailId] = action.payload.workShots;
      })
      .addCase(fetchWorkShot.fulfilled, (state, action) => {
        state.selectedWorkShot = action.payload;
      })
      .addCase(deleteWorkShotAction.fulfilled, (state, action) => {
        Object.keys(state.workShots).forEach((workDetailId) => {
          state.workShots[workDetailId] = state.workShots[workDetailId].filter(
            (workShot) => workShot.id !== action.payload,
          );
        });
        if (state.selectedWorkShot?.id === action.payload) {
          state.selectedWorkShot = null;
        }
      });
  },
});

export const { clearEmployeeData, clearEmployeeError } = employeeSlice.actions;

export default employeeSlice.reducer;
