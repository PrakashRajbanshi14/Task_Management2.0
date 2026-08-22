import {
  BriefcaseBusiness,
  Clock,
  FileUp,
  LayoutDashboard,
  MessageSquare,
  RotateCcw,
  Upload,
} from "lucide-react";
import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { getConversations } from "../api/chatApi";
import { getMyWorkDetails } from "../api/employeeApi";
import { getNotifications } from "../api/notificationApi";
import { getEmployeeProjects } from "../api/projectApi";
import { getMyAssignedShots } from "../api/shotApi";
import { submitShot } from "../api/submissionApi";
import {
  AppShell,
  Badge,
  EmptyState,
  ErrorBanner,
  LoadingState,
  Panel,
  PrimaryButton,
  StatCard,
  TextInput,
} from "../components/dashboard";
import SEO from "../components/SEO";
import { useAuth } from "../hooks/useAuth";
import type { Conversation } from "../types/chat";
import type { EmployeeWorkDetail, ProjectAssignment } from "../types/employee";
import type { Notification } from "../types/notification";
import type { ShotAssignment } from "../types/shot";
import { getErrorMessage, toArray, unwrapApiData } from "../utils/api";
import { formatDate } from "../utils/formatDate";
import { formatDuration } from "../utils/formatDuration";

const employeeNav = [
  { label: "Overview", to: "/employee", icon: LayoutDashboard },
  { label: "Projects", to: "/employee/projects", icon: BriefcaseBusiness },
  { label: "Shots", to: "/employee/shots", icon: FileUp },
  { label: "Work", to: "/employee/work", icon: Clock },
  { label: "Messages", to: "/employee/messages", icon: MessageSquare },
];

const EmployeeLayout = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        element={
          <AppShell
            title="Employee Dashboard"
            subtitle="Assigned production work"
            navItems={employeeNav}
            user={user}
          />
        }
      >
        <Route index element={<EmployeeOverview />} />
        <Route path="projects" element={<EmployeeProjects />} />
        <Route path="shots" element={<EmployeeShots />} />
        <Route path="work" element={<EmployeeWork />} />
        <Route path="messages" element={<EmployeeMessages />} />
      </Route>
      <Route path="*" element={<Navigate to="/employee" replace />} />
    </Routes>
  );
};

const useEmployeeData = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectAssignment[]>([]);
  const [shots, setShots] = useState<ShotAssignment[]>([]);
  const [workDetails, setWorkDetails] = useState<EmployeeWorkDetail[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [projectResponse, shotResponse, workResponse, notificationResponse] =
        await Promise.allSettled([
          user?.id ? getEmployeeProjects(user.id) : Promise.resolve({ data: [] }),
          getMyAssignedShots(),
          getMyWorkDetails(),
          getNotifications(),
        ]);

      if (projectResponse.status === "fulfilled") {
        setProjects(toArray<ProjectAssignment>(unwrapApiData(projectResponse.value)));
      }

      if (shotResponse.status === "fulfilled") {
        setShots(toArray<ShotAssignment>(unwrapApiData(shotResponse.value)));
      }

      if (workResponse.status === "fulfilled") {
        setWorkDetails(toArray<EmployeeWorkDetail>(unwrapApiData(workResponse.value)));
      }

      if (notificationResponse.status === "fulfilled") {
        setNotifications(toArray<Notification>(unwrapApiData(notificationResponse.value)));
      }

      const rejected = [
        projectResponse,
        shotResponse,
        workResponse,
        notificationResponse,
      ].find((result) => result.status === "rejected");

      if (rejected?.status === "rejected") {
        setError(getErrorMessage(rejected.reason, "Some employee data could not be loaded."));
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [load]);

  return { projects, shots, workDetails, notifications, loading, error, load };
};

