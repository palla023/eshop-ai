import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="relative flex min-h-full flex-1 items-center justify-center overflow-hidden px-4 py-16">
      <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-black/[0.03] blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-black/[0.03] blur-3xl" />

      <LoginForm />
    </div>
  )
}
