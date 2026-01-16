import { useState } from "react";
import { useLocation } from "wouter";
import { LoginForm } from "@/components/login-form";
import { RegisterForm } from "@/components/register-form";
import { queryClient } from "@/lib/queryClient";

export default function Auth() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");

  const handleAuthSuccess = () => {
    // Invalidate user query to refetch authenticated user
    queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
    // Redirect to home
    setLocation("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">📊 BlackBook</h1>
          <p className="text-muted-foreground">Trading Journal & Community</p>
        </div>

        {mode === "login" ? (
          <LoginForm
            onSuccess={handleAuthSuccess}
            onSwitchToRegister={() => setMode("register")}
          />
        ) : (
          <RegisterForm
            onSuccess={handleAuthSuccess}
            onSwitchToLogin={() => setMode("login")}
          />
        )}
      </div>
    </div>
  );
}
