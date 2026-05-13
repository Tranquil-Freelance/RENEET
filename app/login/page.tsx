import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Log in or sign up · PrepInsights",
  description: "Create an account or log in with email OTP — no password.",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-paper px-4 py-12">
      <LoginForm />
    </main>
  );
}
