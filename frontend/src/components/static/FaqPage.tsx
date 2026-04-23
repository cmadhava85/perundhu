import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import '../../styles/static-pages.css';

const FaqPage: React.FC = () => {
  const { t } = useTranslation();

  const faqs = [
    { question: t('pages.faq.q1', 'How do I search for bus routes?'), answer: t('pages.faq.a1', 'Enter your departure and destination locations in the search form on the home page, then click "Find Buses" to see available routes.') },
    { question: t('pages.faq.q2', 'Is the bus timing information accurate?'), answer: t('pages.faq.a2', 'Our database is updated regularly through official sources and people contributions. However, actual timings may vary due to traffic and other factors. Always allow extra time for your journey.') },
    { question: t('pages.faq.q3', 'How can I contribute route information?'), answer: t('pages.faq.a3', 'Click on "Contribute" in the app to add new route information. Currently, you can enter details manually using the form.') },
    { question: t('pages.faq.q4', 'How does bus tracking work?'), answer: t('pages.faq.a4', 'When passengers on a bus enable tracking, their anonymized location helps show the real-time position of the bus on the map. More trackers mean more accurate information.') },
    { question: t('pages.faq.q5', 'What languages are supported?'), answer: t('pages.faq.a5', 'Perundhu currently supports English and Tamil. You can switch languages using the language selector in the header.') },
    { question: t('pages.faq.q6', 'How do I report incorrect information?'), answer: t('pages.faq.a6', 'Use the "Report Issue" option on any bus route to report incorrect timings, wrong stops, or other issues. Our team will review and update the information.') },
    { question: t('pages.faq.q7', 'Is the app free to use?'), answer: t('pages.faq.a7', 'Yes, Perundhu is completely free to use. There are no hidden charges or premium features.') },
    { question: t('pages.faq.q8', 'Can I use the app offline?'), answer: t('pages.faq.a8', 'Some features like searching previously viewed routes work offline. However, real-time tracking and new searches require an internet connection.') },
    { question: t('pages.faq.q9', 'Which cities and regions are covered?'), answer: t('pages.faq.a9', 'Perundhu covers all major cities and towns across Tamil Nadu, including Chennai, Coimbatore, Madurai, Trichy, Salem, and over 200 other locations. We are continuously expanding our coverage.') },
    { question: t('pages.faq.q10', 'How often is the schedule data updated?'), answer: t('pages.faq.a10', 'Official government bus schedules are updated monthly. User contributions are reviewed and added within 24-48 hours. Real-time tracking data is updated every 30 seconds when active.') },
    { question: t('pages.faq.q11', 'Can I save my favorite routes?'), answer: t('pages.faq.a11', 'Yes! Click the bookmark icon on any bus card to save it to your favorites. Access your saved routes quickly from the main menu.') },
    { question: t('pages.faq.q12', 'What types of buses are included?'), answer: t('pages.faq.a12', 'We include all government buses (TNSTC, MTC) and major private operators. This covers regular, express, deluxe, ultra-deluxe, AC, and non-AC services.') },
    { question: t('pages.faq.q13', 'How do I find buses with specific amenities?'), answer: t('pages.faq.a13', 'Use the filter options on the search results page to filter by bus type (AC/Non-AC), operator, and departure time. More advanced filters are coming soon.') },
    { question: t('pages.faq.q14', 'Can I book tickets through the app?'), answer: t('pages.faq.a14', 'Currently, we provide schedule information only. For bookings, you will be directed to official government portals like TNSTC online booking or contact numbers for specific operators.') },
    { question: t('pages.faq.q15', 'What if my bus route is not listed?'), answer: t('pages.faq.a15', 'You can contribute missing routes through the "Contribute" feature. Provide as much detail as possible including bus number, stops, and timings. Our team will verify and add it to the database.') },
    { question: t('pages.faq.q16', 'How accurate is the real-time tracking?'), answer: t('pages.faq.a16', 'Tracking accuracy depends on the number of active users on the bus. With 3+ active trackers, location accuracy is typically within 50-100 meters. GPS signal strength and network coverage also affect accuracy.') },
    { question: t('pages.faq.q17', 'Does tracking drain my phone battery?'), answer: t('pages.faq.a17', 'Our tracking feature is optimized for minimal battery usage. It typically uses less than 5% battery per hour when active. You can stop tracking anytime to conserve battery.') },
    { question: t('pages.faq.q18', 'How do I contact customer support?'), answer: t('pages.faq.a18', 'Visit the Contact Us page or email us at perundhutn@gmail.com. We respond to all queries within 24-48 hours during business hours (Mon-Fri, 9 AM - 6 PM IST).') },
    { question: t('pages.faq.q19', 'Is my location data private?'), answer: t('pages.faq.a19', 'Yes. When you enable tracking, only anonymized location data is shared. We do not collect personal information or track you outside of active tracking sessions. See our Privacy Policy for complete details.') },
    { question: t('pages.faq.q20', 'Can I suggest new features?'), answer: t('pages.faq.a20', 'Absolutely! We love hearing from users. Submit your suggestions through the feedback form on the Contact Us page. Popular feature requests are prioritized in our development roadmap.') },
  ];

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.slice(0, 10).map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };

  return (
    <div className="static-page">
      <Helmet>
        <title>FAQ - Tamil Nadu Bus Timings &amp; Routes | Perundhu</title>
        <meta name="description" content="Frequently asked questions about Perundhu bus route finder. Find TNSTC, MTC and SETC bus timings across Tamil Nadu. Chennai, Coimbatore, Madurai and 200+ cities covered." />
        <link rel="canonical" href="https://www.perundhu.com/faq" />
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>
      <div className="static-page-container">
        <h1>{t('pages.faq.title', 'Frequently Asked Questions')}</h1>

        <div className="faq-list">
          {faqs.map((faq) => (
            <details key={faq.question} className="faq-item">
              <summary className="faq-question">{faq.question}</summary>
              <p className="faq-answer">{faq.answer}</p>
            </details>
          ))}
        </div>

        <section className="content-section">
          <h2>{t('pages.faq.moreHelpTitle', 'Need More Help?')}</h2>
          <p>
            {t('pages.faq.moreHelpText', 'If you could not find the answer to your question, please')}{' '}
            <Link to="/contact">{t('pages.faq.contactLink', 'contact us')}</Link>.
          </p>
        </section>

        <div className="back-link">
          <Link to="/">← {t('common.backToHome', 'Back to Home')}</Link>
        </div>
      </div>
    </div>
  );
};

export default FaqPage;
