import { Hero } from "../components/Hero";
import { HowItWorks } from "../components/HowItWorks";
import { Sidebar } from "../components/Sidebar";
import { QuickStart } from "../components/QuickStart";

export default function HomeLanding() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <Sidebar />
        </div>
        <div className="md:col-span-3">
          <Hero />
          <QuickStart />
          <HowItWorks />
        </div>
      </div>
    </main>
  );
}


