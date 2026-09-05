"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, ArrowRight, Loader2, ShoppingBag } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { registerNewUser } from "@/services/users"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
})

export function RegisterForm() {
  const router = useRouter()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  })

  const isSubmitting = form.formState.isSubmitting

  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      await registerNewUser({
        name: data.name,
        email: data.email,
        password: data.password,
        role: "user",
      })
      toast.success("Account created successfully. You can now log in.")
      router.push("/login")
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again."
      )
    }
  }

  return (
    <div className="w-full sm:max-w-[420px]">
      <div className="mb-6 flex items-center justify-around px-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to home
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xl font-bold tracking-tight text-foreground"
        >
          <ShoppingBag className="size-5" aria-hidden />
          Eshop
        </Link>
      </div>

      <Card className="border-border/60 bg-white shadow-xl shadow-black/[0.04] ring-0">
        <CardHeader className="space-y-1 pb-2 text-center">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Create an account
            </CardTitle>
            <CardDescription className="text-base">
              Join Eshop and start shopping in minutes.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          <form
            id="register-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <FieldGroup className="gap-4">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="register-name">Full name</FieldLabel>
                    <Input
                      {...field}
                      id="register-name"
                      autoComplete="name"
                      placeholder="John Doe"
                      aria-invalid={fieldState.invalid}
                      className="h-11 bg-muted/30 transition-colors focus-visible:bg-background"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="register-email">Email</FieldLabel>
                    <Input
                      {...field}
                      id="register-email"
                      type="email"
                      autoComplete="email"
                      placeholder="name@example.com"
                      aria-invalid={fieldState.invalid}
                      className="h-11 bg-muted/30 transition-colors focus-visible:bg-background"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="register-password">Password</FieldLabel>
                    <Input
                      {...field}
                      id="register-password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Create a password"
                      aria-invalid={fieldState.invalid}
                      className="h-11 bg-muted/30 transition-colors focus-visible:bg-background"
                    />
                    <FieldDescription>
                      Must be at least 8 characters.
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 w-full gap-2 text-base"
            >
              {isSubmitting ? (
                <>
                  Creating account
                  <Loader2 className="size-4 animate-spin" />
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

          <FieldSeparator className="my-6">or</FieldSeparator>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-foreground underline-offset-4 transition-colors hover:underline"
            >
              Log In
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
