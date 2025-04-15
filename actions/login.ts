"use server";

import * as z from "zod";
import { LoginSchema } from "@/schemas";
import { signIn } from "@/auth";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { AuthError } from "next-auth";
import { getUserByEmail } from "@/actions/user";
import { db } from "@/lib/db";
import bcryptjs from "bcryptjs";

export const login = async (
  values: z.infer<typeof LoginSchema>,
  callbackUrl?: string | null,
  mode?: "modal" | "redirect"
): Promise<{
  error?: string;
  success?: string;
  callbackUrl?: string;
}> => {
  const validatedFields = LoginSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }
  const { email, password } = validatedFields.data;

  try {
    const existingUser = await getUserByEmail(email);
    if (!existingUser || !existingUser.email || !existingUser.password) {
      return { error: "Email does not exist!" };
    }

    if (existingUser.password === "initial") {
      const hashedPassword = await bcryptjs.hash(password, 10);
      await db.user.update({
        where: { id: existingUser.id },
        data: { password: hashedPassword },
      });
      return { callbackUrl: callbackUrl || DEFAULT_LOGIN_REDIRECT };
    }

    const isPasswordValid = await bcryptjs.compare(
      password,
      existingUser.password
    );
    if (!isPasswordValid) {
      return { error: "Invalid credentials!" };
    }

    if (mode === "modal") {
      return { callbackUrl: callbackUrl || DEFAULT_LOGIN_REDIRECT };
    }

    await signIn("credentials", {
      email,
      password,
      redirect: false,
    }).then((res) => {
      if (res.error) {
        return { error: res.error };
      }
      return {
        callbackUrl: callbackUrl || DEFAULT_LOGIN_REDIRECT,
        success: "Logged in successfully!",
      };
    });
    await db.user.update({
      where: { id: existingUser.id },
      data: { last_login: new Date() },
    });

    return { callbackUrl: callbackUrl || DEFAULT_LOGIN_REDIRECT };
  } catch (error) {
    console.error("Error during login:", error);
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials!" };
        default:
          return { error: "Something went wrong!" };
      }
    }
    throw error;
  }
};
