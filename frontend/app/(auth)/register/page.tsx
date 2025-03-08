"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AuthForm } from "@/components/authForm";
import { SubmitButton } from "@/components/submitButton";
import { handleRegister, FormStateType } from "@/app/(auth)/actions";

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [formState, setFormState] = useState<FormStateType>("idle");

  useEffect(() => {
    if (formState === "user_exists") toast.error("Account already exists");
    if (formState === "failed") toast.error("Failed to create account");
    else if (formState === "invalid_data") toast.error("Failed validating submission!");
    else if (formState === "invalid_email") toast.error("Enter an Email!");
    else if (formState === "invalid_password") toast.error("Enter a Password!");
    else if (formState === "success") {
      toast.success("Account created successfully");
      setIsSuccessful(true);
      
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    }
  }, [formState, router]);

  const handleSubmit = async (formData: FormData) => {
    const result = await handleRegister(formData);
    setFormState(result);

  };

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl gap-12 flex flex-col">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Sign Up</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Create an account with your email and password
          </p>
        </div>
        <AuthForm action={handleSubmit} defaultEmail={email}>
          <SubmitButton isSuccessful={isSuccessful}>Sign Up</SubmitButton>
          <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
            {"Already have an account? "}
            <Link
              href="/login"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              Sign in
            </Link>
            {" instead."}
          </p>
        </AuthForm>
      </div>
    </div>
  );
}
