"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { updateUser } from "@/actions/admin/users/update-user";

const ROLES = [
  { value: "ADMIN", label: "Admin" },
  { value: "GENERAL_MANAGER", label: "General Manager" },
  { value: "CUSTOMER_CARE", label: "Customer Care" },
  { value: "PRODUCTION_MANAGER", label: "Production Manager" },
  { value: "PROJECT_MANAGER", label: "Project Manager" },
  { value: "SUBCONTRACTOR", label: "Subcontractor" },
];

const STATUSES = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "PENDING", label: "Pending" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
];

const ALL_SKILLS = ["asphalt", "tile", "metal", "tpo/flat", "windows", "siding", "paint"];

interface UserDetailViewProps {
  user: {
    id: string;
    name: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string;
    phone: string | null;
    avatar: string | null;
    role: string;
    userStatus: string;
    userLanguage: string;
    is_admin: boolean;
    is_account_admin: boolean;
    skills: string[];
    takingLeads: boolean;
    created_on: string;
    lastLoginAt: string | null;
  };
}

export function UserDetailView({ user }: UserDetailViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    first_name: user.first_name ?? "",
    last_name: user.last_name ?? "",
    name: user.name ?? "",
    email: user.email,
    phone: user.phone ?? "",
    role: user.role,
    userStatus: user.userStatus,
    userLanguage: user.userLanguage,
    is_admin: user.is_admin,
    skills: user.skills ?? [],
    takingLeads: user.takingLeads,
  });

  const toggleSkill = (skill: string) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateUser(user.id, {
        first_name: form.first_name || undefined,
        last_name: form.last_name || undefined,
        name: form.name || undefined,
        email: form.email,
        phone: form.phone || undefined,
        role: form.role,
        userStatus: form.userStatus as any,
        userLanguage: form.userLanguage as any,
        is_admin: form.is_admin,
        skills: form.skills,
        takingLeads: form.takingLeads,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("User updated");
        router.refresh();
      }
    });
  };

  const initials = (form.first_name || form.name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Users
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — profile summary */}
        <Card>
          <CardContent className="pt-6 flex flex-col items-center text-center gap-3">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatar ?? undefined} />
              <AvatarFallback className="text-xl">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold text-lg">{form.name || form.email}</div>
              <div className="text-sm text-muted-foreground">{form.email}</div>
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              <Badge variant={form.userStatus === "ACTIVE" ? "default" : "secondary"}>
                {form.userStatus}
              </Badge>
              <Badge variant="outline">
                {ROLES.find((r) => r.value === form.role)?.label ?? form.role}
              </Badge>
              {form.is_admin && <Badge variant="destructive">Admin</Badge>}
            </div>
            <Separator />
            <div className="text-xs text-muted-foreground space-y-1 w-full text-left">
              <div>Created: {format(new Date(user.created_on), "MMM d, yyyy")}</div>
              {user.lastLoginAt && (
                <div>Last login: {format(new Date(user.lastLoginAt), "MMM d, yyyy h:mm a")}</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right column — edit form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Edit Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>First Name</Label>
                <Input
                  value={form.first_name}
                  onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Last Name</Label>
                <Input
                  value={form.last_name}
                  onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Display Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
            </div>

            {/* Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>
            </div>

            <Separator />

            {/* Role & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm((p) => ({ ...p, role: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.userStatus} onValueChange={(v) => setForm((p) => ({ ...p, userStatus: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Language</Label>
                <Select value={form.userLanguage} onValueChange={(v) => setForm((p) => ({ ...p, userLanguage: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l.value} value={l.value}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Toggles */}
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_admin}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, is_admin: v }))}
                />
                <Label>Admin</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.takingLeads}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, takingLeads: v }))}
                />
                <Label>Taking Leads</Label>
              </div>
            </div>

            <Separator />

            {/* Skills */}
            <div className="space-y-2">
              <Label>Skills</Label>
              <div className="flex flex-wrap gap-2">
                {ALL_SKILLS.map((skill) => (
                  <Badge
                    key={skill}
                    variant={form.skills.includes(skill) ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer select-none",
                      form.skills.includes(skill)
                        ? ""
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => toggleSkill(skill)}
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            {/* Save */}
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isPending}>
                <Save className="h-4 w-4 mr-2" />
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
