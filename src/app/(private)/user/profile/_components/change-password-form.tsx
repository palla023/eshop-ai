"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react"
import { Controller, useForm, type ControllerRenderProps } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { changeUserPassword } from "@/services/users"

const formSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters.")
      .regex(/[A-Za-z]/, "Include at least one letter.")
      .regex(/\d/, "Include at least one number."),
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  })
  .refine((values) => values.currentPassword !== values.newPassword, {
    path: ["newPassword"],
    message: "New password must be different from the current one.",
  })

type PasswordFormValues = z.infer<typeof formSchema>

function PasswordField({
  id,
  label,
  field,
  invalid,
  error,
}: {
  id: string
  label: string
  field: ControllerRenderProps<PasswordFormValues, keyof PasswordFormValues>
  invalid: boolean
  error?: { message?: string }
}) {
  const [visible, setVisible] = useState(false)

  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={id === "current-password" ? "current-password" : "new-password"}
          aria-invalid={invalid}
          className="pr-10"
          {...field}
        />
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1"
          onClick={() => setVisible((open) => !open)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {invalid && <FieldError errors={[error]} />}
    </Field>
  )
}

export function ChangePasswordForm() {
  const [isSaving, setIsSaving] = useState(false)
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(values: PasswordFormValues) {
    setIsSaving(true)
    try {
      await changeUserPassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      form.reset()
      toast.success("Password updated.")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to change password."
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="text-muted-foreground size-4" />
          Password &amp; security
        </CardTitle>
        <CardDescription>
          Verify your current password, then choose a stronger one.
        </CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="pt-5">
          <FieldGroup>
            <Controller
              name="currentPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <PasswordField
                  id="current-password"
                  label="Current password"
                  field={field}
                  invalid={fieldState.invalid}
                  error={fieldState.error}
                />
              )}
            />
            <Controller
              name="newPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <PasswordField
                  id="new-password"
                  label="New password"
                  field={field}
                  invalid={fieldState.invalid}
                  error={fieldState.error}
                />
              )}
            />
            <Controller
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <PasswordField
                  id="confirm-password"
                  label="Confirm new password"
                  field={field}
                  invalid={fieldState.invalid}
                  error={fieldState.error}
                />
              )}
            />
            <p className="text-muted-foreground text-xs">
              Use at least 8 characters with a letter and a number.
            </p>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={isSaving} className="min-w-36">
            {isSaving ? <Loader2 className="animate-spin" /> : null}
            Update password
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
