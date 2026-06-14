import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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

const loginSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  // FIX: corrected error message to say "at least 3 characters" to match min(3)
  password: z.string().min(3, { message: "Password must be at least 3 characters" }),
  remember: z.boolean(),
});

type FormValues = z.infer<typeof loginSchema>;

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      remember: false,
    },
  });

  // FIX: use form.handleSubmit so validation runs and isSubmitting flips correctly
  const onSubmit = async (values: FormValues) => {
    try {
      const res = await login(values.username, values.password);

      if (!res.ok) {
        toast.error(res.error ?? "Login failed");
        return;
      }

      toast.success("Welcome back!");
      navigate({ to: "/dashboard" });
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
