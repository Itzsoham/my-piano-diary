import Link from "next/link";

import { Music2 } from "lucide-react";

import { RegisterForm } from "../_components/register-form";

export default function Register() {
  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Left Side – Register Form */}
      <div className="flex w-full items-center justify-center bg-linear-to-br from-white via-purple-50/30 to-rose-50/30 p-8 lg:w-2/3">
        <div className="w-full max-w-md space-y-6 py-8 lg:py-12">
          <div className="space-y-4 text-center">
            <div className="mb-1 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-purple-100 to-pink-100 shadow-sm">
              <span className="text-2xl">🎹</span>
            </div>
            <div className="text-3xl font-light tracking-tight text-gray-800">
              Create your Piano Diary
            </div>
            <div className="text-muted-foreground mx-auto max-w-xl text-sm leading-relaxed">
              Set up your personal space to track lessons, students, and
              beautiful progress
            </div>
          </div>

          <div className="space-y-4">
            <RegisterForm />

            <p className="text-muted-foreground pt-2 text-center text-xs">
              Already have a diary?{" "}
              <Link
                prefetch={false}
                href="login"
                className="font-medium text-rose-500 transition-colors hover:text-rose-600"
              >
                Login 🌸
              </Link>
            </p>
          </div>

          <p className="text-muted-foreground pt-2 text-center text-[10px]">
            A calm space made for teachers who teach with heart 💗
          </p>
        </div>
      </div>

      {/* Right Side – Piano Diary Mood */}
      <div className="relative hidden overflow-hidden bg-linear-to-br from-purple-100 via-pink-50 to-rose-50 lg:flex lg:w-1/3 lg:flex-col">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(221,160,221,0.15),transparent_50%),radial-gradient(circle_at_30%_80%,rgba(255,182,193,0.15),transparent_50%)]"></div>
        <div className="relative flex h-full flex-col items-center justify-center p-12 text-center">
          <div className="space-y-8">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-purple-200/30 blur-2xl"></div>
              <Music2
                className="relative mx-auto size-16 text-purple-500 drop-shadow-sm"
                strokeWidth={1.5}
              />
            </div>
            <div className="space-y-4">
              <h1 className="text-6xl font-light tracking-tight text-gray-800">
                My Piano Diary
              </h1>
              <p className="mx-auto max-w-sm text-lg leading-relaxed text-gray-600">
                Begin your teaching journey
                <br />
                one lesson at a time
              </p>
              <div className="flex items-center justify-center gap-2 text-purple-400">
                <span className="text-2xl">🎶</span>
                <span className="text-2xl">📖</span>
              </div>
            </div>
            <p className="text-xl text-rose-500">
              Made with love, just for you
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
