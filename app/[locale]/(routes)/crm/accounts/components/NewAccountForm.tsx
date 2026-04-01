"use client";

import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { UserSearchCombobox } from "@/components/ui/user-search-combobox";
import { createAccount } from "@/actions/crm/accounts/create-account";

type Props = {
  industries: any[];
  onFinish: () => void;
};

const formSchema = z.object({
  // Required
  name: z.string().min(1, "Customer name is required").max(100),
  billing_street: z.string().min(1, "Billing address is required"),
  billing_city: z.string().min(1, "City is required"),
  billing_state: z.string().min(1, "State is required"),
  billing_postal_code: z.string().min(1, "ZIP is required"),
  type: z.string().min(1, "Type is required"),

  // Optional
  office_phone: z.string().optional(),
  email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  assigned_to: z.string().optional(),
  shipping_street: z.string().optional(),
  shipping_city: z.string().optional(),
  shipping_state: z.string().optional(),
  shipping_postal_code: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function NewAccountForm({ industries, onFinish }: Props) {
  const t = useTranslations("CrmAccountForm");
  const c = useTranslations("Common");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    defaultValues: {
      type: "Individual",
      billing_state: "CO",
      billing_postal_code: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    // Map type to the industry/status field the existing action expects
    const payload: Record<string, string | undefined> = {
      name: data.name,
      office_phone: data.office_phone || undefined,
      email: data.email || undefined,
      billing_street: data.billing_street,
      billing_city: data.billing_city,
      billing_state: data.billing_state,
      billing_postal_code: data.billing_postal_code,
      billing_country: "US",
      shipping_street: data.shipping_street || undefined,
      shipping_city: data.shipping_city || undefined,
      shipping_state: data.shipping_state || undefined,
      shipping_postal_code: data.shipping_postal_code || undefined,
      assigned_to: data.assigned_to || undefined,
      status: "Active",
      description: `Type: ${data.type}`,
    };

    const result = await createAccount(payload as any);
    if (result?.error) {
      form.setError("root.serverError", { message: result.error });
    } else {
      toast.success(t("createSuccess"));
      form.reset();
      onFinish();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="h-full px-4 md:px-10 overflow-y-auto">
        <div className="w-full text-sm space-y-6">

          {/* ── Required Fields ─────────────────── */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Required</p>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("accountName")} <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input
                      disabled={form.formState.isSubmitting}
                      placeholder="Mike Arvizu"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type <span className="text-destructive">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Individual">Individual</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <p className="text-sm font-medium">Billing Address <span className="text-destructive">*</span></p>
              <FormField
                control={form.control}
                name="billing_street"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        disabled={form.formState.isSubmitting}
                        placeholder="1234 Main St"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-3 gap-2">
                <FormField
                  control={form.control}
                  name="billing_city"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          disabled={form.formState.isSubmitting}
                          placeholder="City"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="billing_state"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          disabled={form.formState.isSubmitting}
                          placeholder="State"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="billing_postal_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          disabled={form.formState.isSubmitting}
                          placeholder="ZIP"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* ── Optional Fields ─────────────────── */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Optional</p>

            <FormField
              control={form.control}
              name="office_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input
                      disabled={form.formState.isSubmitting}
                      placeholder="(719) 555-0198"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      disabled={form.formState.isSubmitting}
                      placeholder="customer@email.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assigned_to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner</FormLabel>
                  <FormControl>
                    <UserSearchCombobox
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder={c("selectUser")}
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <p className="text-sm font-medium">Shipping Address</p>
              <FormField
                control={form.control}
                name="shipping_street"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        disabled={form.formState.isSubmitting}
                        placeholder="Street"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-3 gap-2">
                <FormField
                  control={form.control}
                  name="shipping_city"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          disabled={form.formState.isSubmitting}
                          placeholder="City"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shipping_state"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          disabled={form.formState.isSubmitting}
                          placeholder="State"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shipping_postal_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          disabled={form.formState.isSubmitting}
                          placeholder="ZIP"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-2 py-5">
          {form.formState.errors.root?.serverError && (
            <p className="text-sm text-destructive" aria-live="polite">
              {form.formState.errors.root.serverError.message}
            </p>
          )}
          <Button disabled={form.formState.isSubmitting} type="submit" data-testid="account-submit-btn">
            {form.formState.isSubmitting ? (
              <span className="flex items-center animate-pulse">{c("savingData")}</span>
            ) : (
              t("createButton")
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
