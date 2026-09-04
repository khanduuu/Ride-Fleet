import { useState } from "react";
import { authService } from "@/services/auth.service";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserRole } from "@/types";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In or Create an Account — Ridefleet" },
      {
        name: "description",
        content:
          "Access your Ridefleet workspace as a customer, vendor or administrator.",
      },
      {
        property: "og:title",
        content: "Sign In or Create an Account — Ridefleet",
      },
      {
        property: "og:description",
        content:
          "Access your Ridefleet workspace as a customer, vendor or administrator.",
      },
    ],
  }),
  component: AuthPage,
});

const roleRoutes: Record<UserRole, string> = {
  customer: "/dashboard",
  vendor: "/vendor",
  admin: "/admin",
};

function AuthPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<"signin" | "register">("signin");

  const [role, setRole] = useState<UserRole>("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  async function handleLogin(event: React.FormEvent) {
  event.preventDefault();

  try {
    const result = await authService.login(email, password);

    const token = result.access_token;

    localStorage.setItem("access_token", token);

    const payload = JSON.parse(
    atob(token.split(".")[1]!)
    );

    const userRole = payload.role as UserRole;

    toast.success("Login successful");

    void navigate({ to: roleRoutes[userRole] });
  } catch (error: any) {
    console.error("Login error:", error);

    const message =
      error?.response?.data?.detail ||
      error?.message ||
      "Login failed";

    toast.error(message);
  }
}
async function handleRegister(event: React.FormEvent) {
  event.preventDefault();

  try {
    await authService.register({
      name,
      email,
      password,
      role,
    });

    toast.success("Account created successfully");

    // Automatically login after registration
    const result = await authService.login(email, password);

    const token = result.access_token;

    localStorage.setItem("access_token", token);

    const payload = JSON.parse(
    atob(token.split(".")[1]!)
);

    const userRole = payload.role as UserRole;

    toast.success("Login successful");

    void navigate({ to: roleRoutes[userRole] });
  } catch (error: any) {
    console.error("Registration error:", error);

    const message =
      error?.response?.data?.detail ||
      error?.message ||
      "Registration failed";

    toast.error(message);
  }
}

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-7xl grid-cols-1 items-center gap-16 px-6 py-16 lg:grid-cols-2">

      <div className="max-w-[45ch]">
        <h1 className="font-display text-4xl font-medium tracking-tight text-balance">
          One account. Three workspaces.
        </h1>

        <p className="mt-4 text-muted-foreground">
          Customers book and track rentals. Vendors run fleets,
          maintenance and payouts. Admins oversee the whole platform.
        </p>

        <p className="mt-8 flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" />

          Secure authentication for customers, vendors and administrators.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-panel">

        <Tabs
          value={mode}
          onValueChange={(value) =>
            setMode(value as "signin" | "register")
          }
        >

          <TabsList className="w-full">
            <TabsTrigger value="signin" className="flex-1">
              Sign in
            </TabsTrigger>

            <TabsTrigger value="register" className="flex-1">
              Register
            </TabsTrigger>
          </TabsList>

          {/* SIGN IN */}

          <TabsContent value="signin" className="mt-6">

            <form
              className="space-y-4"
              onSubmit={handleLogin}
            >

              <Input
                id="signin-email"
                type="email"
                placeholder="alex@example.com"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />

              <Input
                id="signin-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
              />

              <Button
                type="submit"
                size="lg"
                className="w-full"
              >
                Sign in
              </Button>

            </form>

          </TabsContent>

          {/* REGISTER */}

          <TabsContent value="register" className="mt-6">

            <form
              className="space-y-4"
              onSubmit={handleRegister}
            >

              <Input
                id="reg-name"
                placeholder="Alex Rivera"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
              />

              <Input
                id="reg-email"
                type="email"
                placeholder="alex@example.com"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />

              <Input
                id="reg-password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
              />

              <RoleSelect
                id="reg-role"
                value={role}
                onChange={setRole}
              />

              <Button
                type="submit"
                size="lg"
                className="w-full"
              >
                Create account
              </Button>

            </form>

          </TabsContent>

        </Tabs>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Just browsing?{" "}
          <Link
            to="/vehicles"
            className="font-medium text-foreground hover:underline"
          >
            Explore the fleet
          </Link>
        </p>

      </div>
    </div>
  );
}

function RoleSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: UserRole;
  onChange: (role: UserRole) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="label-eyebrow"
      >
        Workspace
      </label>

      <Select
        value={value}
        onValueChange={(next) =>
          onChange(next as UserRole)
        }
      >
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="customer">
            Customer
          </SelectItem>

          <SelectItem value="vendor">
            Vendor
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}