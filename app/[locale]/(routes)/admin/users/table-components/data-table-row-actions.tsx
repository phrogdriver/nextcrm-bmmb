"use client";

import { Row } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { adminUserSchema } from "../table-data/schema";
import { useRouter } from "next/navigation";
import AlertModal from "@/components/modals/alert-modal";
import { useState } from "react";
import { toast } from "sonner";

import { Copy, Edit, MoreHorizontal, Trash, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button as SheetButton } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { deleteUser } from "@/actions/admin/users/delete-user";
import { activateUser } from "@/actions/admin/users/activate-user";
import { deactivateUser } from "@/actions/admin/users/deactivate-user";
import { activateAdmin } from "@/actions/admin/users/activate-admin";
import { deactivateAdmin } from "@/actions/admin/users/deactivate-admin";
import { updateUserSkills } from "@/actions/admin/users/update-skills";
import { toggleTakingLeads } from "@/actions/admin/users/toggle-taking-leads";

const ALL_SKILLS = ["asphalt", "tile", "metal", "tpo/flat", "windows", "siding", "paint"];

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const router = useRouter();
  const data = adminUserSchema.parse(row.original);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [userSkills, setUserSkills] = useState<string[]>((row.original as any).skills ?? []);
  const [savingSkills, setSavingSkills] = useState(false);

  const toggleSkill = (skill: string) => {
    setUserSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const saveSkills = async () => {
    setSavingSkills(true);
    const result = await updateUserSkills(data.id, userSkills);
    setSavingSkills(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Skills updated");
      router.refresh();
      setSkillsOpen(false);
    }
  };

  const onCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("The URL has been copied to your clipboard.");
  };

  //Action triggered when the delete button is clicked to delete the store
  const onDelete = async () => {
    try {
      setLoading(true);
      const result = await deleteUser(data.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
      toast.success("User has been deleted");
    } catch (error) {
      toast.error("Something went wrong: " + error + ". Please try again.");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const onActivate = async () => {
    try {
      setLoading(true);
      const result = await activateUser(data.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
      toast.success("User has been activated.");
    } catch (error) {
      toast.error("Something went wrong while activating user. Please try again.");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const onDeactivate = async () => {
    try {
      setLoading(true);
      const result = await deactivateUser(data.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
      toast.success("User has been deactivated.");
    } catch (error) {
      toast.error("Something went wrong while deactivating user. Please try again.");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const onDeactivateAdmin = async () => {
    try {
      setLoading(true);
      const result = await deactivateAdmin(data.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
      toast.success("User Admin rights has been deactivated.");
    } catch (error) {
      toast.error("Something went wrong while deactivating user as a admin. Please try again.");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const onActivateAdmin = async () => {
    try {
      setLoading(true);
      const result = await activateAdmin(data.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
      toast.success("User Admin rights has been activated.");
    } catch (error) {
      toast.error("Something went wrong while activating uses as a admin. Please try again.");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onDelete}
        loading={loading}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={"ghost"} className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onCopy(data?.id)}>
            <Copy className="mr-2 w-4 h-4" />
            Copy ID
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onActivate()}>
            <Edit className="mr-2 w-4 h-4" />
            Activate
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDeactivate()}>
            <Edit className="mr-2 w-4 h-4" />
            Deactivate
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onActivateAdmin()}>
            <Edit className="mr-2 w-4 h-4" />
            Activate Admin rights
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDeactivateAdmin()}>
            <Edit className="mr-2 w-4 h-4" />
            Deactivate Admin rights
          </DropdownMenuItem>
          <DropdownMenuItem onClick={async () => {
            const current = (row.original as any).takingLeads ?? true;
            const result = await toggleTakingLeads(data.id, !current);
            if (result.error) toast.error(result.error);
            else { toast.success(current ? "Removed from lead rotation" : "Added to lead rotation"); router.refresh(); }
          }}>
            <Edit className="mr-2 w-4 h-4" />
            {(row.original as any).takingLeads ? "Remove from Leads" : "Add to Leads"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => { setUserSkills((row.original as any).skills ?? []); setSkillsOpen(true); }}>
            <Wrench className="mr-2 w-4 h-4" />
            Manage Skills
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <Trash className="mr-2 w-4 h-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Sheet open={skillsOpen} onOpenChange={setSkillsOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Skills — {data.name}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              {ALL_SKILLS.map((skill) => (
                <SheetButton
                  key={skill}
                  size="sm"
                  variant={userSkills.includes(skill) ? "default" : "outline"}
                  className="capitalize"
                  onClick={() => toggleSkill(skill)}
                >
                  {skill}
                </SheetButton>
              ))}
            </div>
            <SheetButton onClick={saveSkills} disabled={savingSkills} className="w-full">
              {savingSkills ? "Saving…" : "Save Skills"}
            </SheetButton>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
