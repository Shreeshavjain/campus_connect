import OTPVerification from "@/components/auth/OTPVerification";

interface VerifyOTPPageProps {
  searchParams: Promise<{ email?: string }>;
}

export default async function VerifyOTPPage({ searchParams }: VerifyOTPPageProps) {
  const params = await searchParams;
  const email = params.email ?? "student@nmamit.in";

  return <OTPVerification email={email} />;
}
