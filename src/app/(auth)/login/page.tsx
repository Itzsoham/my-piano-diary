import Link from "next/link";

import { Music } from "lucide-react";

import { LoginForm } from "../_components/login-form";

export default function Login() {
  return (
    <div className="flex h-dvh">
      {/* Left Side – Piano Diary Mood */}
      <div className="relative hidden overflow-hidden bg-linear-to-br from-rose-100 via-pink-50 to-purple-50 lg:block lg:w-1/3">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,182,193,0.1),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(221,160,221,0.1),transparent_50%)]"></div>
        <div className="relative flex h-full flex-col items-center justify-center p-12 text-center">
          <div className="space-y-8">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-rose-200/30 blur-2xl"></div>
              <Music
                className="relative mx-auto size-16 text-rose-500 drop-shadow-sm"
                strokeWidth={1.5}
              />
            </div>
            <div className="space-y-4">
              <h1 className="text-6xl font-light tracking-tight text-gray-800">
                My Piano Diary
              </h1>
              <p className="mx-auto max-w-sm text-lg leading-relaxed text-gray-600">
                A little place to keep
                <br />
                your lessons, students, and progress
              </p>
              <div className="flex items-center justify-center gap-2 text-rose-400">
                <span className="text-2xl">✨</span>
                <span className="text-2xl">🎹</span>
                <span className="text-2xl">💕</span>
              </div>
            </div>
            <p className="text-xl text-rose-500">
              Made with love, just for you
            </p>
          </div>
        </div>
      </div>

      {/* Right Side – Login */}
      <div className="flex w-full items-center justify-center bg-linear-to-br from-white via-rose-50/30 to-purple-50/30 p-8 lg:w-2/3">
        <div className="w-full max-w-md space-y-10 py-24 lg:py-32">
          <div className="space-y-4 text-center">
            <div className="mb-2 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-rose-100 to-pink-100 shadow-sm">
              <span className="text-2xl">🌸</span>
            </div>
            <div className="text-3xl font-light tracking-tight text-gray-800">
              Welcome back
            </div>
            <div className="text-muted-foreground mx-auto max-w-xl text-sm leading-relaxed">
              Log in to continue your piano diary and track today&apos;s
              lessons.
            </div>
          </div>

          <div className="space-y-5">
            <LoginForm />

            <p className="text-muted-foreground pt-4 text-center text-xs">
              Don&apos;t have an account yet?{" "}
              <Link
                prefetch={false}
                href="register"
                className="font-medium text-rose-500 transition-colors hover:text-rose-600"
              >
                Create one ✨
              </Link>
            </p>
          </div>

          <p className="text-muted-foreground pt-6 text-center text-[10px]">
            Your personal piano space — safe, simple, and yours 🎶
          </p>
        </div>
      </div>
    </div>
  );
}
