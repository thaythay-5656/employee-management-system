import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthShell } from "@/components/auth/auth-shell";
import { useAuthStore } from "@/store/auth-store";
import { tokenStorage } from "@/api/tokenStorage";

const loginSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  password: z.string().min(3, { message: "Password must be at least 3 characters" }),
  remember: z.boolean(),
});

type FormValues = z.infer<typeof loginSchema>;

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: searchSchema,
  // If already authenticated (e.g. token still valid after refresh, or
  // another tab just logged in), skip the login page entirely.
  beforeLoad: ({ search }) => {
    const hasToken = !!tokenStorage.getAccess();
    const hasUser = !!tokenStorage.getUser();

    if (hasToken && hasUser) {
      throw redirect({ to: search.redirect ?? "/dashboard" });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const navigate = useNavigate();
  const { redirect: redirectTo } = Route.useSearch();

  const form = useForm<FormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      remember: false,
    },
  });

  // Cross-tab: if another tab logs in while this tab sits on /login,
  // the 'storage' listener in auth-store flips isAuthenticated -> true.
  // Redirect this tab too.
  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: redirectTo ?? "/dashboard" });
    }
  }, [isAuthenticated, navigate, redirectTo]);

  const onSubmit = async (values: FormValues) => {
    try {
      const res = await login(values.username, values.password);

      if (!res.ok) {
        toast.error(res.error ?? "Login failed");
        return;
      }

      toast.success("Welcome back!");
      navigate({ to: redirectTo ?? "/dashboard" });
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <AuthShell title="Sign in to Nimbus HR" subtitle="Welcome back. Enter your details to continue.">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            type="text"
            placeholder="Enter your username"
            {...form.register("username")}
          />
          {form.formState.errors.username && (
            <p className="text-xs text-destructive">{form.formState.errors.username.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            {...form.register("password")}
          />
          {form.formState.errors.password && (
            <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Controller
            control={form.control}
            name="remember"
            render={({ field }) => (
              <Checkbox
                id="remember"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <Label htmlFor="remember" className="text-sm font-normal select-none">
            Remember me
          </Label>
        </div>

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  );
}
