import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import StudentDiscovery from "@/components/students/StudentDiscovery";

export default async function StudentsPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  return <StudentDiscovery />;
}
