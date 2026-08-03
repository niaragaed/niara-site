import { Hero } from "@/components/Hero";
import { IndexTicker } from "@/components/IndexTicker";
import { SupportedNetworks } from "@/components/SupportedNetworks";

export default function Home() {
  return (
    <>
      <IndexTicker />
      <Hero />
      <SupportedNetworks />
    </>
  );
}
