"use server";

import { createUser } from "@/lib/db/queries/insert";
import { getUser } from "@/lib/db/queries/select";
import { signIn, signOut } from "@/app/(auth)/auth";
import { AuthError } from "next-auth";

export type LoginStateType =
  | "idle"
  | "invalid_email"
  | "invalid_password"
  | "user_not_found"
  | "success"
  | "failed";

export type FormStateType =
  | "idle"
  | "user_exists"
  | "failed"
  | "invalid_data"
  | "invalid_email"
  | "invalid_password"
  | "success";

export type LogoutStateType = "idle" | "success" | "failed";

export async function handleRegister(
  formData: FormData
): Promise<FormStateType> {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email) return "invalid_email";
    if (!password) return "invalid_password";

    const user = await getUser(email);
    if (user) return "user_exists";

    await createUser(email, password);
    return "success";
  } catch (error) {
    console.error("Failed to create user:", error);
    return "failed";
  }
}

export async function handleLogin(formData: FormData): Promise<LoginStateType> {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email) return "invalid_email";
    if (!password) return "invalid_password";

    await signIn("credentials", { email, password, redirect: false }, {callbackUrl: "/"});

    return "success";

  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") return "invalid_password";
      return "failed";
    }
    console.error("Login failed:", error);
    return "failed";
  }
}

export async function handleLogout() {
 
    await signOut({ redirect: true, redirectTo: "/login" });

}
