import { isDemoMode } from "@/lib/config";
import HomePage from "./HomePage";

export default async function MainPage() {
  const isDemo = isDemoMode();
  return <HomePage isDemo={isDemo} />;
}
