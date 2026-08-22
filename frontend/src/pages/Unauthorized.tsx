
import { useEffect } from "react";
import { ArrowLeft, Home, ShieldX } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const Unauthorized = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Unauthorized | Task Management System";

    const description =
      "You do not have permission to access this page.";

    let meta = document.querySelector(
      'meta[name="description"]',
    );

    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }

    meta.setAttribute("content", description);

    return () => {
      document.title = "Task Management System";
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl items-center justify-center">
        <section className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 p-8 text-center shadow-2xl sm:p-12">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
            <ShieldX
              size={40}
              className="text-red-400"
              aria-hidden="true"
            />
          </div>

          <p className="text-7xl font-bold tracking-tight text-red-400 sm:text-8xl">
            403
          </p>

          <h1 className="mt-5 text-2xl font-bold sm:text-3xl">
            Access denied
          </h1>

          <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-slate-400 sm:text-base">
            You are authenticated, but your account does not have
            permission to access this resource.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 sm:w-auto"
            >
              <ArrowLeft size={17} />
              Go Back
            </button>

            <Link
              to="/"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 sm:w-auto"
            >
              <Home size={17} />
              Go Home
            </Link>
          </div>

          <p className="mt-8 text-xs text-slate-600">
            Task Management System
          </p>
        </section>
      </div>
    </main>
  );
};

export default Unauthorized;

