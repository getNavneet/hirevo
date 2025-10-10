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
      <section className="py-24 bg-white">
    <h2 className="text-center text-3xl sm:text-4xl font-bold mb-12">
      What We Do
    </h2>
    <StackingCards />  // the stacking scroll component we built
  </section>
      {/* <Features/> */}
      {/* <StackingCards/> */}
      <HowItWorks/>
      <Pricing/>
      <FAQ/>
    </div>
  );
}

export default LandingPage;
