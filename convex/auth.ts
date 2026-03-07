import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile: (params) => {
        const rawEmail = typeof params.email === "string" ? params.email : "";
        const rawName = typeof params.name === "string" ? params.name : "";
        const email = rawEmail.trim().toLowerCase();
        const fallbackName = email.includes("@") ? email.split("@")[0] : "Usuario";
        const name = rawName.trim() || fallbackName;

        return {
          email,
          name,
          isAnonymous: false,
        };
      },
      validatePasswordRequirements: (password) => {
        if (!password || password.length < 8) {
          throw new Error("La contraseña debe tener al menos 8 caracteres.");
        }
      },
    }),
  ],
});
