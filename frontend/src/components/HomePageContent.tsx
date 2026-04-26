import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/home-page-content.css';

/**
 * Static content section rendered below the search form on the home page.
 * Provides rich text content so Google AdSense reviewers and search crawlers
 * see a content-rich page, not just a utility search widget.
 */
const HomePageContent: React.FC = () => {
  return (
    <div className="home-page-content">

      {/* How It Works */}
      <section className="hpc-section" aria-labelledby="how-it-works-heading">
        <h2 id="how-it-works-heading" className="hpc-section-title">
          How to Find Bus Timings on Perundhu
        </h2>
        <div className="hpc-steps">
          <div className="hpc-step">
            <span className="hpc-step-number">1</span>
            <div>
              <h3>Enter Your Starting Point</h3>
              <p>
                Type the name of your departure city or town in Tamil or English.
                Perundhu supports over 690 locations across Tamil Nadu including
                Chennai, Coimbatore, Madurai, Trichy, Salem, Tirunelveli, and Vellore.
              </p>
            </div>
          </div>
          <div className="hpc-step">
            <span className="hpc-step-number">2</span>
            <div>
              <h3>Choose Your Destination</h3>
              <p>
                Select where you want to go. You can search for bus routes between
                any two locations in Tamil Nadu — district headquarters, bus stands,
                towns, and even smaller villages.
              </p>
            </div>
          </div>
          <div className="hpc-step">
            <span className="hpc-step-number">3</span>
            <div>
              <h3>Browse Bus Schedules</h3>
              <p>
                See all available government buses (TNSTC, MTC, SETC) and private
                operators, with departure times, bus numbers, fare estimates,
                and bus type (Ordinary, Express, Deluxe, AC, Ultra-Deluxe).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Routes */}
      <section className="hpc-section" aria-labelledby="popular-routes-heading">
        <h2 id="popular-routes-heading" className="hpc-section-title">
          Popular Bus Routes in Tamil Nadu
        </h2>
        <p className="hpc-intro-text">
          Perundhu covers thousands of TNSTC, MTC, and SETC bus routes across Tamil
          Nadu. Here are some of the most frequently searched routes on our platform:
        </p>
        <div className="hpc-routes-grid">
          {[
            { from: 'Chennai', to: 'Madurai', desc: 'Multiple daily departures via NH-44. Express and Deluxe services available.' },
            { from: 'Chennai', to: 'Coimbatore', desc: 'Frequent overnight and day buses. AC and Non-AC options.' },
            { from: 'Chennai', to: 'Trichy', desc: 'Well-connected route with SETC and private operators.' },
            { from: 'Madurai', to: 'Coimbatore', desc: 'Regular TNSTC services connecting two major cities.' },
            { from: 'Chennai', to: 'Salem', desc: 'Express buses via NH-44 and NH-79.' },
            { from: 'Coimbatore', to: 'Ooty', desc: 'Scenic hill route with government and private buses.' },
            { from: 'Madurai', to: 'Tirunelveli', desc: 'Frequent government and private buses throughout the day.' },
            { from: 'Chennai', to: 'Vellore', desc: 'Short distance route with very frequent buses.' },
            { from: 'Trichy', to: 'Thanjavur', desc: 'Rapid route with many buses available hourly.' },
            { from: 'Chennai', to: 'Puducherry', desc: 'Regular MTC and private services via East Coast Road.' },
            { from: 'Coimbatore', to: 'Tiruppur', desc: 'Frequent short-distance buses throughout the day.' },
            { from: 'Madurai', to: 'Rameswaram', desc: 'TNSTC and private services to the pilgrim town.' },
          ].map((route) => (
            <div key={`${route.from}-${route.to}`} className="hpc-route-card">
              <div className="hpc-route-header">
                <span className="hpc-route-from">{route.from}</span>
                <span className="hpc-route-arrow">→</span>
                <span className="hpc-route-to">{route.to}</span>
              </div>
              <p className="hpc-route-desc">{route.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About the Service */}
      <section className="hpc-section" aria-labelledby="about-service-heading">
        <h2 id="about-service-heading" className="hpc-section-title">
          About Perundhu — Tamil Nadu's Bus Route Finder
        </h2>
        <p>
          Perundhu (பேருந்து) is a free, community-powered bus schedule platform
          dedicated to making public bus travel across Tamil Nadu easier for everyone.
          The name "Perundhu" means "bus" in Tamil, reflecting our focus on serving
          Tamil Nadu commuters in their own language.
        </p>
        <p>
          Our platform combines official government data from TNSTC (Tamil Nadu
          State Transport Corporation), MTC (Metropolitan Transport Corporation
          Chennai), and SETC (State Express Transport Corporation) with crowd-sourced
          contributions from thousands of regular bus commuters.
        </p>
        <p>
          Whether you're planning a daily commute in Chennai, a long-distance journey
          from Coimbatore to Madurai, or a pilgrimage trip to Rameswaram or
          Tirupati, Perundhu helps you find the right bus at the right time — for free.
        </p>
        <div className="hpc-cta-links">
          <Link to="/about" className="hpc-link">Learn more about us →</Link>
          <Link to="/faq" className="hpc-link">Read the FAQ →</Link>
          <Link to="/contribute" className="hpc-link">Contribute a route →</Link>
        </div>
      </section>

      {/* Cities Covered */}
      <section className="hpc-section" aria-labelledby="cities-heading">
        <h2 id="cities-heading" className="hpc-section-title">
          Bus Routes Across Tamil Nadu — Cities and Districts We Cover
        </h2>
        <p className="hpc-intro-text">
          Perundhu covers bus routes in all 38 districts of Tamil Nadu. Search for
          buses from any of these major cities and hundreds of smaller towns:
        </p>
        <div className="hpc-cities-grid">
          {[
            'Chennai', 'Coimbatore', 'Madurai', 'Trichy (Tiruchirappalli)',
            'Salem', 'Tirunelveli', 'Erode', 'Vellore', 'Thoothukudi (Tuticorin)',
            'Dindigul', 'Thanjavur', 'Ranipet', 'Kancheepuram', 'Sivakasi',
            'Ooty (Udhagamandalam)', 'Hosur', 'Nagercoil', 'Kumbakonam',
            'Karur', 'Virudhunagar', 'Namakkal', 'Dharmapuri', 'Krishnagiri',
            'Perambalur', 'Ariyalur', 'Nagapattinam', 'Ramanathapuram',
            'Pudukkottai', 'Sivaganga', 'Tiruvannamalai', 'Villupuram',
            'Cuddalore', 'Mayiladuthurai', 'Tiruvarur', 'Tenkasi', 'Chengalpattu',
          ].map((city) => (
            <span key={city} className="hpc-city-tag">{city}</span>
          ))}
        </div>
      </section>

      {/* Bus Types Guide */}
      <section className="hpc-section" aria-labelledby="bus-types-heading">
        <h2 id="bus-types-heading" className="hpc-section-title">
          Types of Buses in Tamil Nadu
        </h2>
        <div className="hpc-bus-types">
          {[
            {
              type: 'Ordinary Bus',
              operator: 'TNSTC / MTC',
              desc: 'Stops at every bus stop. Most affordable option. Best for shorter distances and local travel within districts.',
            },
            {
              type: 'Express Bus',
              operator: 'TNSTC / SETC',
              desc: 'Stops at major towns only. Faster than ordinary buses. Good balance of speed and cost for medium distances.',
            },
            {
              type: 'Deluxe Bus',
              operator: 'TNSTC / SETC',
              desc: 'Limited stops, comfortable seating. Ideal for inter-city travel. Slightly higher fare than Express.',
            },
            {
              type: 'Ultra Deluxe (Non-AC)',
              operator: 'SETC',
              desc: 'Push-back seats, very limited stops. Popular for overnight and long-distance routes.',
            },
            {
              type: 'AC Sleeper / AC Seater',
              operator: 'SETC / Private',
              desc: 'Air-conditioned comfort for long journeys. Available on major intercity routes like Chennai–Madurai, Chennai–Coimbatore.',
            },
            {
              type: 'MTC City Bus',
              operator: 'MTC Chennai',
              desc: 'Metropolitan Transport Corporation buses operate within Chennai city and suburbs. Frequent service on hundreds of routes.',
            },
          ].map((bus) => (
            <div key={bus.type} className="hpc-bus-type-card">
              <h3 className="hpc-bus-type-name">{bus.type}</h3>
              <span className="hpc-bus-operator">{bus.operator}</span>
              <p>{bus.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Teaser */}
      <section className="hpc-section" aria-labelledby="faq-teaser-heading">
        <h2 id="faq-teaser-heading" className="hpc-section-title">
          Frequently Asked Questions
        </h2>
        <div className="hpc-faq-list">
          {[
            {
              q: 'Is Perundhu free to use?',
              a: 'Yes, Perundhu is completely free to use. There are no subscription fees, hidden charges, or premium tiers. All bus schedule information is available to every user at no cost.',
            },
            {
              q: 'How accurate are the bus timings?',
              a: 'Bus timings are sourced from official TNSTC, MTC, and SETC schedules and verified by community contributors. Timings are updated regularly, but actual departure times may vary due to traffic, seasonal changes, or route modifications.',
            },
            {
              q: 'Does Perundhu support Tamil language?',
              a: 'Yes! Perundhu fully supports Tamil (தமிழ்) and English. You can search for locations in Tamil script, and the app interface can be switched to Tamil using the language toggle.',
            },
            {
              q: 'Can I find connecting bus routes?',
              a: 'Yes. If no direct bus is available between your origin and destination, Perundhu shows connecting route options that involve changing buses at an intermediate stop.',
            },
            {
              q: 'How do I add a missing bus route?',
              a: 'Use the "Contribute" feature in the app. Enter the route details, bus number, stops, and timings. Our team reviews and adds verified contributions within 24–48 hours.',
            },
          ].map((item) => (
            <div key={item.q} className="hpc-faq-item">
              <h3 className="hpc-faq-q">{item.q}</h3>
              <p className="hpc-faq-a">{item.a}</p>
            </div>
          ))}
        </div>
        <div className="hpc-cta-links">
          <Link to="/faq" className="hpc-link">View all FAQs →</Link>
        </div>
      </section>

    </div>
  );
};

export default HomePageContent;
