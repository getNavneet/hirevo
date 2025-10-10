import Hero from '../components/Hero/Hero.light';
import Features from '../components/Features/Features';
import HowItWorks from '../components/HowItWorks/HowItWorks';
import Pricing from '../components/Pricing/Pricing';
import FAQ from '../components/FAQ/FAQ';
import StackingCards from '../components/StackingScroll/StackingScroll';
function LandingPage() {
  return (
    <div>
      <Hero/>
      <Features/>
      <StackingCards/>
      <HowItWorks/>
      <Pricing/>
      <FAQ/>
    </div>
  );
}

export default LandingPage;
