/* Real offers captured from rivals' public pages on 9 and 10 Nov 2026, using a browser session that reads the page as a visitor in the United States would see it.
   Prices are as shown on the page that day. Nothing here is fetched live by the site. "list" is the price shown before the offer, where the page shows one.
   "eff" is the price in the first 12 months, worked out from the page. "pct" is an "up to" percentage off, applied to a rival rate level with yours because the page shows no rate.
   "like" says whether the offer is a like-for-like match for the example company's plan. "need" is the customer need we matched the offer to, from its wording. */
window.OF = {
  telecom: {
    captured: '2026-11-09',
    ref: 'Our Unlimited Plus plan, 4 lines',
    rivals: [
      { id: 'att', name: 'AT&T', url: 'https://www.att.com/plans/wireless/', page: 'Wireless plans',
        offers: [
          { id: 'att-extra', need: 'multi', plan: 'Extra 2.0, 4 lines', list: 50, eff: 35, cond: 'Per line per month when you get 4 lines. The page marks it "Most popular".', quote: 'Was $50.00 per month. Now $35.00 per month per line when you get 4 lines', like: true },
          { id: 'att-value', need: 'budget', plan: 'Value 2.0, 4 lines', list: 40, eff: 25, cond: 'Per line per month when you get 4 lines. The page marks it "Most affordable".', quote: 'Was $40.00 per month. Now $25.00 per month per line when you get 4 lines', like: false, note: 'A lower tier than the example plan.' },
          { id: 'att-premium', need: 'data', plan: 'Premium 2.0, 4 lines', list: 60, eff: 45, cond: 'Per line per month when you get 4 lines.', quote: 'Was $60.00 per month. Now $45.00 per month per line when you get 4 lines', like: false, note: 'A higher tier than the example plan.' }
        ] },
      { id: 'tmobile', name: 'T-Mobile', url: 'https://www.t-mobile.com/cell-phone-plans', page: 'Cell phone plans',
        offers: [
          { id: 'tmo-standard', need: 'multi', plan: 'T-Mix Standard, 4 lines', list: 33.33, eff: 25, cond: 'The page offers 4 phone lines for $25 per line when you transfer your number, with AutoPay. List is the 3-line price of $100 a month, divided by 3.', quote: '4 phone lines for $25 per line when you transfer your number.', like: false, note: 'A lower tier than the example plan.' },
          { id: 'tmo-more', need: 'multi', plan: 'T-Mix More, 3 lines', list: 61.67, eff: 51.67, cond: 'The page shows $155 a month for 3 lines with AutoPay ($185 without). Divided by 3 lines.', quote: '$155/mo. for 3 phone lines + taxes and fees. With AutoPay discount', like: true }
        ] }
    ]
  },
  saas: {
    captured: '2026-11-09',
    ref: 'Our Team plan, billed monthly',
    rivals: [
      { id: 'slack', name: 'Slack', url: 'https://slack.com/pricing', page: 'Pricing',
        offers: [
          { id: 'slack-pro', need: 'starter', plan: 'Pro, billed monthly', list: 8.75, eff: 7.66, cond: '50% off for 3 months: $4.38 for 3 months, then $8.75. Per user per month. Effective first-year price worked out from the page.', quote: '50% OFF FOR 3 MONTHS* $8.75 $4.38 USD per user / month, when paying monthly', like: true },
          { id: 'slack-biz', need: 'scale', plan: 'Business+, billed monthly', list: 18, eff: 15.75, cond: '50% off for 3 months: $9 for 3 months, then $18. Per user per month. Effective first-year price worked out from the page.', quote: '50% OFF FOR 3 MONTHS* $18 $9 USD per user / month, when paying monthly', like: false, note: 'A higher tier than the example plan.' }
        ] },
      { id: 'asana', name: 'Asana', url: 'https://asana.com/pricing', page: 'Pricing',
        offers: [
          { id: 'asana-starter', need: 'starter', plan: 'Starter, billed annually', list: 10.99, eff: 10.99, cond: 'Per user per month, billed annually. No offer shown.', quote: '$10.99 Per user, per month billed annually', like: true },
          { id: 'asana-adv', need: 'team', plan: 'Advanced, billed annually', list: 24.99, eff: 24.99, cond: 'Per user per month, billed annually. No offer shown.', quote: '$24.99 Per user, per month billed annually', like: false, note: 'A higher tier than the example plan.' }
        ] }
    ]
  },
  travel: {
    captured: '2026-11-10',
    ref: 'Our average room rate',
    rivals: [
      { id: 'hilton', name: 'Hilton', url: 'https://www.hilton.com/en/offers/', page: 'Special offers',
        offers: [
          { id: 'hil-adv', need: 'advance', plan: 'Honors Discount Advance Purchase', pct: 17, cond: 'Up to 17% off the Best Available Rate when you book in advance. For Honors members.', quote: 'Save up to 17% off our Best Available Rate* by booking in advance. It pays to plan ahead!', like: true },
          { id: 'hil-early', need: 'advance', plan: 'Book Early and Save, resorts', pct: 30, cond: 'Up to 30% off at resorts in Europe, the Middle East, Africa and Asia Pacific.', quote: 'Book your resort escape now and save up to 30% in top destinations across Europe, the Middle East, Africa, and Asia Pacific.', like: false, note: 'Resorts outside the United States, so a different kind of stay from the example hotel chain.' },
          { id: 'hil-longer', need: 'longer', plan: 'Stay Longer & Save', pct: 10, cond: '10% off with a stay of 3 nights, at participating hotels in the United States.', quote: 'Save 10% when you book the Stay Longer & Save package at participating hotels across the United States.', like: true },
          { id: 'hil-paradise', need: 'longer', plan: 'Stay Longer in Paradise', pct: 20, cond: 'Up to 20% off with a stay of 3 nights, at select hotels in the Caribbean, Latin America, Hawaii and French Polynesia.', quote: 'Save up to 20% when you book the Stay Longer in Paradise package at select hotels across the Caribbean, Latin America, Hawaii, and French Polynesia.', like: false, note: 'Island resorts, so a different kind of stay from the example hotel chain.' },
          { id: 'hil-senior', need: 'senior', plan: 'Senior Rate', pct: 6, cond: 'Up to 6% off the Best Available Rate for seniors and their families travelling together.', quote: 'Seniors and their families can save up to 6% off our Best Available Rate* when traveling together.', like: true },
          { id: 'hil-aaa', need: 'senior', plan: 'AAA/CAA Members Save', pct: 10, cond: 'Up to 10% off for AAA and CAA members.', quote: 'AAA/CAA Members, Save up to 10%', like: true },
          { id: 'hil-mil', need: 'family', plan: 'Military Family Rate', cond: 'Exclusive savings for active and retired military, veterans and their families. The page gives no percentage.', quote: 'Active and retired military, veterans, and their families enjoy exclusive savings at participating hotels.', like: true },
          { id: 'hil-bf', need: 'family', plan: 'Breakfast Included', cond: 'Breakfast for every registered guest, each night. Listed under Kids and family. No price shown.', quote: 'Fuel your day with breakfast included for every registered guest, each night of your stay.', like: true },
          { id: 'hil-park', need: 'flex', plan: 'Park & Stay', cond: 'Daily parking each night of the stay. No price shown.', quote: 'Get daily parking each night of your stay with our Park & Stay offer.', like: true },
          { id: 'hil-exp', need: 'loyal', plan: 'Experience the Stay', cond: 'A package with an on-property credit and extra perks such as premium WiFi and early check-in. No price shown.', quote: 'Book our Experience the Stay package and indulge with an on-property credit and additional perks, like premium WiFi and early check-in.', like: true },
          { id: 'hil-2x', need: 'loyal', plan: '2X Points', cond: 'Double Hilton Honors points for each night. For Honors members.', quote: 'Earn double Hilton Honors Points for each night of your stay.', like: true }
        ] },
      { id: 'marriott', name: 'Marriott', url: 'https://www.marriott.com/offers.mi', page: 'Hotel deals',
        offers: [
          { id: 'mar-member', need: 'loyal', plan: 'Member Exclusive Rate: 10% Off Your Stay', pct: 10, cond: '10% off at multiple locations. For Marriott Bonvoy members.', quote: 'Member Exclusive Rate: 10% Off Your Stay', like: true },
          { id: 'mar-longer', need: 'longer', plan: 'Stay Longer, Save up to 20%', pct: 20, cond: 'Up to 20% off for longer stays, at multiple locations. The page does not say how many nights.', quote: 'Stay Longer, Save up to 20%', like: true },
          { id: 'mar-5', need: 'longer', plan: 'Save on 5+ Nights', cond: 'A deal for stays of five nights or more, at multiple locations. The page gives no percentage.', quote: 'Save on 5+ Nights', like: true },
          { id: 'mar-ahead', need: 'advance', plan: 'Planning Ahead Pays Off', cond: 'A deal for booking ahead, at multiple locations. The page gives no percentage.', quote: 'Planning Ahead Pays Off', like: true },
          { id: 'mar-second', need: 'family', plan: '50% Off Your Second Room', cond: '50% off a second room, at multiple locations. Useful for families and groups travelling together.', quote: 'Enjoy 50% Off Your Second Room', like: true },
          { id: 'mar-bf', plan: 'Enjoy Breakfast at Courtyard', cond: 'Breakfast included, at Courtyard hotels. No price shown.', quote: 'Enjoy Breakfast at Courtyard', like: true }
        ] }
    ]
  },
  streaming: {
    captured: '2026-11-10',
    ref: 'Our Standard plan, per month',
    rivals: [
      { id: 'netflix', name: 'Netflix', url: 'https://help.netflix.com/en/node/24926', page: 'Plans and pricing',
        offers: [
          { id: 'nf-ads', need: 'price', plan: 'Standard with ads', list: null, eff: 8.99, cond: 'Per month. Ad-supported, 2 devices at a time, 1080p. The page shows no earlier price.', quote: 'Standard with ads: $8.99 / month', like: false, note: 'An ad-supported plan, and the example plan has no ads.' },
          { id: 'nf-std', need: 'family', plan: 'Standard', list: null, eff: 19.99, cond: 'Per month. Ad-free, 2 devices at a time, 1080p, with the option to add 1 extra member. The page shows no earlier price.', quote: 'Standard: $19.99 / month', like: true },
          { id: 'nf-prem', need: 'family', plan: 'Premium', list: null, eff: 26.99, cond: 'Per month. Ad-free, with the option to add up to 2 extra members. The page shows no earlier price.', quote: 'Premium: $26.99 / month', like: false, note: 'A higher tier than the example plan.' }
        ] },
      { id: 'disney', name: 'Disney+', url: 'https://www.disneyplus.com/', page: 'Home and plan options',
        offers: [
          { id: 'dis-bundle', need: 'price', plan: 'Disney+, Hulu Bundle (with ads), 6-month price', list: 12.99, eff: 11.99, cond: 'Per month for the first 6 months, then $12.99 a month. A bundle of Disney+ and Hulu. Terms apply.', quote: '$11.99 / mo for 6 months. Cost for 6 months: $71.94, then renews to monthly plan at $12.99/month.', like: false, note: 'An ad-supported bundle with another service.' },
          { id: 'dis-prem', need: 'bundle', plan: 'Disney+, Hulu Bundle Premium, 6-month price', list: 21.99, eff: 19.99, cond: 'Per month for the first 6 months, then $21.99 a month. An ad-free bundle of Disney+ and Hulu. Terms apply.', quote: '$19.99 / mo for 6 months. Cost for 6 months: $119.94, then renews to monthly plan at $21.99/month.', like: true },
          { id: 'dis-student', need: 'price', plan: 'Student offer, Disney+, Hulu Bundle', list: 12.99, eff: 6.49, cond: 'Per month while student status is verified. U.S. college and graduate students only.', quote: 'Original Price $12.99/mo. New Price $6.49/mo*', like: false, note: 'For verified students only, and ad-supported.' },
          { id: 'dis-espn', need: 'sports', plan: 'Disney+, Hulu, ESPN Unlimited bundle', list: null, eff: 35.99, cond: 'Starting at $35.99 a month. Adds all ESPN networks and ESPN+. 18+, U.S. only. The page shows no earlier price.', quote: 'Starting at $35.99/mo. Disney+ and Hulu. Plus, all ESPN networks, ESPN+, and now NFL Network with ESPN Unlimited', like: false, note: 'A sports bundle, priced well above the example plan.' },
          { id: 'dis-hbo', need: 'bundle', plan: 'Disney+, Hulu, HBO Max bundle', list: null, eff: 21.99, cond: 'Starting at $21.99 a month. Adds HBO Max. Terms apply. The page shows no earlier price.', quote: 'Starting at $21.99/mo. Disney+ and Hulu. Plus, all of HBO, the DC Universe, Warner Bros. and A24 on HBO Max.', like: false, note: 'A three-service bundle.' }
        ] }
    ]
  }
};
