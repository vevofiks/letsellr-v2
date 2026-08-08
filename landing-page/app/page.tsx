"use client";

import { useState } from "react";
import SmoothScroll from "./components/SmoothScroll";
import Preloader from "./components/Preloader";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import SearchBar from "./components/SearchBar";
import EditorialSection from "./components/EditorialSection";
import PropertyShowcase from "./components/PropertyShowcase";
import FeaturedLocations from "./components/FeaturedLocations";
import FeaturedCategories from "./components/FeaturedCategories";
import FeaturesGrid from "./components/FeaturesGrid";
import CTABanner from "./components/CTABanner";
import Footer from "./components/Footer";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <SmoothScroll>
      {isLoading && <Preloader onComplete={() => setIsLoading(false)} />}

      <main className="min-h-screen bg-[#FAF9F6] text-[#0F0F11] overflow-hidden selection:bg-black selection:text-white">
        <Navbar />
        <HeroSection isLoading={isLoading} />

        {/* Search Bar sits directly below Hero, full width */}
        <div
          className="relative z-20 w-full px-4 pt-6 md:mt-5 pb-6 transition-opacity duration-700 ease-out flex justify-center pointer-events-auto"
          style={{
            opacity: isLoading ? 0 : 1,
          }}
        >
          <SearchBar />
        </div>
        
        {/* Featured Locations (Hidden if empty) */}
        <FeaturedLocations />

        {/* Featured Categories (Bento Grid) */}
        <FeaturedCategories />
       

        {/* Property Showcase (Featured Inventory) directly under the search bar */}
        <PropertyShowcase />

        {/* Editorial Philosophy Section */}
        <EditorialSection />

        {/* Dynamic Testimonials Marquee Grid */}
        <FeaturesGrid />

        <CTABanner />
        <Footer />
      </main>
    </SmoothScroll>
  );
}
