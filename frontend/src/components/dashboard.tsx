import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  Bell,
  ChevronDown,
  CircleAlert,
  LoaderCircle,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";

import { getNotifications, markAllNotificationsRead } from "../api/notificationApi";
import { logoutUser } from "../store/authSlice";
import type { User } from "../types/auth";
import type { Notification } from "../types/notification";
import { getErrorMessage, toArray, unwrapApiData } from "../utils/api";
import { formatDate } from "../utils/formatDate";
import { useAppDispatch } from "../hooks/useAuth";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

interface AppShellProps {
  title: string;
  subtitle: string;
  navItems: NavItem[];
  user: User | null;
}

const roleHome = (role?: string) => {
  if (role === "admin") {
    return "/admin";
  }

  if (role === "projectManager") {
    return "/project-manager";
  }

  if (role === "employee") {
    return "/employee";
  }

  if (role === "user") {
    return "/home";
  }

  return "/login";
};

export const AppShell = ({ title, subtitle, navItems, user }: AppShellProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-stone-50 text-neutral-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-neutral-200 bg-white lg:block">
        <div className="flex h-full flex-col">
          <Link to={roleHome(user?.role)} className="border-b border-neutral-200 px-6 py-5">
            <p className="text-sm font-semibold text-teal-700">TaskFlow Studio</p>
            <h1 className="mt-1 text-xl font-bold">{title}</h1>
          </Link>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to.split("/").length <= 2}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                    isActive
                      ? "bg-teal-50 text-teal-800"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950",
                  ].join(" ")
                }
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-neutral-200 p-4">
            <div className="mb-4 flex items-center gap-3 rounded-lg bg-neutral-50 p-3">
              <Avatar user={user} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{user?.fullName ?? "User"}</p>
                <p className="truncate text-xs text-neutral-500">{user?.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-lg border border-neutral-200 p-2 text-neutral-700 lg:hidden"
                aria-label="Open navigation"
              >
                <Menu size={20} />
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm text-neutral-500">{subtitle}</p>
                <h2 className="truncate text-lg font-bold sm:text-xl">{title}</h2>
              </div>
            </div>
            <NotificationBell />
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-neutral-950/40"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative h-full w-80 max-w-[86vw] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-4">
              <div>
                <p className="text-sm font-semibold text-teal-700">TaskFlow Studio</p>
                <p className="font-bold">{title}</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg border border-neutral-200 p-2"
                aria-label="Close navigation"
              >
                <X size={18} />
              </button>
            </div>
            <nav className="space-y-1 p-3">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to.split("/").length <= 2}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium",
                      isActive ? "bg-teal-50 text-teal-800" : "text-neutral-700",
                    ].join(" ")
                  }
                >
                  <item.icon size={18} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const Avatar = ({ user }: { user: User | null }) => {
  const initials = useMemo(() => {
    const source = user?.fullName || user?.userName || user?.email || "U";
    return source
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [user]);

  if (user?.profileImage) {
    return (
      <img
        src={user.profileImage}
        alt=""
        className="h-10 w-10 rounded-lg object-cover"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-700 text-sm font-bold text-white">
      {initials}
    </div>
  );
};

export const StatCard = ({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  helper?: string;
  icon: LucideIcon;
}) => (
  <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-neutral-500">{label}</p>
        <p className="mt-2 text-2xl font-bold">{value}</p>
      </div>
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
        <Icon size={22} />
      </div>
    </div>
    {helper ? <p className="mt-3 text-xs text-neutral-500">{helper}</p> : null}
  </div>
);

export const Badge = ({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "green" | "yellow" | "red" | "blue" | "teal";
}) => {
  const colors = {
    neutral: "bg-neutral-100 text-neutral-700",
    green: "bg-emerald-50 text-emerald-700",
    yellow: "bg-amber-50 text-amber-800",
    red: "bg-rose-50 text-rose-700",
    blue: "bg-sky-50 text-sky-700",
    teal: "bg-teal-50 text-teal-700",
  };

  return (
    <span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${colors[tone]}`}>
      {children}
    </span>
  );
};

export const LoadingState = ({ label = "Loading data..." }: { label?: string }) => (
  <div className="flex min-h-56 items-center justify-center rounded-lg border border-neutral-200 bg-white">
    <div className="flex items-center gap-3 text-sm text-neutral-500">
      <LoaderCircle className="animate-spin text-teal-700" size={20} />
      {label}
    </div>
  </div>
);

export const ErrorBanner = ({ message }: { message: string }) => (
  <div className="mb-4 flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
    <CircleAlert size={18} className="mt-0.5 shrink-0" />
    <p>{message}</p>
  </div>
);

export const EmptyState = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center">
    <p className="font-semibold text-neutral-900">{title}</p>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">{description}</p>
  </div>
);

export const Panel = ({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) => (
  <section className="rounded-lg border border-neutral-200 bg-white shadow-sm">
    <div className="flex flex-col gap-3 border-b border-neutral-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <h3 className="font-bold">{title}</h3>
      {action}
    </div>
    <div className="p-4">{children}</div>
  </section>
);

export const TextInput = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-medium text-neutral-700">{label}</span>
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
    />
  </label>
);

export const SelectInput = ({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
}) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-medium text-neutral-700">{label}</span>
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full appearance-none rounded-lg border border-neutral-300 bg-white px-3 py-2 pr-9 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
      />
    </div>
  </label>
);

export const PrimaryButton = ({
  children,
  onClick,
  disabled = false,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
  >
    {children}
  </button>
);

export const SecondaryButton = ({
  children,
  onClick,
  disabled = false,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
  >
    {children}
  </button>
);

export const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    getNotifications()
      .then((response) => {
        if (mounted) {
          setItems(toArray<Notification>(unwrapApiData(response)));
        }
      })
      .catch((requestError: unknown) => {
        if (mounted) {
          setError(getErrorMessage(requestError, "Notifications unavailable"));
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const unread = items.filter((item) => !item.isRead).length;

  const markRead = async () => {
    await markAllNotificationsRead();
    setItems((current) => current.map((item) => ({ ...item, isRead: true })));
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-lg border border-neutral-200 p-2 text-neutral-700 transition hover:bg-neutral-50"
        aria-label="Open notifications"
      >
        <Bell size={20} />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-rose-600 px-1.5 text-xs font-bold text-white">
            {unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-neutral-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
            <p className="font-semibold">Notifications</p>
            <button
              type="button"
              onClick={markRead}
              className="text-xs font-semibold text-teal-700 hover:text-teal-600"
            >
              Mark all read
            </button>
          </div>
          <div className="max-h-96 overflow-auto p-2">
            {error ? <p className="p-3 text-sm text-rose-700">{error}</p> : null}
            {!error && items.length === 0 ? (
              <p className="p-3 text-sm text-neutral-500">No notifications yet.</p>
            ) : null}
            {items.map((item) => (
              <Link
                key={item.id}
                to={item.url || "#"}
                className="block rounded-lg p-3 transition hover:bg-neutral-50"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold">{item.title}</p>
                  {!item.isRead ? <span className="mt-1 h-2 w-2 rounded-full bg-teal-600" /> : null}
                </div>
                <p className="mt-1 text-sm leading-5 text-neutral-500">{item.message}</p>
                <p className="mt-2 text-xs text-neutral-400">{formatDate(item.createdAt)}</p>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};
