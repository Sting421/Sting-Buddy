"use client";

import { signIn } from "next-auth/react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center w-full max-w-sm px-6">
        {/* Logo */}
        <div className="w-20 h-20 rounded-2xl bg-neon/10 flex items-center justify-center mb-6 neon-glow">
          <span className="text-4xl">🐝</span>
        </div>
        <h1 className="text-2xl font-bold text-neon neon-text mb-1">StingBuddy</h1>
        <p className="text-sm text-muted-foreground mb-8 text-center">
          Task management that actually gets things done.
          <br />
          Capture, organize, and blitz through your work.
        </p>

        {/* Google sign in */}
        <Button
          onClick={() => signIn("google", { callbackUrl: "/today" })}
          className="w-full h-11 bg-white hover:bg-gray-100 text-gray-800 font-medium text-sm rounded-lg flex items-center justify-center gap-3 border border-gray-200"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
            <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05" />
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
          </svg>
          Continue with Google
        </Button>

        <p className="text-[11px] text-muted-foreground/60 mt-4 text-center">
          Sign in to sync tasks with Google Calendar
        </p>

        {/* Skip auth for local-only mode */}
        <Button
          variant="ghost"
          className="mt-6 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => (window.location.href = "/today")}
        >
          Continue without account (offline only)
        </Button>
      </div>
    </div>
  );
}
