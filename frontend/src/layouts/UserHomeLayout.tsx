import {
  BadgeCheck,
  ClipboardPen,
  IdCard,
  LayoutDashboard,
  Mail,
  UserCircle,
} from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import {
  addEmployeeDetails,
} from "../api/authApi";
import {
  AppShell,
  Badge,
  ErrorBanner,
  Panel,
  PrimaryButton,
  StatCard,
  TextInput,
} from "../components/dashboard";
import SEO from "../components/SEO";
import {
  useAppDispatch,
  useAuth,
} from "../hooks/useAuth";
import {
  fetchCurrentUser,
} from "../store/authSlice";
import {
  getErrorMessage,
} from "../utils/api";

const userNav = [
  {
    label: "Home",
    to: "/home",
    icon: LayoutDashboard,
  },
  {
    label: "Employee Details",
    to: "/home/employee-details",
    icon: ClipboardPen,
  },
];

const UserHomeLayout = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        element={
          <AppShell
            title="Home"
            subtitle="Profile and starter access"
            navItems={userNav}
            user={user}
          />
        }
      >
        <Route index element={<UserHome />} />
        <Route
          path="employee-details"
          element={<EmployeeDetailsForm />}
        />
      </Route>
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

const UserHome = () => {
  const { user } = useAuth();
  const employee = user?.employee;

  return (
    <div className="space-y-6">
      <SEO
        title="Home"
        description="Basic profile dashboard for new users."
        noIndex
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Account"
          value={user?.isActive ? "Active" : "Inactive"}
          helper="Your login status"
          icon={BadgeCheck}
        />
        <StatCard
          label="Role"
          value={user?.role ?? "user"}
          helper="Admin can promote this account"
          icon={UserCircle}
        />
        <StatCard
          label="Profile"
          value={employee ? "Complete" : "Pending"}
          helper="Employee detail status"
          icon={IdCard}
        />
        <StatCard
          label="Access"
          value="Limited"
          helper="Starter dashboard"
          icon={LayoutDashboard}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel title="Profile">
          <div className="space-y-4">
            <ProfileRow
              icon={UserCircle}
              label="Name"
              value={user?.fullName}
            />
            <ProfileRow
              icon={Mail}
              label="Email"
              value={user?.email}
            />
            <ProfileRow
              icon={IdCard}
              label="Username"
              value={user?.userName}
            />
            <div className="pt-2">
              <Badge tone={employee ? "green" : "yellow"}>
                {employee ? "Employee details saved" : "Employee details needed"}
              </Badge>
            </div>
          </div>
        </Panel>

        <Panel title="Employee Details">
          {employee ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailBlock label="Full name" value={employee.fullname} />
              <DetailBlock label="Contact" value={employee.contact} />
              <DetailBlock label="Job title" value={employee.jobTitle} />
              <DetailBlock label="Employee code" value={employee.employeeCode} />
              <div className="sm:col-span-2">
                <DetailBlock label="Address" value={employee.address} />
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-neutral-300 p-5">
              <p className="font-semibold text-neutral-950">
                Submit your employee details
              </p>
              <p className="mt-2 text-sm leading-6 text-neutral-500">
                This account can view profile information now. After your
                details are saved and an admin promotes the account, the full
                employee dashboard becomes available.
              </p>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
};

const EmployeeDetailsForm = () => {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const employee = user?.employee;
  const [fullname, setFullname] = useState(user?.fullName ?? "");
  const [contact, setContact] = useState(employee?.contact ?? "");
  const [address, setAddress] = useState(employee?.address ?? "");
  const [jobTitle, setJobTitle] = useState(employee?.jobTitle ?? "");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setNotice("");

    if (!user?.id) {
      setNotice("Unable to read the current user.");
      return;
    }

    if (
      !fullname.trim() ||
      !contact.trim() ||
      !address.trim() ||
      !jobTitle.trim()
    ) {
      setNotice("Please complete all employee detail fields.");
      return;
    }

    setSubmitting(true);

    try {
      await addEmployeeDetails(user.id, {
        fullname: fullname.trim(),
        contact: contact.trim(),
        address: address.trim(),
        jobTitle: jobTitle.trim(),
      });
      await dispatch(fetchCurrentUser()).unwrap();
      setNotice("Employee details saved successfully.");
    } catch (requestError) {
      setNotice(
        getErrorMessage(
          requestError,
          "Unable to save employee details.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SEO
        title="Employee Details"
        description="Submit employee profile details for starter account access."
        noIndex
      />

      {notice ? <ErrorBanner message={notice} /> : null}

      <Panel title="Submit Employee Details">
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 lg:grid-cols-2"
        >
          <TextInput
            label="Full name"
            value={fullname}
            onChange={setFullname}
            placeholder="Your full name"
          />
          <TextInput
            label="Contact"
            value={contact}
            onChange={setContact}
            placeholder="Phone number"
          />
          <TextInput
            label="Job title"
            value={jobTitle}
            onChange={setJobTitle}
            placeholder="Video editor"
          />
          <TextInput
            label="Address"
            value={address}
            onChange={setAddress}
            placeholder="Your address"
          />
          <div className="lg:col-span-2">
            <PrimaryButton type="submit" disabled={submitting}>
              <ClipboardPen size={16} />
              {submitting ? "Saving..." : "Save details"}
            </PrimaryButton>
          </div>
        </form>
      </Panel>
    </div>
  );
};

const ProfileRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserCircle;
  label: string;
  value?: string | null;
}) => (
  <div className="flex items-center gap-3 rounded-lg bg-neutral-50 p-3">
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
      <Icon size={18} />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase text-neutral-500">
        {label}
      </p>
      <p className="truncate text-sm font-semibold">
        {value || "Not set"}
      </p>
    </div>
  </div>
);

const DetailBlock = ({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) => (
  <div className="rounded-lg bg-neutral-50 p-4">
    <p className="text-xs font-semibold uppercase text-neutral-500">
      {label}
    </p>
    <p className="mt-1 font-semibold">{value || "Not set"}</p>
  </div>
);

export default UserHomeLayout;
