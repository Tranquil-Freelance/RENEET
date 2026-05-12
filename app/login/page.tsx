import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Sign in · NEETSurge",
  description: "Sign in with your email to start the gap analysis.",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-paper px-4 py-12">
      <LoginForm />
    </main>
  );
}
