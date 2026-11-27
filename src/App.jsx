import Ticker from "./components/Ticker";
import Hero from "./components/Hero";
import { Stats, Categories, Lots, HowItWorks, Trust, Footer } from "./components/Sections";

export default function App() {
  return (
    <>
      <Ticker />
      <Hero />
      <Stats />
      <Categories />
      <Lots />
      <HowItWorks />
      <Trust />
      <Footer />
    </>
  );
}
