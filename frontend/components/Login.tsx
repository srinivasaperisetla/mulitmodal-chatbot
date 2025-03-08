"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AuthForm } from "@/components/authForm";
import { SubmitButton } from "@/components/submitButton";
import { handleLogin, LoginStateType } from "@/app/(auth)/actions";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [loginState, setLoginState] = useState<LoginStateType>("idle");

  useEffect(() => {
    if (loginState === "user_not_found") toast.error("User not found");
    else if (loginState === "invalid_password") toast.error("Invalid password");
    else if (loginState === "invalid_email") toast.error("Enter an Email!");
    else if (loginState === "failed") toast.error("Login failed");
    else if (loginState === "success") {
      toast.success("Login successful");
      setIsSuccessful(true);
      router.refresh();

    }
  }, [loginState, router]);

  const handleSubmit = async (formData: FormData) => {
    const result = await handleLogin(formData);
    setLoginState(result);
  };

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl gap-12 flex flex-col">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Login</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Enter your email and password to access your account
          </p>
        </div>
        <AuthForm action={handleSubmit} defaultEmail={email}>
          <input type="hidden" name="callbackUrl" value="/" />
          <SubmitButton isSuccessful={isSuccessful}>Login</SubmitButton>
          <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
            {"Don't have an account? "}
            <Link
              href="/register"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              Sign up
            </Link>
            {" instead."}
          </p>
        </AuthForm>
      </div>
    </div>
  );
}
