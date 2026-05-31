import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth/auth-shell";
import { useAuthStore } from "@/store/auth-store";

const schema = z
  .object({
    email: z.string().email(),
    password: z.string().min(6, "Min 6 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });
type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = (values: FormValues) => {
    const res = register(values.email, values.password, "employee");
    if (!res.ok) {
      toast.error(res.error ?? "Could not register");
      return;
    }
    toast.success("Account created");
    navigate({ to: "/dashboard" });
  };

  return (
    <AuthShell title="Create your account" subtitle="Start managing your team in minutes.">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...form.register("email")} />
          {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" {...form.register("password")} />
          {form.formState.errors.password && <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input id="confirm" type="password" {...form.register("confirm")} />
          {form.formState.errors.confirm && <p className="text-xs text-destructive">{form.formState.errors.confirm.message}</p>}
        </div>
        <Button type="submit" className="w-full">Create account</Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
      </p>
    </AuthShell>
  );
}