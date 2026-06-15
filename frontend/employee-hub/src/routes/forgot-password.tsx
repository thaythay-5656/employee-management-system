import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth/auth-shell";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <AuthShell title="Forgot password?" subtitle="We'll send you a reset link.">
      {sent ? (
        <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
          If <span className="font-medium">{email}</span> exists in our system, we just sent a reset link.
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            toast.success("Reset link sent");
            setSent(true);
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button type="submit" className="w-full">Send reset link</Button>
        </form>
      )}
      <p className="text-center text-sm text-muted-foreground">
        <Link to="/login" className="text-primary hover:underline font-medium">← Back to sign in</Link>
      </p>
    </AuthShell>
  );
}