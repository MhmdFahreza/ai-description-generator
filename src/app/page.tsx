import Header from "@/componenets/sections/header";
import Hero from "@/componenets/sections/hero";
import ToolsGrid from "@/componenets/sections/toolsgrid";
import FeaturesSection from "@/componenets/sections/featuressection";
import HowItWorks from "@/componenets/sections/howitworks";
import Footer from "@/componenets/sections/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0F1115] font-sans text-[#F5F3ED]">
      <Header />
      <Hero />
      <ToolsGrid />
      <FeaturesSection />
      <HowItWorks />
      <Footer />
    </div>
  );
}
