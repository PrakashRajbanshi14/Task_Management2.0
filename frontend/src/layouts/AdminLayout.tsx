import {
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FolderKanban,
  MessageSquare,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { getConversations } from "../api/chatApi";
import {
  getAdminWorkDetails,
  getUnpaidWorkDetails,
  updateSalaryStatus,
} from "../api/employeeApi";
import { getProjects } from "../api/projectApi";
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
import type { EmployeeWorkDetail } from "../types/employee";
import type { Project } from "../types/project";
import { getErrorMessage, toArray, unwrapApiData } from "../utils/api";
import { formatDate } from "../utils/formatDate";
import { formatDuration } from "../utils/formatDuration";

const adminNav = [
  { label: "Overview", to: "/admin", icon: BarChart3 },
  { label: "Projects", to: "/admin/projects", icon: FolderKanban },
  { label: "Payroll", to: "/admin/payroll", icon: CreditCard },
  { label: "Messages", to: "/admin/messages", icon: MessageSquare },
];

const AdminLayout = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        element={
          <AppShell
            title="Admin Dashboard"
            subtitle="System-wide operations"
            navItems={adminNav}
            user={user}
          />
        }
      >
        <Route index element={<AdminOverview />} />
        <Route path="projects" element={<AdminProjects />} />
        <Route path="payroll" element={<AdminPayroll />} />
        <Route path="messages" element={<AdminMessages />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
};

const useAdminData = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [workDetails, setWorkDetails] = useState<EmployeeWorkDetail[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [projectResponse, workResponse, chatResponse] = await Promise.allSettled([
        getProjects(),
        getAdminWorkDetails(),
        getConversations(),
      ]);

      if (projectResponse.status === "fulfilled") {
        setProjects(toArray<Project>(unwrapApiData(projectResponse.value)));
      }

      if (workResponse.status === "fulfilled") {
        setWorkDetails(toArray<EmployeeWorkDetail>(unwrapApiData(workResponse.value)));
      }

      if (chatResponse.status === "fulfilled") {
        setConversations(toArray<Conversation>(unwrapApiData(chatResponse.value)));
      }

      const rejected = [projectResponse, workResponse, chatResponse].find(
        (result) => result.status === "rejected",
      );

      if (rejected?.status === "rejected") {
        setError(getErrorMessage(rejected.reason, "Some admin data could not be loaded."));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void reload(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [reload]);

  return { projects, workDetails, conversations, loading, error, reload };
};

const AdminOverview = () => {
  const { projects, workDetails, conversations, loading, error } = useAdminData();

  const stats = useMemo(() => {
    const activeProjects = projects.filter((project) => project.status === "active").length;
    const completedProjects = projects.filter((project) => project.status === "completed").length;
    const unpaid = workDetails.filter((detail) => detail.salaryStatus === "unpaid").length;

    return { activeProjects, completedProjects, unpaid };
  }, [projects, workDetails]);

  if (loading) {
    return <LoadingState label="Loading admin dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <SEO
        title="Admin Dashboard"
        description="Admin dashboard for projects, payroll, conversations, and system activity."
        noIndex
      />
      {error ? <ErrorBanner message={error} /> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total projects" value={projects.length} icon={BriefcaseBusiness} />
        <StatCard label="Active projects" value={stats.activeProjects} icon={BarChart3} />
        <StatCard label="Completed projects" value={stats.completedProjects} icon={CheckCircle2} />
        <StatCard label="Unpaid records" value={stats.unpaid} icon={CreditCard} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Recent Projects">
          {projects.length === 0 ? (
            <EmptyState
              title="No projects yet"
              description="Projects created by admins or project managers will appear here."
            />
          ) : (
            <ProjectTable projects={projects.slice(0, 6)} />
          )}
        </Panel>

        <Panel title="System Activity">
          <div className="space-y-3">
            <ActivityRow label="Conversations" value={conversations.length} />
            <ActivityRow label="Payroll records" value={workDetails.length} />
            <ActivityRow label="Pending salaries" value={stats.unpaid} />
          </div>
        </Panel>
      </div>
    </div>
  );
};

const AdminProjects = () => {
  const { projects, loading, error } = useAdminData();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = projects.filter((project) => {
    const matchesQuery =
      project.name.toLowerCase().includes(query.toLowerCase()) ||
      (project.description ?? "").toLowerCase().includes(query.toLowerCase());
    const matchesStatus = status === "all" || project.status === status;
    return matchesQuery && matchesStatus;
  });

  if (loading) {
    return <LoadingState label="Loading projects..." />;
  }

  return (
    <div className="space-y-6">
      <SEO
        title="Admin Projects"
        description="Admin project list with search, filters, status, priority, and deadlines."
        noIndex
      />
      {error ? <ErrorBanner message={error} /> : null}

      <Panel
        title="All Projects"
        action={
          <div className="grid gap-3 sm:grid-cols-[220px_180px]">
            <TextInput label="Search" value={query} onChange={setQuery} placeholder="Project name" />
            <SelectInput
              label="Status"
              value={status}
              onChange={setStatus}
              options={[
                { label: "All statuses", value: "all" },
                { label: "Planned", value: "planned" },
                { label: "Active", value: "active" },
                { label: "On hold", value: "on_hold" },
                { label: "Completed", value: "completed" },
                { label: "Cancelled", value: "cancelled" },
              ]}
            />
          </div>
        }
      >
        {filtered.length === 0 ? (
          <EmptyState title="No matching projects" description="Try another search or status filter." />
        ) : (
          <ProjectTable projects={filtered} />
        )}
      </Panel>
    </div>
  );
};

const AdminPayroll = () => {
  const [records, setRecords] = useState<EmployeeWorkDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getUnpaidWorkDetails();
      setRecords(toArray<EmployeeWorkDetail>(unwrapApiData(response)));
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to load payroll records."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [load]);

  const markPaid = async (recordId: string) => {
    await updateSalaryStatus(recordId, "paid");
    await load();
  };

  if (loading) {
    return <LoadingState label="Loading payroll..." />;
  }

  return (
    <div className="space-y-6">
      <SEO
        title="Payroll"
        description="Admin payroll dashboard for salary status and monthly employee work."
        noIndex
      />
      {error ? <ErrorBanner message={error} /> : null}

      <Panel title="Unpaid Salary Records">
        {records.length === 0 ? (
          <EmptyState
            title="No unpaid records"
            description="Monthly employee work records with unpaid salary status will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-3 py-3">Employee</th>
                  <th className="px-3 py-3">Month</th>
                  <th className="px-3 py-3">Duration</th>
                  <th className="px-3 py-3">Amount</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {records.map((record) => (
                  <tr key={record.id}>
                    <td className="px-3 py-3 font-medium">
                      {record.Employee?.fullname ?? record.employee?.fullname ?? record.employeeId}
                    </td>
                    <td className="px-3 py-3 text-neutral-600">
                      {record.month}/{record.year}
                    </td>
                    <td className="px-3 py-3 text-neutral-600">
                      {formatDuration(Number(record.totalVideoLength))}
                    </td>
                    <td className="px-3 py-3 text-neutral-600">
                      {record.salaryAmount ? `$${record.salaryAmount}` : "Not set"}
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone="yellow">Unpaid</Badge>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <PrimaryButton onClick={() => void markPaid(record.id)}>Mark paid</PrimaryButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
};

const AdminMessages = () => {
  const { conversations, loading, error } = useAdminData();

  if (loading) {
    return <LoadingState label="Loading conversations..." />;
  }

  return (
    <div className="space-y-6">
      <SEO
        title="Admin Messages"
        description="Admin conversation list and call activity overview."
        noIndex
      />
      {error ? <ErrorBanner message={error} /> : null}

      <Panel title="Conversations">
        {conversations.length === 0 ? (
          <EmptyState
            title="No conversations yet"
            description="Employee and project manager conversations with admin will appear here."
          />
        ) : (
          <div className="space-y-3">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold">Conversation {conversation.id.slice(0, 8)}</p>
                  <p className="text-sm text-neutral-500">
                    Last updated {formatDate(conversation.updatedAt)}
                  </p>
                </div>
                <SecondaryButton>
                  <MessageSquare size={16} />
                  Open
                </SecondaryButton>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
};

const ProjectTable = ({ projects }: { projects: Project[] }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[760px] text-left text-sm">
      <thead className="text-xs uppercase text-neutral-500">
        <tr>
          <th className="px-3 py-3">
            <span className="inline-flex items-center gap-2">
              <Search size={14} />
              Project
            </span>
          </th>
          <th className="px-3 py-3">Status</th>
          <th className="px-3 py-3">Priority</th>
          <th className="px-3 py-3">Start</th>
          <th className="px-3 py-3">Deadline</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-neutral-100">
        {projects.map((project) => (
          <tr key={project.id}>
            <td className="px-3 py-3">
              <p className="font-semibold">{project.name}</p>
              <p className="line-clamp-1 text-sm text-neutral-500">{project.description ?? "No description"}</p>
            </td>
            <td className="px-3 py-3">
              <Badge tone={project.status === "completed" ? "green" : "teal"}>{project.status}</Badge>
            </td>
            <td className="px-3 py-3">
              <Badge tone={project.priority === "urgent" ? "red" : "yellow"}>{project.priority}</Badge>
            </td>
            <td className="px-3 py-3 text-neutral-600">{formatDate(project.startDate)}</td>
            <td className="px-3 py-3 text-neutral-600">{formatDate(project.endDate)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ActivityRow = ({ label, value }: { label: string; value: number }) => (
  <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-4 py-3">
    <span className="flex items-center gap-2 text-sm text-neutral-600">
      <ClipboardList size={16} />
      {label}
    </span>
    <span className="font-bold">{value}</span>
  </div>
);

export default AdminLayout;
