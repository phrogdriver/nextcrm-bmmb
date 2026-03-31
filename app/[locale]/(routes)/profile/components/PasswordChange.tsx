"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { setNewPassword } from "@/actions/user/set-new-password";

const FormSchema = z
  .object({
    password: z.string().min(5, "Password must be at least 5 characters").max(50),
    cpassword: z.string().min(5, "Password must be at least 5 characters").max(50),
  })
  .refine((data) => data.password === data.cpassword, {
    message: "Passwords do not match",
    path: ["cpassword"],
  });

export function PasswordChangeForm({ userId }: { userId: string }) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const t = useTranslations("PasswordChangeForm");
  const router = useRouter();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { password: "", cpassword: "" },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    try {
      setIsLoading(true);
      const result = await setNewPassword({
        userId,
        password: data.password,
        cpassword: data.cpassword,
      });

      if (result.error) {
        toast.error(t("errorPrefix") + result.error);
        return;
      }

      toast.success(t("success"));
      form.reset();
      router.refresh();
    } catch (error: any) {
      toast.error(t("errorPrefix") + (error?.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex space-x-5 w-full p-5 items-end"
      >
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="w-1/3">
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <Input
                  disabled={isLoading}
                  type="password"
                  placeholder="Enter new password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cpassword"
          render={({ field }) => (
            <FormItem className="w-1/3">
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input
                  disabled={isLoading}
                  type="password"
                  placeholder="Re-enter password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="w-[250px]" type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Change password"}
        </Button>
      </form>
    </Form>
  );
}
