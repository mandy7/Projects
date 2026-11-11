/* Illustrative starting numbers for four example settings: telecom, B2B software, travel and streaming.
   They are placeholders to be replaced with a client's own figures, not data about any real company.
   Each setting has four decisions: respond (a rival's price move), journey (website features from discovery to checkout),
   customers (the example customer file and what each group values) and budget (spend across three channels).
   All money is in US dollars. */
window.TD = {
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
    },
    journey: {
      site: 'plan-buying website', steps: 'Steps from plan to confirmation',
      stages: [
        { k: 'disc', n: 'Discovery', sub: 'Finding and comparing plans', f: [
          { id: 'finder', l: 'Plan finder that asks about your needs', y: 1, a: 1, b: 1, eff: 'M', imp: 'M' },
          { id: 'filter', l: 'Filter plans by price and number of lines', y: 1, a: 1, b: 1, eff: 'L', imp: 'M' },
          { id: 'compare', l: 'Compare plans side by side', y: 0, a: 1, b: 1, eff: 'M', imp: 'H' },
          { id: 'deals', l: 'Current deals shown on the first page', y: 1, a: 1, b: 0, eff: 'L', imp: 'M' }
        ] },
        { k: 'dec', n: 'Decision support', sub: 'Price clarity, trust and policy', f: [
          { id: 'fullprice', l: 'Full monthly price with taxes and fees on the plan page', y: 0, a: 1, b: 0, eff: 'L', imp: 'H' },
          { id: 'promoterms', l: 'Promotional price terms: how long, and what you must do', y: 1, a: 1, b: 1, eff: 'L', imp: 'H' },
          { id: 'coverage', l: 'Coverage map by address', y: 1, a: 1, b: 1, eff: 'H', imp: 'H' },
          { id: 'tradein', l: 'Trade-in value estimate for your old phone', y: 0, a: 1, b: 1, eff: 'M', imp: 'M' }
        ] },
        { k: 'chk', n: 'Checkout', sub: 'Buying without friction', f: [
          { id: 'guest', l: 'Checkout without creating an account', y: 1, a: 1, b: 1, eff: 'M', imp: 'M' },
          { id: 'port', l: 'Keep your number: transfer it during checkout', y: 1, a: 1, b: 0, eff: 'M', imp: 'M' },
          { id: 'express', l: 'Express payment options', y: 0, a: 1, b: 0, eff: 'M', imp: 'H' },
          { id: 'nsteps', l: 'Steps from plan to confirmation', num: true, y: 6, a: 4, b: 5, eff: 'M', imp: 'M' }
        ] }
      ]
    },
    customers: {
      unit: 'accounts', file: '2,000 mobile accounts, one row each', rival: 'AT&T and T-Mobile',
      cols: [
        { k: 'lines', l: 'Lines on the account', u: 'lines' }, { k: 'bill', l: 'Monthly bill', u: '$' }, { k: 'data', l: 'Data used a month', u: 'GB' },
        { k: 'tenure', l: 'Years as a customer', u: 'years' }, { k: 'abroad', l: 'Uses international calling or roaming', bin: true }
      ],
      pick: ['lines', 'bill', 'data', 'tenure'],
      needs: [['multi', 'Savings on several lines'], ['budget', 'The lowest price'], ['data', 'More data and speed'], ['loyal', 'Rewards for staying'], ['biz', 'Business tools and support']],
      arch: [
        { n: 'Families on multi-line plans', share: 0.30, need: 'multi', mu: [4, 160, 80, 5, 0.15], sd: [0.8, 30, 20, 2.5, 0] },
        { n: 'Single-line light users', share: 0.25, need: 'budget', mu: [1, 35, 6, 3, 0.05], sd: [0.1, 8, 3, 2, 0] },
        { n: 'Heavy-data younger users', share: 0.22, need: 'data', mu: [1.3, 75, 55, 2, 0.3], sd: [0.5, 15, 20, 1.2, 0] },
        { n: 'Long-standing older customers', share: 0.13, need: 'loyal', mu: [2, 85, 10, 12, 0.1], sd: [0.6, 20, 5, 4, 0] },
        { n: 'Small businesses', share: 0.10, need: 'biz', mu: [6, 280, 120, 4, 0.45], sd: [3, 80, 40, 2, 0] }
      ]
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
    },
    journey: {
      site: 'website', steps: 'Steps from plan to purchase',
      stages: [
        { k: 'disc', n: 'Discovery', sub: 'Finding the right plan', f: [
          { id: 'pricelink', l: 'Pricing page reachable from the home page', y: 1, a: 1, b: 1, eff: 'L', imp: 'M' },
          { id: 'table', l: 'Plan comparison table', y: 1, a: 1, b: 1, eff: 'L', imp: 'M' },
          { id: 'roles', l: 'Pages for each use case or team type', y: 0, a: 1, b: 1, eff: 'M', imp: 'M' },
          { id: 'trial', l: 'Free trial or free plan', y: 1, a: 1, b: 0, eff: 'M', imp: 'H' }
        ] },
        { k: 'dec', n: 'Decision support', sub: 'Proof, price clarity and security', f: [
          { id: 'openprice', l: 'Prices shown without contacting sales', y: 1, a: 1, b: 1, eff: 'L', imp: 'H' },
          { id: 'cases', l: 'Customer stories by industry', y: 0, a: 1, b: 1, eff: 'M', imp: 'M' },
          { id: 'security', l: 'Security and compliance information page', y: 1, a: 1, b: 1, eff: 'M', imp: 'H' },
          { id: 'demo', l: 'Live chat or demo booking', y: 0, a: 0, b: 1, eff: 'M', imp: 'M' }
        ] },
        { k: 'chk', n: 'Checkout', sub: 'Buying without friction', f: [
          { id: 'self', l: 'Self-serve purchase for the starter plan', y: 1, a: 1, b: 1, eff: 'M', imp: 'H' },
          { id: 'invoice', l: 'Invoice or purchase-order option', y: 0, a: 1, b: 0, eff: 'M', imp: 'M' },
          { id: 'seats', l: 'Add team seats during purchase', y: 1, a: 1, b: 1, eff: 'L', imp: 'M' },
          { id: 'nsteps', l: 'Steps from plan to purchase', num: true, y: 5, a: 3, b: 4, eff: 'M', imp: 'M' }
        ] }
      ]
    },
    customers: {
      unit: 'accounts', file: '2,000 customer accounts, one row each', rival: 'Slack and Asana',
      cols: [
        { k: 'seats', l: 'Seats on the account', u: 'seats' }, { k: 'spend', l: 'Monthly spend', u: '$' }, { k: 'logins', l: 'Logins per seat a week', u: 'logins' },
        { k: 'tenure', l: 'Months as a customer', u: 'months' }, { k: 'tools', l: 'Connected tools', u: 'tools' }
      ],
      pick: ['seats', 'spend', 'logins', 'tools'],
      needs: [['starter', 'A low entry price'], ['team', 'Team features and admin controls'], ['scale', 'Security and scale'], ['integr', 'Connections to other tools']],
      arch: [
        { n: 'Small teams', share: 0.38, need: 'starter', mu: [8, 90, 6, 10, 2], sd: [3, 30, 2, 6, 1] },
        { n: 'Growing teams', share: 0.30, need: 'team', mu: [45, 520, 9, 18, 5], sd: [15, 160, 2, 8, 2] },
        { n: 'Large organisations', share: 0.12, need: 'scale', mu: [400, 6200, 7, 30, 9], sd: [150, 2000, 2, 12, 3] },
        { n: 'Tool-heavy power users', share: 0.20, need: 'integr', mu: [20, 380, 16, 24, 14], sd: [8, 120, 3, 9, 3] }
      ]
    }
  },
  travel: {
    label: 'Travel', co: 'A hypothetical mid-size hotel chain', cur: { sym: '$', big: 'million', scale: 1e6 },
    budget: {
      what: 'next year’s marketing budget, which is the money spent to win bookings',
      routes: ['Direct booking campaigns', 'Online travel agent promotions', 'Corporate and group sales'],
      defs: ['Search ads, email and offers that bring guests to your own website', 'Commission and promoted listings on booking sites', 'Sales team time, events and corporate rate deals'],
      plan: [20, 60, 20], evidence: 'your booking and spend history for each channel',
      rng: [[200, 320, 480], [0.3, 0.38, 0.46], [0.4, 0.55, 0.7], [380, 520, 700], [0.14, 0.2, 0.26], [0.5, 0.65, 0.78], [150, 250, 400], [0.24, 0.3, 0.38], [0.4, 0.58, 0.72]]
    },
    respond: {
      unit: 'room night', per: 'per night', ref: 'Our average room rate', P0: 180, c: 55, V: 240000, volLabel: 'Room nights sold in a year', leak: 0.5, offers: true,
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
    },
    journey: {
      site: 'booking website', steps: 'Steps from room to confirmation',
      stages: [
        { k: 'disc', n: 'Discovery', sub: 'Search, filters, sorting, personalisation', f: [
          { id: 'search', l: 'Search by place and dates', y: 1, a: 1, b: 1, eff: 'L', imp: 'H' },
          { id: 'filters', l: 'Filters beyond price', y: 1, a: 1, b: 1, eff: 'L', imp: 'M' },
          { id: 'sort', l: 'Sort by rating and distance', y: 1, a: 1, b: 0, eff: 'L', imp: 'M' },
          { id: 'map', l: 'Map view of results', y: 0, a: 1, b: 1, eff: 'H', imp: 'M' },
          { id: 'recs', l: 'Personalised recommendations', y: 0, a: 1, b: 1, eff: 'H', imp: 'M' }
        ] },
        { k: 'dec', n: 'Decision support', sub: 'Reviews, trust cues, price and policy clarity', f: [
          { id: 'reviews', l: 'Guest reviews on the room page', y: 1, a: 0, b: 1, eff: 'M', imp: 'M' },
          { id: 'cancel', l: 'Cancellation terms shown before payment', y: 1, a: 1, b: 0, eff: 'L', imp: 'H' },
          { id: 'fullprice', l: 'Full price with taxes and fees shown early', y: 0, a: 1, b: 0, eff: 'L', imp: 'H' },
          { id: 'trust', l: 'Trust cues, such as a best-price promise', y: 1, a: 1, b: 1, eff: 'L', imp: 'M' }
        ] },
        { k: 'chk', n: 'Checkout', sub: 'Guest checkout, payment options, number of steps', f: [
          { id: 'guest', l: 'Guest checkout', y: 1, a: 1, b: 1, eff: 'M', imp: 'M' },
          { id: 'express', l: 'Express payment options', y: 0, a: 1, b: 0, eff: 'M', imp: 'H' },
          { id: 'saved', l: 'Saved details for returning guests', y: 1, a: 1, b: 1, eff: 'M', imp: 'M' },
          { id: 'nsteps', l: 'Steps from room to confirmation', num: true, y: 5, a: 3, b: 4, eff: 'M', imp: 'M' }
        ] }
      ]
    },
    customers: {
      unit: 'bookings', file: '2,000 hotel bookings, one row each', rival: 'Hilton and Marriott',
      cols: [
        { k: 'party', l: 'Party size', u: 'people' }, { k: 'lead', l: 'How far ahead they book', u: 'days' }, { k: 'nights', l: 'Nights stayed', u: 'nights' },
        { k: 'rate', l: 'Spend per night', u: '$' }, { k: 'repeat', l: 'Repeat guest', bin: true }, { k: 'weekend', l: 'Weekend stay', bin: true }
      ],
      pick: ['party', 'lead', 'nights', 'rate'],
      needs: [['family', 'Value for the whole family'], ['advance', 'Savings for booking ahead'], ['longer', 'Savings for longer stays'], ['senior', 'Senior and member discounts'], ['loyal', 'Points and member perks'], ['flex', 'Flexibility and convenience']],
      arch: [
        { n: 'Solo business travellers', share: 0.34, need: 'flex', mu: [1, 5, 2, 190, 0.55, 0.05], sd: [0.15, 3, 1, 40, 0, 0] },
        { n: 'Couples on short breaks', share: 0.28, need: 'advance', mu: [2, 30, 2.3, 160, 0.25, 0.85], sd: [0.2, 12, 0.7, 35, 0, 0] },
        { n: 'Families on holiday', share: 0.22, need: 'family', mu: [4, 75, 6, 95, 0.3, 0.4], sd: [0.8, 25, 2, 22, 0, 0] },
        { n: 'Older travellers', share: 0.16, need: 'senior', mu: [2, 55, 5, 140, 0.6, 0.2], sd: [0.3, 20, 2, 30, 0, 0] }
      ]
    }
  },
  streaming: {
    label: 'Streaming', co: 'A hypothetical mid-size video streaming service', cur: { sym: '$', big: 'million', scale: 1e6 },
    budget: {
      what: 'next year’s marketing budget, which is the money spent to win new subscribers',
      routes: ['Social and video ads', 'Bundles and partner promotions', 'Trailers and creator partnerships'],
      defs: ['Ads on social and video platforms that drive sign-ups', 'Offers with phone, broadband and device partners', 'Trailers, launch events and creator deals'],
      plan: [60, 30, 10], evidence: 'sign-ups and retention by channel against spend',
      rng: [[300, 440, 600], [0.18, 0.24, 0.3], [0.45, 0.6, 0.72], [150, 260, 420], [0.2, 0.3, 0.4], [0.5, 0.68, 0.82], [100, 200, 340], [0.2, 0.3, 0.4], [0.4, 0.58, 0.72]]
    },
    respond: {
      unit: 'subscriber', per: 'per month', ref: 'Our Standard plan, per subscriber per month', P0: 15.99, c: 8, V: 12000000, volLabel: 'Subscriber-months sold in a year (1 million subscribers)', leak: 0.5, offers: true,
      segs: [
        { n: 'Families sharing one account', share: 0.30, ov: 'H', sens: 'M' },
        { n: 'Young adults', share: 0.25, ov: 'H', sens: 'H' },
        { n: 'Sports and live-event fans', share: 0.20, ov: 'M', sens: 'M' },
        { n: 'Budget-conscious viewers', share: 0.25, ov: 'H', sens: 'H' }
      ],
      watch: [
        ['Whether the rival’s price or offer is for new subscribers only', 'The rival’s plan page, weekly'],
        ['Our cancellations in the exposed segments', 'Your own subscriber data, weekly'],
        ['Whether other services follow with similar bundles', 'Their plan pages, monthly']
      ],
      evidence: 'past price changes and what happened to sign-ups and cancellations'
    },
    journey: {
      site: 'sign-up website', steps: 'Steps from plan to watching',
      stages: [
        { k: 'disc', n: 'Discovery', sub: 'Seeing what is on offer', f: [
          { id: 'browse', l: 'Browse the catalogue without an account', y: 0, a: 1, b: 0, eff: 'M', imp: 'M' },
          { id: 'genre', l: 'Filter by genre or mood', y: 1, a: 1, b: 1, eff: 'L', imp: 'M' },
          { id: 'recs', l: 'Personalised picks on the first visit', y: 0, a: 1, b: 1, eff: 'H', imp: 'M' },
          { id: 'trailers', l: 'Trailers on the sign-up page', y: 1, a: 1, b: 1, eff: 'L', imp: 'M' }
        ] },
        { k: 'dec', n: 'Decision support', sub: 'Price, ads and terms made clear', f: [
          { id: 'plans', l: 'All plan prices and ad terms on one page', y: 1, a: 1, b: 1, eff: 'L', imp: 'H' },
          { id: 'cancel', l: 'Cancellation terms shown before payment', y: 0, a: 1, b: 1, eff: 'L', imp: 'H' },
          { id: 'trial', l: 'Free trial or first-month offer', y: 1, a: 0, b: 1, eff: 'M', imp: 'H' },
          { id: 'bundle', l: 'Bundle options shown', y: 0, a: 0, b: 1, eff: 'H', imp: 'M' }
        ] },
        { k: 'chk', n: 'Checkout', sub: 'Starting to watch', f: [
          { id: 'wallet', l: 'Pay with a digital wallet', y: 0, a: 1, b: 1, eff: 'M', imp: 'H' },
          { id: 'partner', l: 'Pay through a phone, TV or broadband provider', y: 0, a: 0, b: 1, eff: 'H', imp: 'M' },
          { id: 'canceline', l: 'Cancel online without calling', y: 1, a: 1, b: 1, eff: 'L', imp: 'M' },
          { id: 'nsteps', l: 'Steps from plan to watching', num: true, y: 5, a: 3, b: 4, eff: 'M', imp: 'M' }
        ] }
      ]
    },
    customers: {
      unit: 'subscribers', file: '2,000 subscribers, one row each', rival: 'Netflix and Disney+',
      cols: [
        { k: 'house', l: 'People in the household', u: 'people' }, { k: 'hours', l: 'Hours watched a week', u: 'hours' }, { k: 'tenure', l: 'Months as a subscriber', u: 'months' },
        { k: 'paid', l: 'Price paid a month', u: '$' }, { k: 'sports', l: 'Share of viewing that is live sports', u: '%' }
      ],
      pick: ['house', 'hours', 'tenure', 'paid', 'sports'],
      needs: [['family', 'Kids and family viewing'], ['price', 'The lowest price'], ['sports', 'Live sports'], ['bundle', 'Bundles with other services'], ['binge', 'New releases and binge-watching']],
      arch: [
        { n: 'Families', share: 0.30, need: 'family', mu: [4, 16, 30, 17.99, 8], sd: [0.8, 4, 12, 1.5, 4] },
        { n: 'Budget-conscious viewers', share: 0.25, need: 'price', mu: [1.5, 8, 14, 8.99, 5], sd: [0.5, 3, 8, 0.8, 3] },
        { n: 'Sports fans', share: 0.20, need: 'sports', mu: [2.3, 12, 22, 15.99, 55], sd: [0.8, 4, 10, 2, 12] },
        { n: 'Binge watchers', share: 0.25, need: 'binge', mu: [1.2, 24, 18, 15.99, 3], sd: [0.4, 5, 9, 2, 2] }
      ]
    }
  }
};
