import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LoaderCircle,
  ShieldAlert,
} from "lucide-react";

import { useDispatch } from "react-redux";

import type { AppDispatch } from "../../store/store";
import { fetchCurrentUser } from "../../store/authSlice";
import { refreshAccessToken } from "../../api/authApi";
import SEO from "../../components/SEO";

const GoogleCallback = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const authenticate = async () => {
      try {
        const restoreUser = () =>
          dispatch(fetchCurrentUser()).unwrap();

        /*
         * Backend Google OAuth has already authenticated the user and
         * set HTTP-only cookies. If the browser still sends a stale
         * access token first, force one refresh and retry /me.
         */

        const result = await restoreUser().catch(
          async () => {
            await refreshAccessToken();
            return restoreUser();
          },
        );

        if (!mounted) {
          return;
        }

        const role = result.role;

        if (role === "admin") {
          navigate("/admin", {
            replace: true,
          });

          return;
        }

        if (role === "projectManager") {
          navigate("/project-manager", {
            replace: true,
          });

          return;
        }

        if (role === "employee") {
          navigate("/employee", {
            replace: true,
          });

          return;
        }

        if (role === "user") {
          navigate("/home", {
            replace: true,
          });

          return;
        }

        navigate("/", {
          replace: true,
        });
      } catch (error: unknown) {
        if (!mounted) {
          return;
        }

        if (typeof error === "string") {
          setError(error);
        } else if (
          error &&
          typeof error === "object" &&
          "message" in error
        ) {
          setError(
            String(
              (error as { message?: unknown })
                .message ??
                "Google authentication failed.",
            ),
          );
        } else {
          setError(
            "Google authentication failed. Please try again.",
          );
        }
      }
    };

    authenticate();

    return () => {
      mounted = false;
    };
  }, [dispatch, navigate]);

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 text-white">
        <SEO
          title="Google Authentication"
          description="Complete Google authentication for the task management workspace."
          noIndex
        />
        <div className="flex min-h-screen items-center justify-center">
          <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-xl">

            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
              <ShieldAlert
                size={32}
                className="text-red-400"
              />
            </div>

            <h1 className="text-2xl font-bold">
              Authentication failed
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                navigate("/login", {
                  replace: true,
                })
              }
            className="mt-6 rounded-lg bg-teal-600 px-5 py-3 text-sm font-semibold transition hover:bg-teal-500"
            >
              Return to Login
            </button>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 text-white">
      <SEO
        title="Google Authentication"
        description="Complete Google authentication for the task management workspace."
        noIndex
      />
      <div className="flex min-h-screen items-center justify-center">
        <section className="text-center">

          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
            <LoaderCircle
              size={32}
              className="animate-spin text-blue-400"
            />
          </div>

          <h1 className="text-xl font-semibold">
            Signing you in...
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Please wait while we complete Google
            authentication.
          </p>

        </section>
      </div>
    </main>
  );
};

export default GoogleCallback;
