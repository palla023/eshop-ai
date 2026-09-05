"use client"

import { useEffect, useRef, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Camera, Loader2, Trash2 } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
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
import { IUser } from "@/interfaces"
import { uploadFileAndReturnUrl } from "@/services/uploads"
import { updateCurrentUserProfile } from "@/services/users"
import { useUserStore } from "@/store/user-store"

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(80, "Name must be 80 characters or fewer."),
})

type ProfileFormValues = z.infer<typeof formSchema>

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAX_IMAGE_BYTES = 2 * 1024 * 1024

function getInitials(name?: string) {
  if (!name?.trim()) return "U"
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "U"
  )
}

export function ProfileDetailsForm({ user }: { user: IUser }) {
  const setUser = useUserStore((state) => state.setUser)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoPreview, setPhotoPreview] = useState(user.profile_pic?.trim() || "")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user.name ?? "",
    },
  })

  useEffect(() => {
    form.reset({ name: user.name ?? "" })
    setPhotoPreview(user.profile_pic?.trim() || "")
    setSelectedFile(null)
    setRemovePhoto(false)
  }, [form, user.name, user.profile_pic])

  function handlePhotoPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Use a JPG, PNG, WEBP, or GIF image.")
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Photo must be 2 MB or smaller.")
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setSelectedFile(file)
    setRemovePhoto(false)
    setPhotoPreview((current) => {
      if (current.startsWith("blob:")) URL.revokeObjectURL(current)
      return previewUrl
    })
  }

  function handleRemovePhoto() {
    setSelectedFile(null)
    setRemovePhoto(true)
    setPhotoPreview("")
  }

  async function onSubmit(values: ProfileFormValues) {
    setIsSaving(true)
    try {
      let profilePic = user.profile_pic ?? ""
      if (removePhoto) {
        profilePic = ""
      } else if (selectedFile) {
        profilePic = await uploadFileAndReturnUrl(selectedFile)
      }

      const updated = await updateCurrentUserProfile({
        name: values.name,
        profile_pic: profilePic,
      })
      setUser(updated)
      setSelectedFile(null)
      setRemovePhoto(false)
      setPhotoPreview(updated.profile_pic?.trim() || "")
      toast.success("Profile updated.")
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : typeof error === "object" &&
              error &&
              "message" in error &&
              typeof error.message === "string"
            ? error.message
            : "Failed to update profile."
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const displayName = form.watch("name") || user.email

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Personal details</CardTitle>
        <CardDescription>
          This name and photo appear in the header and on your dashboard.
        </CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="pt-5">
          <FieldGroup>
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <div className="relative">
                <div className="size-24 overflow-hidden rounded-full ring-2 ring-zinc-200">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt={displayName}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-linear-to-br from-zinc-200 to-zinc-500 text-lg font-semibold text-black">
                      {getInitials(displayName)}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute right-0 bottom-0 flex size-8 items-center justify-center rounded-full bg-zinc-950 text-white shadow-md ring-2 ring-white transition-colors hover:bg-zinc-800"
                  aria-label="Change photo"
                >
                  <Camera className="size-3.5" />
                </button>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Profile photo</p>
                <p className="text-muted-foreground text-xs">
                  JPG, PNG, WEBP, or GIF. Max 2 MB.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Upload photo
                  </Button>
                  {(photoPreview || user.profile_pic) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemovePhoto}
                    >
                      <Trash2 />
                      Remove
                    </Button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES.join(",")}
                  className="sr-only"
                  onChange={handlePhotoPick}
                />
              </div>
            </div>

            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="profile-name">Full name</FieldLabel>
                  <Input
                    id="profile-name"
                    autoComplete="name"
                    placeholder="Your name"
                    aria-invalid={fieldState.invalid}
                    {...field}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Field>
              <FieldLabel htmlFor="profile-email">Email</FieldLabel>
              <Input
                id="profile-email"
                value={user.email}
                readOnly
                disabled
              />
              <p className="text-muted-foreground text-xs">
                Email is used to sign in and cannot be changed here.
              </p>
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={isSaving} className="min-w-32">
            {isSaving ? <Loader2 className="animate-spin" /> : null}
            Save changes
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
