import {
  CalendarClock,
  CheckSquare,
  ClipboardCheck,
  FolderPlus,
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  Plus,
  Send,
} from "lucide-react";
import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { getConversations } from "../api/chatApi";
import { assignEmployeesToProject, createProject, getProjects } from "../api/projectApi";
import { assignShotToEmployee, createShot, getProjectShots } from "../api/shotApi";
import {
  AppShell,
  Badge,
  EmptyState,
  ErrorBanner,
  LoadingState,
  Panel,
  PrimaryButton,
  SecondaryButton,
  SelectInput,
  StatCard,
  TextInput,
} from "../components/dashboard";
import SEO from "../components/SEO";
import { useAuth } from "../hooks/useAuth";
import type { Conversation } from "../types/chat";
import type { Project, ProjectPayload } from "../types/project";
import type { Shot } from "../types/shot";
import { getErrorMessage, toArray, unwrapApiData } from "../utils/api";
import { formatDate } from "../utils/formatDate";

const managerNav = [
  { label: "Overview", to: "/project-manager", icon: LayoutDashboard },
  { label: "Projects", to: "/project-manager/projects", icon: FolderPlus },
  { label: "Shots", to: "/project-manager/shots", icon: ListChecks },
  { label: "Messages", to: "/project-manager/messages", icon: MessageSquare },
];

const ProjectManagerLayout = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        element={
          <AppShell
            title="Project Manager"
            subtitle="Production planning and reviews"
            navItems={managerNav}
            user={user}
          />
        }
      >
        <Route index element={<ManagerOverview />} />
        <Route path="projects" element={<ManagerProjects />} />
        <Route path="shots" element={<ManagerShots />} />
        <Route path="messages" element={<ManagerMessages />} />
      </Route>
      <Route path="*" element={<Navigate to="/project-manager" replace />} />
    </Routes>
  );
};

const useManagerData = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getProjects();
      setProjects(toArray<Project>(unwrapApiData(response)));
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to load project manager data."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [load]);

  return { projects, loading, error, load };
};

