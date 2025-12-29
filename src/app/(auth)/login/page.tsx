import Link from "next/link";

import { Music } from "lucide-react";

import { LoginForm } from "../_components/login-form";
import { GoogleButton } from "../_components/social-auth/google-button";

export default function Login() {
  return (
    <div className="flex h-dvh">
      {/* Left Side – Piano Diary Mood */}
      <div className="bg-primary hidden lg:block lg:w-1/3">
        <div className="flex h-full flex-col items-center justify-center p-12 text-center">
          <div className="space-y-6">
            <Music className="text-primary-foreground mx-auto size-12" />
            <div className="space-y-3">
              <h1 className="text-primary-foreground text-5xl font-light">
                My Piano Diary
              </h1>
              <p className="text-primary-foreground/80 text-lg">
                A little place to keep
                <br />
                your lessons, students, and progress ✨
              </p>
            </div>
            <p className="text-primary-foreground/70 text-sm">
              Made with love, just for you 💗
            </p>
          </div>
        </div>
      </div>

      {/* Right Side – Login */}
      <div className="bg-background flex w-full items-center justify-center p-8 lg:w-2/3">
        <div className="w-full max-w-md space-y-10 py-24 lg:py-32">
          <div className="space-y-4 text-center">
            <div className="text-2xl font-medium tracking-tight">
              Welcome back 🌸
            </div>
            <div className="text-muted-foreground mx-auto max-w-xl text-sm">
              Log in to continue your piano diary and track today&apos;s
              lessons.
            </div>
          </div>

          <div className="space-y-4">
            <LoginForm />

            <GoogleButton className="w-full" variant="outline" />

            <p className="text-muted-foreground text-center text-xs">
              Don&apos;t have an account yet?{" "}
              <Link
                prefetch={false}
                href="register"
                className="text-primary hover:underline"
              >
                Create one ✨
              </Link>
            </p>
          </div>

          <p className="text-muted-foreground text-center text-[10px]">
            Your personal piano space — safe, simple, and yours 🎶
          </p>
        </div>
      </div>
    </div>
  );
}
