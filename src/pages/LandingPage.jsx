import React from 'react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import Hero from '../components/Hero/Hero';
import Features from '../components/Features/Features';
import HowItWorks from '../components/HowItWorks/HowItWorks';
import Pricing from '../components/Pricing/Pricing';
import FAQ from '../components/FAQ/FAQ';
function LandingPage() {
  return (
    <div>
      <Header/>
      <Hero/>
      <Features/>
      <HowItWorks/>
      <Pricing/>
      <FAQ/>
      <Footer/>
    </div>
  );
}

export default LandingPage;
