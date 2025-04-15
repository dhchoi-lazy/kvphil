import React from "react";
const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center">
      {children}
    </main>
  );
};
export default AuthLayout;
