"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { Controller, useForm, type Control } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IUser } from "@/interfaces"
import { createUserAsAdmin, updateUserProfileById } from "@/services/users"

const createSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(80, "Name must be 80 characters or fewer."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: z.enum(["admin", "user"]),
  is_active: z.enum(["true", "false"]),
})

const editSchema = createSchema.omit({ email: true, password: true })

type CreateValues = z.infer<typeof createSchema>
type EditValues = z.infer<typeof editSchema>

type UserFormProps = {
  user?: IUser
  currentUserId?: string
  lockPrivileges?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: (user: IUser) => void
  showTrigger?: boolean
}

export function UserForm({
  user,
  currentUserId,
  lockPrivileges,
  open: openProp,
  onOpenChange,
  onSuccess,
  showTrigger,
}: UserFormProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : uncontrolledOpen
  const isEdit = Boolean(user)
  const shouldShowTrigger = showTrigger ?? !isEdit
  const formId = shouldShowTrigger ? "add-user-form" : "edit-user-form"
  const isSelf = Boolean(user && currentUserId && user.id === currentUserId)
  const privilegesLocked = Boolean(lockPrivileges || isSelf)

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "user",
      is_active: "true",
    },
  })

  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: "",
      role: "user",
      is_active: "true",
    },
  })

  const isSubmitting = isEdit
    ? editForm.formState.isSubmitting
    : createForm.formState.isSubmitting

  function setOpen(nextOpen: boolean) {
    if (!isControlled) setUncontrolledOpen(nextOpen)
    onOpenChange?.(nextOpen)
  }

  useEffect(() => {
    if (!open) return
    if (user) {
      editForm.reset({
        name: user.name ?? "",
        role: user.role === "admin" ? "admin" : "user",
        is_active: user.is_active === false ? "false" : "true",
      })
    } else {
      createForm.reset({
        name: "",
        email: "",
        password: "",
        role: "user",
        is_active: "true",
      })
    }
  }, [open, user, createForm, editForm])

  async function onCreate(values: CreateValues) {
    try {
      const created = await createUserAsAdmin({
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
        is_active: values.is_active === "true",
      })
      toast.success("User created successfully.")
      createForm.reset()
      setOpen(false)
      onSuccess?.(created)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create user. Please try again."
      )
    }
  }

  async function onEdit(values: EditValues) {
    if (!user) return
    try {
      const updated = await updateUserProfileById(user.id, {
        name: values.name,
        role: privilegesLocked ? user.role : values.role,
        is_active: privilegesLocked
          ? user.is_active !== false
          : values.is_active === "true",
      })
      toast.success("User updated successfully.")
      setOpen(false)
      onSuccess?.(updated)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update user. Please try again."
      )
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          createForm.reset()
          editForm.reset()
        }
      }}
    >
      {shouldShowTrigger && (
        <DialogTrigger asChild>
          <Button>Add user</Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit user" : "Add user"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this account’s name, role, and access."
              : "Creates a login and a store profile. Share the password securely."}
          </DialogDescription>
        </DialogHeader>

        {isEdit ? (
          <form
            id={formId}
            onSubmit={editForm.handleSubmit(onEdit)}
            className="space-y-4"
          >
            <FieldGroup className="gap-4">
              <Controller
                name="name"
                control={editForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${formId}-name`}>Full name</FieldLabel>
                    <Input
                      {...field}
                      id={`${formId}-name`}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Field>
                <FieldLabel htmlFor={`${formId}-email`}>Email</FieldLabel>
                <Input id={`${formId}-email`} value={user?.email ?? ""} disabled />
                <FieldDescription>
                  Email is the sign-in identifier and cannot be changed here.
                </FieldDescription>
              </Field>
              <PrivilegeFields
                formId={formId}
                control={editForm.control as unknown as Control<CreateValues>}
                locked={privilegesLocked}
                lockHint={
                  isSelf
                    ? "You cannot change your own role or deactivate yourself."
                    : "This is the last active admin and cannot be demoted or deactivated."
                }
              />
            </FieldGroup>
          </form>
        ) : (
          <form
            id={formId}
            onSubmit={createForm.handleSubmit(onCreate)}
            className="space-y-4"
          >
            <FieldGroup className="gap-4">
              <Controller
                name="name"
                control={createForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${formId}-name`}>Full name</FieldLabel>
                    <Input
                      {...field}
                      id={`${formId}-name`}
                      autoComplete="name"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="email"
                control={createForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${formId}-email`}>Email</FieldLabel>
                    <Input
                      {...field}
                      id={`${formId}-email`}
                      type="email"
                      autoComplete="off"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="password"
                control={createForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${formId}-password`}>
                      Temporary password
                    </FieldLabel>
                    <Input
                      {...field}
                      id={`${formId}-password`}
                      type="password"
                      autoComplete="new-password"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldDescription>
                      At least 8 characters. The user can change it after login.
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <PrivilegeFields formId={formId} control={createForm.control} />
            </FieldGroup>
          </form>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" form={formId} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                {isEdit ? "Saving user" : "Creating user"}
                <Loader2 className="size-4 animate-spin" />
              </>
            ) : isEdit ? (
              "Save changes"
            ) : (
              "Create user"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PrivilegeFields({
  formId,
  control,
  locked,
  lockHint,
}: {
  formId: string
  control: Control<CreateValues>
  locked?: boolean
  lockHint?: string
}) {
  return (
    <>
      <Controller
        name="role"
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel htmlFor={`${formId}-role`}>Role</FieldLabel>
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={locked}
            >
              <SelectTrigger id={`${formId}-role`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Customer</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        )}
      />
      <Controller
        name="is_active"
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel htmlFor={`${formId}-access`}>Access</FieldLabel>
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={locked}
            >
              <SelectTrigger id={`${formId}-access`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
            {locked && lockHint ? (
              <FieldDescription>{lockHint}</FieldDescription>
            ) : (
              <FieldDescription>
                Inactive accounts cannot sign in.
              </FieldDescription>
            )}
          </Field>
        )}
      />
    </>
  )
}
