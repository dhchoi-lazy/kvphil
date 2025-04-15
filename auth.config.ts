import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { getUserByEmail } from "@/actions/user";
import { LoginSchema } from "@/schemas";
import bcryptjs from "bcryptjs";

const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        const validateFields = LoginSchema.safeParse(credentials);

        if (validateFields.success) {
          const { email, password } = validateFields.data;
          const user = await getUserByEmail(email);

          if (!user || !user.password) {
            return null;
          }
          const passwordsMatch = await bcryptjs.compare(
            password,
            user.password
          );

          if (passwordsMatch)
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              image: user.image,
            };
        }
        return null;
      },
    }),
  ],
  trustHost: true,
};

export default authConfig;
