import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ShieldCheck, Users, Plus, Eye, EyeOff } from "lucide-react";

import { listUsers, createUser, updateUser, deleteUser } from "@/features/admin/api";
import type { User, UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Badge } from "@/components/ui/badge";

// Schema: empty password => undefined (no change), empty manager => null
const userSchema = z.object({
  fullName: z.string().min(2, "At least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z
    .union([z.string().min(6, "At least 6 characters"), z.literal("")])
    .transform((v) => (v === "" ? undefined : v))
    .optional(),
  role: z.enum(["ADMIN", "LEAD", "EMPLOYEE"] as const),
  managerId: z
    .union([z.string().uuid(), z.literal(""), z.null()])
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
});

type UserSchema = z.infer<typeof userSchema>;
type FormMode = "create" | "edit";

export function UsersPage() {
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: () => listUsers() });

  const [isModalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<FormMode>("create");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const leads = useMemo(() => users?.filter((user) => user.role === "LEAD") ?? [], [users]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserSchema>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      role: "EMPLOYEE",
      // Leave undefined; schema will transform "" to null when submitted
      managerId: undefined,
    },
  });

  const createMutation = useMutation({
    mutationFn: ({ password, ...rest }: UserSchema) =>
      createUser({
        ...rest,
        password: password && password.length > 0 ? password : "Changeme123!",
        managerId: rest.managerId ?? null,
      }),
    onSuccess: () => {
      toast.success("User created");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create user");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<UserSchema> }) => updateUser(id, payload),
    onSuccess: () => {
      toast.success("User updated");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update user");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      toast.success("User removed");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to remove user");
    },
  });

  const openCreateModal = () => {
    setMode("create");
    setEditingUser(null);
    setShowPassword(false);
    reset({ fullName: "", email: "", password: "", role: "EMPLOYEE", managerId: undefined });
    setModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setMode("edit");
    setEditingUser(user);
    setShowPassword(false);
    reset({ fullName: user.fullName, email: user.email, password: "", role: user.role, managerId: user.managerId ?? undefined });
    setModalOpen(true);
  };

  const onSubmit = (data: UserSchema) => {
    const payload: UserSchema = {
      ...data,
      managerId: data.managerId || null,
    };

    if (mode === "create") {
      createMutation.mutate(payload, {
        onSuccess: () => {
          setModalOpen(false);
          reset();
        },
      });
      return;
    }

    if (editingUser) {
      const { password, ...rest } = payload;
      updateMutation.mutate(
        {
          id: editingUser.id,
          payload: {
            ...rest,
            ...(password ? { password } : {}),
          },
        },
        {
          onSuccess: () => {
            setModalOpen(false);
            reset();
          },
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Admin Panel</p>
          <h1 className="text-3xl font-semibold text-white">Team and access roles</h1>
          <p className="mt-2 text-sm text-slate-500">Manage teammates, assign leads, and control access across the workspace.</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4" /> Add user
        </Button>
      </header>

      <div className="overflow-hidden rounded-3xl border border-white/5 bg-white/5">
        <table className="min-w-full divide-y divide-white/5">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Manager</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {isLoading && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  Loading users...
                </td>
              </tr>
            )}
            {!isLoading && users && users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  No team members yet
                </td>
              </tr>
            )}
            {users?.map((user) => (
              <tr key={user.id} className="hover:bg-white/5">
                <td className="px-6 py-4">
                  <div className="text-white">{user.fullName}</div>
                  <div className="text-xs text-slate-500">{user.email}</div>
                </td>
                <td className="px-6 py-4">
                  <RoleBadge role={user.role} />
                </td>
                <td className="px-6 py-4 text-slate-400">
                  {user.managerId ? users.find((candidate) => candidate.id === user.managerId)?.fullName ?? "—" : "—"}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(user)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger hover:bg-danger/10"
                      onClick={() => deleteMutation.mutate(user.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title={mode === "create" ? "Create user" : "Edit user"}
        description="Assign roles and manage the team hierarchy"
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <FormField label="Full name" error={errors.fullName?.message}>
            <Input placeholder="Maria Ivanova" {...register("fullName")} />
          </FormField>

          <FormField label="Email" error={errors.email?.message}>
            <Input type="email" placeholder="user@company.com" {...register("email")} />
          </FormField>

          <FormField label={mode === "create" ? "Password" : "Password (change if needed)"} error={errors.password?.message}>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={mode === "create" ? "••••••••" : "Leave empty to keep current"}
                autoComplete="new-password"
                {...register("password")}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                onClick={() => setShowPassword((v) => !v)}
                title={showPassword ? "Hide" : "Show"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </FormField>

          <FormField label="Role" error={errors.role?.message}>
            <select
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
              {...register("role")}
            >
              <option value="ADMIN">Administrator</option>
              <option value="LEAD">Lead</option>
              <option value="EMPLOYEE">Employee</option>
            </select>
          </FormField>

          <FormField label="Manager" description="Select a lead for team members" error={errors.managerId?.message}>
            <select
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
              {...register("managerId")}
            >
              <option value="">No manager</option>
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.fullName}
                </option>
              ))}
            </select>
          </FormField>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {mode === "create" ? "Create" : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  switch (role) {
    case "ADMIN":
      return (
        <Badge variant="outline" className="flex items-center gap-2 text-primary">
          <ShieldCheck className="h-4 w-4" /> Administrator
        </Badge>
      );
    case "LEAD":
      return (
        <Badge variant="outline" className="flex items-center gap-2 text-accent">
          <Users className="h-4 w-4" /> Lead
        </Badge>
      );
    default:
      return <Badge variant="outline">Employee</Badge>;
  }
}

export default UsersPage;
