/* Illustrative starting numbers for the example companies. They are placeholders to be replaced with a client's own figures, not data about any real company. */
window.TD = {
  hotels: {
    label: 'Hotels', co: 'A hypothetical mid-size hotel chain in India', cur: { sym: '₹', big: 'crore', scale: 1e7 },
    budget: {
      what: 'next year’s marketing budget, which is the money spent to win bookings',
      routes: ['Direct booking campaigns', 'Online travel agent promotions', 'Corporate and group sales'],
      defs: ['Search ads, email and offers that bring guests to your own website', 'Commission and promoted listings on booking sites', 'Sales team time, events and corporate rate deals'],
      plan: [20, 60, 20], evidence: 'your booking and spend history for each channel',
      rng: [[200, 320, 480], [0.3, 0.38, 0.46], [0.4, 0.55, 0.7], [380, 520, 700], [0.14, 0.2, 0.26], [0.5, 0.65, 0.78], [150, 250, 400], [0.24, 0.3, 0.38], [0.4, 0.58, 0.72]]
    },
    respond: {
      unit: 'room night', per: 'per night', ref: 'Our average room rate', P0: 7500, c: 2000, V: 240000, volLabel: 'Room nights sold in a year', leak: 0.5,
      manual: { who: 'A rival hotel in your market', before: 7200, after: 6500, label: 'The rival’s average room rate' },
      segs: [
        { n: 'Business travellers on corporate rates', share: 0.30, ov: 'H', sens: 'M' },
        { n: 'Leisure guests booking direct', share: 0.25, ov: 'M', sens: 'H' },
        { n: 'Guests booked through online travel agents', share: 0.30, ov: 'H', sens: 'H' },
        { n: 'Groups and events', share: 0.15, ov: 'L', sens: 'L' }
      ],
      watch: [
        ['Whether the lower rate is for all dates or only slow periods', 'The rival’s own booking page and rate-comparison sites, weekly'],
        ['Our bookings and rates in the exposed segments', 'Your own booking data, daily for the next two weeks'],
        ['Whether other nearby hotels follow', 'Rate-comparison sites and your sales team’s notes']
      ],
      evidence: 'past rate changes and what happened to bookings'
    }
  },
  pharma: {
    label: 'Pharma', co: 'A hypothetical specialty-pharma company', cur: { sym: '₹', big: 'crore', scale: 1e7 },
    budget: {
      what: 'next year’s marketing budget, which is the money spent to win prescriptions',
      routes: ['Field force', 'Digital outreach', 'Medical education'],
      defs: ['Sales representative visits and samples', 'Email, doctor portals and online ads', 'Conferences and speaker programmes'],
      plan: [60, 10, 30], evidence: 'territory sales against call and event history',
      rng: [[300, 420, 560], [0.2, 0.28, 0.35], [0.5, 0.62, 0.75], [150, 300, 520], [0.15, 0.24, 0.32], [0.55, 0.72, 0.88], [200, 260, 340], [0.3, 0.38, 0.45], [0.35, 0.5, 0.65]]
    },
    respond: {
      unit: 'pack', per: 'per pack', ref: 'Our price per pack', P0: 420, c: 110, V: 4000000, volLabel: 'Packs sold in a year', leak: 0.3,
      manual: { who: 'A rival with a lower-priced alternative', before: 400, after: 340, label: 'The rival’s price per pack' },
      segs: [
        { n: 'Public tenders', share: 0.35, ov: 'H', sens: 'H' },
        { n: 'Private hospitals', share: 0.30, ov: 'M', sens: 'M' },
        { n: 'Retail pharmacies', share: 0.25, ov: 'M', sens: 'H' },
        { n: 'Insurers and payers', share: 0.10, ov: 'L', sens: 'M' }
      ],
      watch: [
        ['Whether the rival’s price is a launch offer or permanent', 'Tender notices and price lists, monthly'],
        ['Prescriptions and tender wins in the exposed segments', 'Your own sales and tender data'],
        ['Other alternatives entering the market', 'Regulator approval lists']
      ],
      evidence: 'past price changes and what happened to prescriptions'
    }
  },
  telecom: {
    label: 'Telecom', co: 'A hypothetical mid-size US mobile operator', cur: { sym: '$', big: 'million', scale: 1e6 },
    budget: {
      what: 'next year’s marketing budget, which is the money spent to win new subscribers',
      routes: ['Retail and dealers', 'Digital', 'Partner bundles'],
      defs: ['Dealer commissions and in-store promotions', 'Online ads, the app and your own website', 'Promotions with partners such as streaming services and device makers'],
      plan: [70, 20, 10], evidence: 'activations by channel against commission and campaign spend',
      rng: [[420, 560, 720], [0.12, 0.16, 0.2], [0.45, 0.58, 0.7], [150, 260, 420], [0.24, 0.32, 0.4], [0.4, 0.55, 0.7], [200, 340, 560], [0.08, 0.14, 0.22], [0.5, 0.68, 0.85]]
    },
    respond: {
      unit: 'line', per: 'per line per month', ref: 'Our Unlimited Plus plan, 4 lines, per line per month', P0: 40, c: 22, V: 7200000, volLabel: 'Line-months sold in a year (600,000 lines)', leak: 0.5, offers: true,
      segs: [
        { n: 'Multi-line families (3 to 5 lines)', share: 0.34, ov: 'H', sens: 'H' },
        { n: 'Couples and two-line households', share: 0.22, ov: 'H', sens: 'H' },
        { n: 'Single-line individuals', share: 0.28, ov: 'M', sens: 'M' },
        { n: 'Value-focused and senior accounts', share: 0.07, ov: 'M', sens: 'H' },
        { n: 'Small business', share: 0.09, ov: 'L', sens: 'L' }
      ],
      watch: [
        ['Whether the rival extends or ends the offer', 'The rival’s plans page, weekly'],
        ['Our customers leaving in the exposed segments', 'Your own number-transfer-out data, weekly'],
        ['Whether the other national carriers follow', 'Their plan pages, weekly']
      ],
      evidence: 'past tariff changes and what happened to subscribers'
    }
  },
  saas: {
    label: 'B2B software', co: 'A hypothetical team-collaboration software company', cur: { sym: '$', big: 'million', scale: 1e6 },
    budget: {
      what: 'next year’s marketing budget, which is the money spent to win new customers',
      routes: ['Paid search and ads', 'Content and events', 'Partner and reseller programmes'],
      defs: ['Search and social advertising that drives sign-ups', 'Guides, webinars and conferences', 'Referral fees and reseller margins'],
      plan: [50, 30, 20], evidence: 'sign-ups and paid conversions by channel against spend',
      rng: [[300, 440, 600], [0.18, 0.24, 0.3], [0.45, 0.6, 0.72], [120, 220, 380], [0.3, 0.38, 0.46], [0.5, 0.68, 0.82], [180, 300, 480], [0.14, 0.2, 0.26], [0.4, 0.55, 0.7]]
    },
    respond: {
      unit: 'seat', per: 'per seat per month', ref: 'Our Team plan, billed monthly, per seat per month', P0: 10, c: 3, V: 480000, volLabel: 'Seat-months sold in a year (40,000 seats)', leak: 0.5, offers: true,
      segs: [
        { n: 'Small teams (under 20 seats)', share: 0.40, ov: 'H', sens: 'H' },
        { n: 'Mid-size teams (20 to 200 seats)', share: 0.30, ov: 'M', sens: 'M' },
        { n: 'Agencies and freelancers', share: 0.20, ov: 'M', sens: 'L' },
        { n: 'Enterprise accounts', share: 0.10, ov: 'L', sens: 'L' }
      ],
      watch: [
        ['Whether the rival’s promotion ends after the introductory period', 'The rival’s pricing page, weekly'],
        ['Our trial-to-paid conversion and cancellations in the exposed segments', 'Your own product data, weekly'],
        ['Whether other rivals add similar promotions', 'Their pricing pages, monthly']
      ],
      evidence: 'past price changes and what happened to sign-ups and cancellations'
    }
  }
};
