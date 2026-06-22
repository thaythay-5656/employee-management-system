import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth/auth-shell";
import { api } from "@/api/client";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

// =========================
// STEP 1 — request OTP
// =========================
const requestSchema = z.object({
  email: z.string().email("Enter a valid email"),
});
type RequestValues = z.infer<typeof requestSchema>;

// =========================
// STEP 2 — verify OTP + new password
// =========================
const verifySchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
  new_password: z.string().min(4, "Minimum 4 characters"),
  confirm_password: z.string().min(4, "Minimum 4 characters"),
}).refine((d) => d.new_password === d.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});
type VerifyValues = z.infer<typeof verifySchema>;

function ForgotPasswordPage() {
  const [step, setStep] = useState<"request" | "verify">("request");
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const requestForm = useForm<RequestValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: { email: "" },
  });

  const verifyForm = useForm<VerifyValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: { code: "", new_password: "", confirm_password: "" },
  });

  const onRequestSubmit = async (v: RequestValues) => {
    try {
      await api.post("/password-reset/request/", { email: v.email }, { auth: false });
      setEmail(v.email);
      setStep("verify");
      toast.success("OTP code sent — check your email");
    } catch {
      // Always show success to prevent email enumeration
      setEmail(v.email);
      setStep("verify");
      toast.success("OTP code sent — check your email");
    }
  };

  const onVerifySubmit = async (v: VerifyValues) => {
    try {
      await api.post(
        "/password-reset/verify/",
        { email, code: v.code, new_password: v.new_password },
        { auth: false }
      );
      toast.success("Password reset! Please sign in.");
      navigate({ to: "/login" });
    } catch (err: any) {
      const msg = err?.data?.error ?? "Invalid or expired code";
      toast.error(msg);
    }
  };

  return (
    <AuthShell
      title={step === "request" ? "Forgot password?" : "Enter your code"}
      subtitle={
        step === "request"
          ? "We'll send a 6-digit code to your email."
          : `Enter the code we sent to ${email}`
      }
    >
      {step === "request" ? (
        <form onSubmit={requestForm.handleSubmit(onRequestSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...requestForm.register("email")}
            />
            {requestForm.formState.errors.email && (
              <p className="text-xs text-destructive">{requestForm.formState.errors.email.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={requestForm.formState.isSubmitting}>
            {requestForm.formState.isSubmitting ? "Sending…" : "Send code"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link to="/login" className="text-primary hover:underline font-medium">← Back to sign in</Link>
          </p>
        </form>
      ) : (
        <form onSubmit={verifyForm.handleSubmit(onVerifySubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">6-digit code</Label>
            <Input
              id="code"
              placeholder="123456"
              maxLength={6}
              {...verifyForm.register("code")}
            />
            {verifyForm.formState.errors.code && (
              <p className="text-xs text-destructive">{verifyForm.formState.errors.code.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="new_password">New password</Label>
            <Input
              id="new_password"
              type="password"
              {...verifyForm.register("new_password")}
            />
            {verifyForm.formState.errors.new_password && (
              <p className="text-xs text-destructive">{verifyForm.formState.errors.new_password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirm password</Label>
            <Input
              id="confirm_password"
              type="password"
              {...verifyForm.register("confirm_password")}
            />
            {verifyForm.formState.errors.confirm_password && (
              <p className="text-xs text-destructive">{verifyForm.formState.errors.confirm_password.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={verifyForm.formState.isSubmitting}>
            {verifyForm.formState.isSubmitting ? "Resetting…" : "Reset password"}
          </Button>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => setStep("request")}
            >
              ← Wrong email?
            </button>
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => onRequestSubmit({ email })}
            >
              Resend code
            </button>
          </div>
        </form>
      )}
    </AuthShell>
  );
}
