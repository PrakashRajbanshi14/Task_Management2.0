import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  assignEmployeesToProject,
  createProject,
  deleteProject,
  getEmployeeProjects,
  getProject,
  getProjectEmployees,
  getProjects,
  removeEmployeeFromProject,
  updateProject,
} from "../api/projectApi";
import type { Employee, ProjectAssignment } from "../types/employee";
import type { Project, ProjectAssignmentPayload, ProjectPayload } from "../types/project";
import { getErrorMessage, toArray, unwrapApiData } from "../utils/api";

interface ProjectState {
  items: Project[];
  selected: Project | null;
  projectEmployees: Record<string, Employee[]>;
  employeeProjects: Record<string, ProjectAssignment[]>;
  isLoading: boolean;
  error: string | null;
}

const initialState: ProjectState = {
  items: [],
  selected: null,
  projectEmployees: {},
  employeeProjects: {},
  isLoading: false,
  error: null,
};

export const fetchProjects = createAsyncThunk<Project[], void, { rejectValue: string }>(
  "projects/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return toArray<Project>(unwrapApiData(await getProjects()));
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Unable to load projects."));
    }
  },
);

export const fetchProject = createAsyncThunk<Project, string, { rejectValue: string }>(
  "projects/fetchOne",
  async (projectId, { rejectWithValue }) => {
    try {
      return unwrapApiData<Project>(await getProject(projectId));
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Unable to load the project."));
    }
  },
);

export const createProjectAction = createAsyncThunk<
  Project,
  ProjectPayload,
  { rejectValue: string }
>("projects/create", async (payload, { rejectWithValue }) => {
  try {
    return unwrapApiData<Project>(await createProject(payload));
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Unable to create the project."));
  }
});

export const updateProjectAction = createAsyncThunk<
  Project,
  { projectId: string; payload: ProjectPayload },
  { rejectValue: string }
>("projects/update", async ({ projectId, payload }, { rejectWithValue }) => {
  try {
    return unwrapApiData<Project>(await updateProject(projectId, payload));
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Unable to update the project."));
  }
});

export const deleteProjectAction = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("projects/delete", async (projectId, { rejectWithValue }) => {
  try {
    await deleteProject(projectId);
    return projectId;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Unable to delete the project."));
  }
});

export const fetchProjectEmployees = createAsyncThunk<
  { projectId: string; employees: Employee[] },
  string,
  { rejectValue: string }
>("projects/fetchEmployees", async (projectId, { rejectWithValue }) => {
  try {
    const employees = toArray<Employee>(unwrapApiData(await getProjectEmployees(projectId)));
    return { projectId, employees };
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Unable to load project employees."));
  }
});

export const assignEmployeesAction = createAsyncThunk<
  { projectId: string; assignments: ProjectAssignment[] },
  { projectId: string; payload: ProjectAssignmentPayload },
  { rejectValue: string }
>("projects/assignEmployees", async ({ projectId, payload }, { rejectWithValue }) => {
  try {
    const assignments = toArray<ProjectAssignment>(
      unwrapApiData(await assignEmployeesToProject(projectId, payload)),
    );
    return { projectId, assignments };
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Unable to assign employees."));
  }
});

export const fetchEmployeeProjects = createAsyncThunk<
  { employeeId: string; projects: ProjectAssignment[] },
  string,
  { rejectValue: string }
>("projects/fetchEmployeeProjects", async (employeeId, { rejectWithValue }) => {
  try {
    const projects = toArray<ProjectAssignment>(
      unwrapApiData(await getEmployeeProjects(employeeId)),
    );
    return { employeeId, projects };
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Unable to load employee projects."));
  }
});

export const removeEmployeeFromProjectAction = createAsyncThunk<
  { projectId: string; employeeId: string },
  { projectId: string; employeeId: string },
  { rejectValue: string }
>("projects/removeEmployee", async ({ projectId, employeeId }, { rejectWithValue }) => {
  try {
    await removeEmployeeFromProject(projectId, employeeId);
    return { projectId, employeeId };
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Unable to remove the employee."));
  }
});

const upsertProject = (items: Project[], project: Project) => {
  const index = items.findIndex((item) => item.id === project.id);

  if (index >= 0) {
    items[index] = project;
  } else {
    items.unshift(project);
  }
};

const projectSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    clearProjectError: (state) => {
      state.error = null;
    },
    clearSelectedProject: (state) => {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Unable to load projects.";
      })
      .addCase(fetchProject.fulfilled, (state, action) => {
        state.selected = action.payload;
        upsertProject(state.items, action.payload);
      })
      .addCase(createProjectAction.fulfilled, (state, action) => {
        upsertProject(state.items, action.payload);
      })
      .addCase(updateProjectAction.fulfilled, (state, action) => {
        upsertProject(state.items, action.payload);
        state.selected = action.payload;
      })
      .addCase(deleteProjectAction.fulfilled, (state, action) => {
        state.items = state.items.filter((project) => project.id !== action.payload);
        if (state.selected?.id === action.payload) {
          state.selected = null;
        }
        delete state.projectEmployees[action.payload];
      })
      .addCase(fetchProjectEmployees.fulfilled, (state, action) => {
        state.projectEmployees[action.payload.projectId] = action.payload.employees;
      })
      .addCase(fetchEmployeeProjects.fulfilled, (state, action) => {
        state.employeeProjects[action.payload.employeeId] = action.payload.projects;
      })
      .addCase(removeEmployeeFromProjectAction.fulfilled, (state, action) => {
        const employees = state.projectEmployees[action.payload.projectId];
        if (employees) {
          state.projectEmployees[action.payload.projectId] = employees.filter(
            (employee) => employee.id !== action.payload.employeeId,
          );
        }
      });
  },
});

export const { clearProjectError, clearSelectedProject } = projectSlice.actions;

export default projectSlice.reducer;
