import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

const STORAGE_PREFIXES = ["personal-os", "supabase", "sb-"];

function clearSessionStorage() {
  sessionStorage.clear();

  Object.keys(localStorage).forEach((key) => {
    if (STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      localStorage.removeItem(key);
    }
  });
}

export default function SignOutScreen() {
  const hasResetSession = useRef(false);
  const [status, setStatus] = useState("Resetting active session...");

  useEffect(() => {
    if (hasResetSession.current) {
      return;
    }

    hasResetSession.current = true;

    async function resetSession() {
      try {
        clearSessionStorage();

        if (isSupabaseConfigured) {
          await supabase.auth.signOut();
        }

        setStatus("Session reset complete.");
      } catch {
        setStatus("Local session reset complete.");
      }
    }

    resetSession();
  }, []);

  return (
    <div className="flex min-h-full items-center justify-center">
      <section className="w-full max-w-3xl rounded-lg border border-white/20 bg-[#1A1A1A] p-8 text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-[#B8F04A]/30 bg-[#B8F04A]/10">
          <span className="material-symbols-outlined text-[#B8F04A]">logout</span>
        </div>
        <span className="inline-flex rounded border border-[#B8F04A]/30 bg-[#B8F04A]/10 px-3 py-1 font-label-caps text-label-caps text-[#B8F04A]">
          SIGNED OUT
        </span>
        <h2 className="mt-5 font-display-lg text-display-lg leading-none text-on-surface">
          Session Ended
        </h2>
        <p className="mx-auto mt-4 max-w-xl font-body-md text-body-md text-on-surface-variant">
          {status}
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            className="inline-flex items-center justify-center gap-2 rounded bg-primary-container px-5 py-3 font-label-caps text-label-caps text-on-primary-container transition-opacity hover:opacity-90"
            to="/"
          >
            <span className="material-symbols-outlined text-[18px]">home</span>
            RETURN TO DASHBOARD
          </Link>
        </div>
      </section>
    </div>
  );
}