const ManagerOverview = () => {
  const { projects, loading, error } = useManagerData();
  const stats = useMemo(
    () => ({
      active: projects.filter((project) => project.status === "active").length,
      completed: projects.filter((project) => project.status === "completed").length,
      urgent: projects.filter((project) => project.priority === "urgent").length,
    }),
    [projects],
  );

  if (loading) {
    return <LoadingState label="Loading manager dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <SEO
        title="Project Manager Dashboard"
        description="Project manager dashboard for project status, priorities, shots, and assignments."
        noIndex
      />
      {error ? <ErrorBanner message={error} /> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total projects" value={projects.length} icon={FolderPlus} />
        <StatCard label="Active projects" value={stats.active} icon={CalendarClock} />
        <StatCard label="Completed" value={stats.completed} icon={ClipboardCheck} />
        <StatCard label="Urgent" value={stats.urgent} icon={CheckSquare} />
      </div>

      <Panel title="Project Queue">
        {projects.length === 0 ? (
          <EmptyState
            title="No projects yet"
            description="Create a project to start adding shots and assigning employees."
          />
        ) : (
          <ProjectGrid projects={projects.slice(0, 6)} />
        )}
      </Panel>
    </div>
  );
};

const ManagerProjects = () => {
  const { projects, loading, error, load } = useManagerData();
  const [form, setForm] = useState<ProjectPayload>({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    status: "planned",
    priority: "medium",
  });
  const [assignmentProjectId, setAssignmentProjectId] = useState("");
  const [employeeIds, setEmployeeIds] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setNotice("");

    try {
      await createProject(form);
      setForm({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        status: "planned",
        priority: "medium",
      });
      setNotice("Project created successfully.");
      await load();
    } catch (requestError) {
      setNotice(getErrorMessage(requestError, "Unable to create project."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssign = async () => {
    const ids = employeeIds
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (!assignmentProjectId || ids.length === 0) {
      setNotice("Choose a project and enter at least one employee ID.");
      return;
    }

    setSubmitting(true);
    try {
      await assignEmployeesToProject(assignmentProjectId, { employeeIds: ids });
      setNotice(`${ids.length} employee(s) assigned to the project.`);
      setEmployeeIds("");
    } catch (requestError) {
      setNotice(getErrorMessage(requestError, "Unable to assign employees."));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState label="Loading projects..." />;
  }

  return (
    <div className="space-y-6">
      <SEO
        title="Manage Projects"
        description="Create, search, filter, prioritize, and assign projects."
        noIndex
      />
      {error ? <ErrorBanner message={error} /> : null}
      {notice ? <ErrorBanner message={notice} /> : null}

      <Panel title="Create Project">
        <form onSubmit={handleCreate} className="grid gap-4 lg:grid-cols-2">
          <TextInput
            label="Project name"
            value={form.name}
            onChange={(value) => setForm((current) => ({ ...current, name: value }))}
            placeholder="Advertisement"
          />
          <TextInput
            label="Description"
            value={form.description ?? ""}
            onChange={(value) => setForm((current) => ({ ...current, description: value }))}
            placeholder="Short brief"
          />
          <TextInput
            label="Start date"
            type="date"
            value={form.startDate ?? ""}
            onChange={(value) => setForm((current) => ({ ...current, startDate: value }))}
          />
          <TextInput
            label="Deadline"
            type="date"
            value={form.endDate ?? ""}
            onChange={(value) => setForm((current) => ({ ...current, endDate: value }))}
          />
          <SelectInput
            label="Status"
            value={form.status ?? "planned"}
            onChange={(value) =>
              setForm((current) => ({ ...current, status: value as ProjectPayload["status"] }))
            }
            options={[
              { label: "Planned", value: "planned" },
              { label: "Active", value: "active" },
              { label: "On hold", value: "on_hold" },
              { label: "Completed", value: "completed" },
              { label: "Cancelled", value: "cancelled" },
            ]}
          />
          <SelectInput
            label="Priority"
            value={form.priority ?? "medium"}
            onChange={(value) =>
              setForm((current) => ({ ...current, priority: value as ProjectPayload["priority"] }))
            }
            options={[
              { label: "Low", value: "low" },
              { label: "Medium", value: "medium" },
              { label: "High", value: "high" },
              { label: "Urgent", value: "urgent" },
            ]}
          />
          <div className="lg:col-span-2">
            <PrimaryButton type="submit" disabled={submitting || !form.name.trim()}>
              <Plus size={16} />
              Create project
            </PrimaryButton>
          </div>
        </form>
      </Panel>

      <Panel title="Assign Employees">
        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr_auto] lg:items-end">
          <SelectInput
            label="Project"
            value={assignmentProjectId}
            onChange={setAssignmentProjectId}
            options={[
              { label: "Select project", value: "" },
              ...projects.map((project) => ({ label: project.name, value: project.id })),
            ]}
          />
          <TextInput
            label="Employee IDs"
            value={employeeIds}
            onChange={setEmployeeIds}
            placeholder="id-one, id-two, id-three"
          />
          <PrimaryButton onClick={handleAssign} disabled={submitting}>
            <Send size={16} />
            Assign selected
          </PrimaryButton>
        </div>
        <p className="mt-3 text-sm text-neutral-500">
          The backend does not currently expose an all-employees endpoint, so this production
          control accepts multiple employee IDs while preserving the multi-assign workflow.
        </p>
      </Panel>

      <Panel title="Projects">
        {projects.length === 0 ? (
          <EmptyState title="No projects" description="Created projects will show here." />
        ) : (
          <ProjectGrid projects={projects} />
        )}
      </Panel>
    </div>
  );
};

const ManagerShots = () => {
  const { projects, loading, error } = useManagerData();
  const [projectId, setProjectId] = useState("");
  const [shots, setShots] = useState<Shot[]>([]);
  const [selectedShotIds, setSelectedShotIds] = useState<string[]>([]);
  const [employeeIds, setEmployeeIds] = useState("");
  const [shotForm, setShotForm] = useState({
    shotNumber: "",
    title: "",
    script: "",
    deadline: "",
  });
  const [notice, setNotice] = useState("");
  const [shotLoading, setShotLoading] = useState(false);

  const loadShots = useCallback(async (selectedProjectId: string) => {
    if (!selectedProjectId) {
      setShots([]);
      return;
    }

    setShotLoading(true);
    setNotice("");

    try {
      const response = await getProjectShots(selectedProjectId);
      setShots(toArray<Shot>(unwrapApiData(response)));
      setSelectedShotIds([]);
    } catch (requestError) {
      setNotice(getErrorMessage(requestError, "Unable to load project shots."));
    } finally {
      setShotLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadShots(projectId), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadShots, projectId]);

  const toggleShot = (shotId: string) => {
    setSelectedShotIds((current) =>
      current.includes(shotId)
        ? current.filter((id) => id !== shotId)
        : [...current, shotId],
    );
  };

  const toggleAll = () => {
    setSelectedShotIds((current) =>
      current.length === shots.length ? [] : shots.map((shot) => shot.id),
    );
  };

  const handleCreateShot = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!projectId) {
      setNotice("Choose a project before creating a shot.");
      return;
    }

    try {
      await createShot(projectId, {
        shotNumber: Number(shotForm.shotNumber),
        title: shotForm.title,
        script: shotForm.script,
        deadline: shotForm.deadline,
      });
      setShotForm({ shotNumber: "", title: "", script: "", deadline: "" });
      setNotice("Shot created successfully.");
      await loadShots(projectId);
    } catch (requestError) {
      setNotice(getErrorMessage(requestError, "Unable to create shot."));
    }
  };

  const handleAssignShots = async () => {
    const ids = employeeIds
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (selectedShotIds.length === 0 || ids.length === 0) {
      setNotice("Select at least one shot and enter at least one employee ID.");
      return;
    }

    try {
      await Promise.all(
        selectedShotIds.flatMap((shotId) =>
          ids.map((employeeId) => assignShotToEmployee(shotId, employeeId)),
        ),
      );
      setNotice(`${selectedShotIds.length} shot(s) assigned to ${ids.length} employee(s).`);
      setEmployeeIds("");
      setSelectedShotIds([]);
      await loadShots(projectId);
    } catch (requestError) {
      setNotice(getErrorMessage(requestError, "Unable to assign selected shots."));
    }
  };

  if (loading) {
    return <LoadingState label="Loading shot workspace..." />;
  }

  return (
    <div className="space-y-6">
      <SEO
        title="Manage Shots"
        description="Create, filter, select, and assign shots to employees."
        noIndex
      />
      {error ? <ErrorBanner message={error} /> : null}
      {notice ? <ErrorBanner message={notice} /> : null}

      <Panel title="Shot Workspace">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <SelectInput
            label="Project"
            value={projectId}
            onChange={setProjectId}
            options={[
              { label: "Select project", value: "" },
              ...projects.map((project) => ({ label: project.name, value: project.id })),
            ]}
          />
          <SecondaryButton onClick={toggleAll} disabled={shots.length === 0}>
            <CheckSquare size={16} />
            {selectedShotIds.length === shots.length ? "Deselect all" : "Select all"}
          </SecondaryButton>
        </div>
      </Panel>

      <Panel title="Create Shot">
        <form onSubmit={handleCreateShot} className="grid gap-4 lg:grid-cols-4">
          <TextInput
            label="Shot number"
            type="number"
            value={shotForm.shotNumber}
            onChange={(value) => setShotForm((current) => ({ ...current, shotNumber: value }))}
            placeholder="1"
          />
          <TextInput
            label="Title"
            value={shotForm.title}
            onChange={(value) => setShotForm((current) => ({ ...current, title: value }))}
            placeholder="Intro"
          />
          <TextInput
            label="Deadline"
            type="date"
            value={shotForm.deadline}
            onChange={(value) => setShotForm((current) => ({ ...current, deadline: value }))}
          />
          <div className="lg:self-end">
            <PrimaryButton
              type="submit"
              disabled={!projectId || !shotForm.shotNumber || !shotForm.title.trim()}
            >
              <Plus size={16} />
              Add shot
            </PrimaryButton>
          </div>
          <div className="lg:col-span-4">
            <TextInput
              label="Script"
              value={shotForm.script}
              onChange={(value) => setShotForm((current) => ({ ...current, script: value }))}
              placeholder="Shot script or notes"
            />
          </div>
        </form>
      </Panel>

      <Panel
        title="Assign Selected Shots"
        action={<Badge tone="teal">{selectedShotIds.length} selected</Badge>}
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <TextInput
            label="Employee IDs"
            value={employeeIds}
            onChange={setEmployeeIds}
            placeholder="id-one, id-two"
          />
          <PrimaryButton onClick={handleAssignShots}>
            <Send size={16} />
            Assign
          </PrimaryButton>
        </div>
      </Panel>

      <Panel title="Shots">
        {shotLoading ? <LoadingState label="Loading shots..." /> : null}
        {!shotLoading && shots.length === 0 ? (
          <EmptyState title="No shots" description="Choose a project and create its shots." />
        ) : null}
        {!shotLoading && shots.length > 0 ? (
          <div className="grid gap-3">
            {shots.map((shot) => (
              <label
                key={shot.id}
                className="flex cursor-pointer flex-col gap-3 rounded-lg border border-neutral-200 p-4 transition hover:bg-neutral-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedShotIds.includes(shot.id)}
                    onChange={() => toggleShot(shot.id)}
                    className="mt-1 h-4 w-4 rounded border-neutral-300 text-teal-700 focus:ring-teal-600"
                  />
                  <div>
                    <p className="font-semibold">
                      Shot {shot.shotNumber} - {shot.title}
                    </p>
                    <p className="mt-1 text-sm text-neutral-500">{shot.script ?? "No script"}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <Badge tone="blue">{shot.status}</Badge>
                  <Badge tone="neutral">{formatDate(shot.deadline)}</Badge>
                </div>
              </label>
            ))}
          </div>
        ) : null}
      </Panel>
    </div>
  );
};

const ManagerMessages = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getConversations()
      .then((response) => setConversations(toArray<Conversation>(unwrapApiData(response))))
      .catch((requestError) =>
        setError(getErrorMessage(requestError, "Unable to load conversations.")),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingState label="Loading conversations..." />;
  }

  return (
    <div className="space-y-6">
      <SEO
        title="Project Manager Messages"
        description="Project manager chat and call conversation list."
        noIndex
      />
      {error ? <ErrorBanner message={error} /> : null}
      <Panel title="Conversations">
        {conversations.length === 0 ? (
          <EmptyState title="No conversations" description="Chats with employees and admins will appear here." />
        ) : (
          <div className="space-y-3">
            {conversations.map((conversation) => (
              <div key={conversation.id} className="rounded-lg border border-neutral-200 p-4">
                <p className="font-semibold">Conversation {conversation.id.slice(0, 8)}</p>
                <p className="text-sm text-neutral-500">Updated {formatDate(conversation.updatedAt)}</p>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
};

const ProjectGrid = ({ projects }: { projects: Project[] }) => (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {projects.map((project) => (
      <article key={project.id} className="rounded-lg border border-neutral-200 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold">{project.name}</h3>
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-neutral-500">
              {project.description ?? "No description"}
            </p>
          </div>
          <Badge tone={project.priority === "urgent" ? "red" : "yellow"}>{project.priority}</Badge>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone={project.status === "active" ? "teal" : "neutral"}>{project.status}</Badge>
          <Badge tone="neutral">Due {formatDate(project.endDate)}</Badge>
        </div>
      </article>
    ))}
  </div>
);

export default ProjectManagerLayout;
