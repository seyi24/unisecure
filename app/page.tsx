import { redirect } from "next/navigation";
import { auth } from "./(auth)/auth";

export default async function Page() {
  const session = await auth();

  if (session) {
    redirect("/chat");
  } else {
    redirect("/register");
  }
}