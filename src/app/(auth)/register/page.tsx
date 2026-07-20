import Link from "next/link";
import { redirect } from "next/navigation";

import { RegisterForm } from "../_components/register-form";
import { AuthArtPanel } from "../_components/auth-art-panel";
import { getServerAuthSession } from "@/server/auth";

export default async function Register() {
  const session = await getServerAuthSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="bg-floss flex h-dvh overflow-hidden">
      <AuthArtPanel
        heading="Begin your teaching diary"
        copy="Set up your studio in a minute — lessons, students, and progress, all in one calm place."
        valueProps={[
          "Lessons, attendance and pieces in one diary",
          "Monthly tuition sheets that add themselves up",
          "Rates frozen per lesson — past months never re-price",
        ]}
      />

      {/* Right Side – Register */}
      <div className="relative flex w-full items-center justify-center overflow-y-auto p-6 sm:p-8 lg:w-[54%]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 92% 4%, var(--pink-50), transparent 58%)",
          }}
        />
        <div className="relative z-1 w-full max-w-md space-y-5 py-8">
          <div className="bg-card rounded-[1.75rem] border border-(--line-pink) p-6 shadow-(--sh-xl) sm:p-7">
            <div className="mb-1 space-y-1.5 text-center">
              <span className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-pink-100 text-xl">
                🎹
              </span>
              <h1 className="text-ink font-serif text-2xl font-normal">
                Create your Piano Diary
              </h1>
              <p className="text-ink-soft mx-auto max-w-xs text-sm leading-relaxed">
                Set up your personal space to track lessons, students, and
                beautiful progress
              </p>
            </div>

            <div className="mt-5 space-y-4">
              <RegisterForm />

              <p className="text-ink-soft pt-1 text-center text-xs">
                Already have a diary?{" "}
                <Link
                  prefetch={false}
                  href="login"
                  className="font-semibold text-pink-700 transition-colors hover:text-pink-800 hover:underline"
                >
                  Login 🌸
                </Link>
              </p>
            </div>
          </div>

          <p className="text-ink-soft text-center text-[11px]">
            A calm space made for teachers who teach with heart 💗
          </p>
        </div>
      </div>
    </div>
  );
}
