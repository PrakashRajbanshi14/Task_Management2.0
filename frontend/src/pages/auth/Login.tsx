import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, LogIn, Mail } from "lucide-react";
import { useDispatch } from "react-redux";

import type { AppDispatch } from "../../store/store";
import { loginUser } from "../../store/authSlice";
import { googleLogin } from "../../api/authApi";
import SEO from "../../components/SEO";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const successMessage = (
    location.state as { message?: string } | null
  )?.message;

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    try {
      setLoading(true);

      const result = await dispatch(
        loginUser({
          email: email.trim(),
          password,
        }),
      ).unwrap();

      const role = result.role;

      if (role === "admin") {
        navigate("/admin", { replace: true });
      } else if (role === "projectManager") {
        navigate("/project-manager", { replace: true });
      } else if (role === "employee") {
        navigate("/employee", { replace: true });
      } else if (role === "user") {
        navigate("/home", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (error: unknown) {
      if (typeof error === "string") {
        setError(error);
      } else if (
        error &&
        typeof error === "object" &&
        "message" in error
      ) {
        setError(
          String(
            (error as { message?: unknown }).message ??
              "Login failed.",
          ),
        );
      } else {
        setError("Invalid email or password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <SEO
        title="Login"
        description="Login to the task management workspace."
      />
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center justify-center">
        <section className="w-full">

          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-teal-600">
              <LogIn size={28} />
            </div>

            <h1 className="text-3xl font-bold">
              Welcome back
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Sign in to your account
            </p>
          </div>

          {/* Card */}
          <div className="rounded-lg border border-white/10 bg-neutral-900 p-6 shadow-xl sm:p-8">

            {successMessage && (
              <div className="mb-5 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
                {successMessage}
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
              >
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Email
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    id="email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-white/10 bg-neutral-950 py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-600 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Password
                </label>

                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    name="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Enter your password"
                    className="w-full rounded-lg border border-white/10 bg-neutral-950 py-3 pl-10 pr-11 text-sm outline-none transition placeholder:text-slate-600 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((value) => !value)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Login button */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-5 py-3 text-sm font-semibold transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogIn size={18} />

                {loading
                  ? "Signing in..."
                  : "Sign in"}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-800" />

              <span className="text-xs text-slate-500">
                OR
              </span>

              <div className="h-px flex-1 bg-slate-800" />
            </div>

            {/* Google */}
            <button
              type="button"
              onClick={googleLogin}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-white/10 bg-neutral-950 px-5 py-3 text-sm font-semibold transition hover:bg-neutral-800"
            >
              <span className="font-bold">
                G
              </span>

              Continue with Google
            </button>

            {/* Register */}
            <p className="mt-6 text-center text-sm text-slate-400">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-teal-400 hover:text-teal-300"
              >
                Create account
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Login;