const EmployeeOverview = () => {
  const { projects, shots, workDetails, notifications, loading, error } = useEmployeeData();
  const stats = useMemo(
    () => ({
      pending: shots.filter((item) => item.status !== "Completed").length,
      redo: shots.filter((item) => item.status === "Redo").length,
      totalDuration: workDetails.reduce(
        (sum, item) => sum + Number(item.totalVideoLength ?? 0),
        0,
      ),
      unread: notifications.filter((item) => !item.isRead).length,
    }),
    [shots, workDetails, notifications],
  );

  if (loading) {
    return <LoadingState label="Loading employee dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <SEO
        title="Employee Dashboard"
        description="Employee dashboard for assigned projects, shots, submissions, deadlines, and notifications."
        noIndex
      />
      {error ? <ErrorBanner message={error} /> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Assigned projects" value={projects.length} icon={BriefcaseBusiness} />
        <StatCard label="Assigned shots" value={shots.length} icon={FileUp} />
        <StatCard label="Pending work" value={stats.pending} icon={RotateCcw} />
        <StatCard label="Total duration" value={formatDuration(stats.totalDuration)} icon={Clock} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Upcoming Shots">
          {shots.length === 0 ? (
            <EmptyState
              title="No shots assigned"
              description="Assigned shots will appear here with deadlines and status."
            />
          ) : (
            <ShotList shots={shots.slice(0, 5)} />
          )}
        </Panel>
        <Panel title="Notifications">
          {notifications.length === 0 ? (
            <EmptyState title="No notifications" description="Updates from managers and admins will appear here." />
          ) : (
            <div className="space-y-3">
              {notifications.slice(0, 5).map((notification) => (
                <div key={notification.id} className="rounded-lg bg-neutral-50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{notification.title}</p>
                    {!notification.isRead ? <Badge tone="teal">New</Badge> : null}
                  </div>
                  <p className="mt-1 text-sm text-neutral-500">{notification.message}</p>
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 text-sm text-neutral-500">{stats.unread} unread notification(s)</p>
        </Panel>
      </div>
    </div>
  );
};

const EmployeeProjects = () => {
  const { projects, loading, error } = useEmployeeData();

  if (loading) {
    return <LoadingState label="Loading assigned projects..." />;
  }

  return (
    <div className="space-y-6">
      <SEO
        title="Assigned Projects"
        description="Employee assigned project list with project priority, status, and deadline."
        noIndex
      />
      {error ? <ErrorBanner message={error} /> : null}
      <Panel title="Assigned Projects">
        {projects.length === 0 ? (
          <EmptyState title="No projects assigned" description="Your project assignments will appear here." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((assignment) => {
              const project = assignment.Project ?? assignment.project;
              return (
                <article key={assignment.id} className="rounded-lg border border-neutral-200 p-4">
                  <h3 className="font-bold">{project?.name ?? assignment.projectId}</h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-500">
                    {project?.description ?? "No project description"}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge tone="teal">{project?.status ?? "assigned"}</Badge>
                    <Badge tone="yellow">{project?.priority ?? "priority"}</Badge>
                    <Badge tone="neutral">Due {formatDate(project?.endDate)}</Badge>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
};

const EmployeeShots = () => {
  const { shots, loading, error, load } = useEmployeeData();
  const [selectedShotId, setSelectedShotId] = useState("");
  const [videoLength, setVideoLength] = useState("");
  const [video, setVideo] = useState<File | null>(null);
  const [projectFiles, setProjectFiles] = useState<File[]>([]);
  const [notice, setNotice] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedShotId || !videoLength) {
      setNotice("Choose a shot and add the video length in seconds.");
      return;
    }

    try {
      await submitShot(selectedShotId, {
        videoLength: Number(videoLength),
        video,
        projectFiles,
      });
      setNotice("Submission uploaded successfully.");
      setVideo(null);
      setProjectFiles([]);
      setVideoLength("");
      await load();
    } catch (requestError) {
      setNotice(getErrorMessage(requestError, "Unable to submit work."));
    }
  };

  if (loading) {
    return <LoadingState label="Loading assigned shots..." />;
  }

  return (
    <div className="space-y-6">
      <SEO
        title="Assigned Shots"
        description="Employee shot list with submission upload controls and review status."
        noIndex
      />
      {error ? <ErrorBanner message={error} /> : null}
      {notice ? <ErrorBanner message={notice} /> : null}
      <Panel title="Submit Work">
        <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-neutral-700">Shot</span>
            <select
              value={selectedShotId}
              onChange={(event) => setSelectedShotId(event.target.value)}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
            >
              <option value="">Select shot</option>
              {shots.map((assignment) => {
                const shot = assignment.ProjectShot ?? assignment.shot;
                return (
                  <option key={assignment.id} value={assignment.shotId}>
                    {shot ? `Shot ${shot.shotNumber} - ${shot.title}` : assignment.shotId}
                  </option>
                );
              })}
            </select>
          </label>
          <TextInput
            label="Video length"
            type="number"
            value={videoLength}
            onChange={setVideoLength}
            placeholder="Seconds"
          />
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-neutral-700">Video file</span>
            <input
              type="file"
              accept="video/*"
              onChange={(event) => setVideo(event.target.files?.[0] ?? null)}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-neutral-700">Project files</span>
            <input
              type="file"
              multiple
              onChange={(event) => setProjectFiles(Array.from(event.target.files ?? []))}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
            />
          </label>
          <div className="lg:col-span-2">
            <PrimaryButton type="submit">
              <Upload size={16} />
              Upload submission
            </PrimaryButton>
          </div>
        </form>
      </Panel>
      <Panel title="Assigned Shots">
        {shots.length === 0 ? (
          <EmptyState title="No shots assigned" description="Your shot assignments will appear here." />
        ) : (
          <ShotList shots={shots} />
        )}
      </Panel>
    </div>
  );
};

const EmployeeWork = () => {
  const { workDetails, loading, error } = useEmployeeData();

  if (loading) {
    return <LoadingState label="Loading work history..." />;
  }

  return (
    <div className="space-y-6">
      <SEO
        title="Work History"
        description="Employee monthly work detail and salary status."
        noIndex
      />
      {error ? <ErrorBanner message={error} /> : null}
      <Panel title="Monthly Work Details">
        {workDetails.length === 0 ? (
          <EmptyState title="No work history" description="Monthly work records will appear after submissions are reviewed." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-3 py-3">Month</th>
                  <th className="px-3 py-3">Duration</th>
                  <th className="px-3 py-3">Salary</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {workDetails.map((detail) => (
                  <tr key={detail.id}>
                    <td className="px-3 py-3 font-medium">
                      {detail.month}/{detail.year}
                    </td>
                    <td className="px-3 py-3 text-neutral-600">
                      {formatDuration(Number(detail.totalVideoLength))}
                    </td>
                    <td className="px-3 py-3 text-neutral-600">
                      {detail.salaryAmount ? `$${detail.salaryAmount}` : "Not set"}
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={detail.salaryStatus === "paid" ? "green" : "yellow"}>
                        {detail.salaryStatus}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-neutral-600">{detail.notes ?? "No notes"}</td>
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

const EmployeeMessages = () => {
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
        title="Employee Messages"
        description="Employee chat and call conversation list."
        noIndex
      />
      {error ? <ErrorBanner message={error} /> : null}
      <Panel title="Conversations">
        {conversations.length === 0 ? (
          <EmptyState
            title="No conversations"
            description="Messages with admins and project managers will appear here."
          />
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

const ShotList = ({ shots }: { shots: ShotAssignment[] }) => (
  <div className="grid gap-3">
    {shots.map((assignment) => {
      const shot = assignment.ProjectShot ?? assignment.shot;
      return (
        <article
          key={assignment.id}
          className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-semibold">
              {shot ? `Shot ${shot.shotNumber} - ${shot.title}` : assignment.shotId}
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              {shot?.script ?? "No script attached"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Badge tone={assignment.status === "Redo" ? "red" : "blue"}>{assignment.status}</Badge>
            <Badge tone="neutral">Due {formatDate(shot?.deadline)}</Badge>
          </div>
        </article>
      );
    })}
  </div>
);

export default EmployeeLayout;
