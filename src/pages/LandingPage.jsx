import Hero from '../components/Hero/Hero';
import Features from '../components/Features/Features';
import HowItWorks from '../components/HowItWorks/HowItWorks';
import Pricing from '../components/Pricing/Pricing';
import FAQ from '../components/FAQ/FAQ';
function LandingPage() {
  return (
    <div>
      <Hero/>
      <Features/>
      <HowItWorks/>
      {/* <Pricing/> */}
      <FAQ/>
    </div>
  );
}

export default LandingPage;
