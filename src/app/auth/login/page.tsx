import { LoginForm } from "@/components/auth/login-form";

import { auth } from "@/auth";

import { redirect } from "next/navigation";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

const LoginPage = async () => {
  const session = await auth();
  if (session) {
    redirect(DEFAULT_LOGIN_REDIRECT);
  }
  return <LoginForm />;
};

export default LoginPage;
