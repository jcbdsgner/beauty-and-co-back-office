"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon } from "@/icons";
import Link from "next/link";
import React from "react";

export default function ForgotPasswordForm() {
  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link
          href="/signin"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          Back to sign in
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div className="mb-5 sm:mb-8">
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
            Forgot your password?
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>
        <form>
          <div className="space-y-5">
            <div>
              <Label>
                Email <span className="text-error-500">*</span>
              </Label>
              <Input placeholder="you@company.com" type="email" />
            </div>
            <Button className="w-full" size="sm">
              Send reset link
            </Button>
          </div>
        </form>
        <p className="mt-5 text-sm text-center text-gray-700 dark:text-gray-400 sm:text-start">
          Remembered it?{" "}
          <Link href="/signin" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
