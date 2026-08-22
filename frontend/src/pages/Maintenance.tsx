
import { useEffect } from "react";
import { Wrench, RefreshCw, Clock3 } from "lucide-react";

const Maintenance = () => {
  // ==========================================
  // SEO
  // ==========================================

  useEffect(() => {
    document.title = "Under Maintenance | Task Management System";

    const description =
      "The Task Management System is temporarily unavailable while maintenance is being performed.";

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

  // ==========================================
  // REFRESH PAGE
  // ==========================================

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl items-center justify-center">
        <section
          className="
            w-full
            rounded-2xl
            border border-slate-800
            bg-slate-900/80
            p-6
            text-center
            shadow-2xl
            sm:p-10
            md:p-14
          "
        >
          {/* Icon */}

          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-500/10">
            <Wrench
              size={40}
              className="text-blue-400"
              aria-hidden="true"
            />
          </div>

          {/* Heading */}

          <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-blue-400">
            System Maintenance
          </p>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            We&apos;ll be back soon
          </h1>

          {/* Description */}

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
            Our Task Management System is temporarily unavailable while
            we perform maintenance and improvements. Please check back
            shortly.
          </p>

          {/* Status information */}

          <div className="mx-auto mt-8 grid max-w-xl gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <Clock3
                size={22}
                className="mx-auto mb-2 text-slate-300"
                aria-hidden="true"
              />

              <p className="text-sm font-medium text-slate-200">
                Temporary downtime
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Services will return when maintenance is complete.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <RefreshCw
                size={22}
                className="mx-auto mb-2 text-slate-300"
                aria-hidden="true"
              />

              <p className="text-sm font-medium text-slate-200">
                Try again later
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Refresh the page after the maintenance period.
              </p>
            </div>
          </div>

          {/* Refresh button */}

          <button
            type="button"
            onClick={handleRefresh}
            className="
              mt-8
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-blue-600
              px-5
              py-3
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-blue-500
              focus:outline-none
              focus:ring-2
              focus:ring-blue-500
              focus:ring-offset-2
              focus:ring-offset-slate-950
              active:scale-[0.98]
            "
          >
            <RefreshCw size={17} aria-hidden="true" />
            Refresh Page
          </button>

          {/* Footer */}

          <p className="mt-8 text-xs text-slate-600">
            Task Management System
          </p>
        </section>
      </div>
    </main>
  );
};

export default Maintenance;

