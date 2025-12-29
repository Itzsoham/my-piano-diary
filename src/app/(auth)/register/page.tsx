import Link from "next/link";

import { Music2 } from "lucide-react";

import { RegisterForm } from "../_components/register-form";
import { GoogleButton } from "../_components/social-auth/google-button";

export default function Register() {
  return (
    <div className="flex h-dvh">
      {/* Left Side – Register Form */}
      <div className="bg-background flex w-full items-center justify-center p-8 lg:w-2/3">
        <div className="w-full max-w-md space-y-10 py-24 lg:py-32">
          <div className="space-y-4 text-center">
            <div className="text-2xl font-medium tracking-tight">
              Create your Piano Diary 🎹
            </div>
            <div className="text-muted-foreground mx-auto max-w-xl text-sm">
              Set up your personal space to track lessons, students, and
              beautiful progress ✨
            </div>
          </div>

          <div className="space-y-4">
            <RegisterForm />

            <GoogleButton className="w-full" variant="outline" />

            <p className="text-muted-foreground text-center text-xs">
              Already have a diary?{" "}
              <Link
                prefetch={false}
                href="login"
                className="text-primary hover:underline"
              >
                Login 🌸
              </Link>
            </p>
          </div>

          <p className="text-muted-foreground text-center text-[10px]">
            A calm space made for teachers who teach with heart 💗
          </p>
        </div>
      </div>

      {/* Right Side – Piano Diary Mood */}
      <div className="bg-primary hidden lg:block lg:w-1/3">
        <div className="flex h-full flex-col items-center justify-center p-12 text-center">
          <div className="space-y-6">
            <Music2 className="text-primary-foreground mx-auto size-12" />
            <div className="space-y-3">
              <h1 className="text-primary-foreground text-5xl font-light">
                My Piano Diary
              </h1>
              <p className="text-primary-foreground/80 text-lg">
                Begin your teaching journey
                <br />
                one lesson at a time 🎶
              </p>
            </div>
            <p className="text-primary-foreground/70 text-sm">
              Made with love, just for you 💗
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
