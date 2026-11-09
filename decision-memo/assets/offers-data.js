/* Real offers captured from rivals' public pricing pages on 9 Nov 2026, using a browser session that reads the page as a visitor in the United States would see it.
   Prices are as shown on the page that day. Nothing here is fetched live by the site. "list" is the price shown before the offer, where the page shows one.
   "eff" is the effective monthly price over the first 12 months, worked out from the page. "like" says whether the plan is a like-for-like match for the example company's plan. */
window.OF = {
  captured: '2026-11-09',
  telecom: {
    ref: 'Our Unlimited Plus plan, 4 lines',
    rivals: [
      { id: 'att', name: 'AT&T', url: 'https://www.att.com/plans/wireless/', page: 'Wireless plans',
        offers: [
          { id: 'att-extra', plan: 'Extra 2.0, 4 lines', list: 50, eff: 35, cond: 'Per line per month when you get 4 lines. The page marks it "Most popular".', quote: 'Was $50.00 per month. Now $35.00 per month per line when you get 4 lines', like: true },
          { id: 'att-value', plan: 'Value 2.0, 4 lines', list: 40, eff: 25, cond: 'Per line per month when you get 4 lines. The page marks it "Most affordable".', quote: 'Was $40.00 per month. Now $25.00 per month per line when you get 4 lines', like: false, note: 'A lower tier than the example plan.' },
          { id: 'att-premium', plan: 'Premium 2.0, 4 lines', list: 60, eff: 45, cond: 'Per line per month when you get 4 lines.', quote: 'Was $60.00 per month. Now $45.00 per month per line when you get 4 lines', like: false, note: 'A higher tier than the example plan.' }
        ] },
      { id: 'tmobile', name: 'T-Mobile', url: 'https://www.t-mobile.com/cell-phone-plans', page: 'Cell phone plans',
        offers: [
          { id: 'tmo-standard', plan: 'T-Mix Standard, 4 lines', list: 33.33, eff: 25, cond: 'The page offers 4 phone lines for $25 per line when you transfer your number, with AutoPay. List is the 3-line price of $100 a month, divided by 3.', quote: '4 phone lines for $25 per line when you transfer your number.', like: false, note: 'A lower tier than the example plan.' },
          { id: 'tmo-more', plan: 'T-Mix More, 3 lines', list: 61.67, eff: 51.67, cond: 'The page shows $155 a month for 3 lines with AutoPay ($185 without). Divided by 3 lines.', quote: '$155/mo. for 3 phone lines + taxes and fees. With AutoPay discount', like: true }
        ] },
      { id: 'verizon', name: 'Verizon', url: 'https://www.verizon.com/plans/', page: 'Plans',
        offers: [
          { id: 'vz-simplicity', plan: 'Simplicity Plan, 1 line', list: null, eff: 30, cond: 'One line, after AutoPay and a $15 a month switch discount. The page shows no earlier price.', quote: '$30 /month 1 line. After AutoPay and $15/mo switch discount.', like: false, note: 'A one-line price, and the example plan is priced for four lines.' }
        ] }
    ]
  },
  saas: {
    ref: 'Our Team plan, billed monthly',
    rivals: [
      { id: 'slack', name: 'Slack', url: 'https://slack.com/pricing', page: 'Pricing',
        offers: [
          { id: 'slack-pro', plan: 'Pro, billed monthly', list: 8.75, eff: 7.66, cond: '50% off for 3 months: $4.38 for 3 months, then $8.75. Per user per month. Effective first-year price worked out from the page.', quote: '50% OFF FOR 3 MONTHS* $8.75 $4.38 USD per user / month, when paying monthly', like: true },
          { id: 'slack-biz', plan: 'Business+, billed monthly', list: 18, eff: 15.75, cond: '50% off for 3 months: $9 for 3 months, then $18. Per user per month. Effective first-year price worked out from the page.', quote: '50% OFF FOR 3 MONTHS* $18 $9 USD per user / month, when paying monthly', like: false, note: 'A higher tier than the example plan.' }
        ] },
      { id: 'asana', name: 'Asana', url: 'https://asana.com/pricing', page: 'Pricing',
        offers: [
          { id: 'asana-starter', plan: 'Starter, billed annually', list: 10.99, eff: 10.99, cond: 'Per user per month, billed annually. No offer shown.', quote: '$10.99 Per user, per month billed annually', like: true },
          { id: 'asana-adv', plan: 'Advanced, billed annually', list: 24.99, eff: 24.99, cond: 'Per user per month, billed annually. No offer shown.', quote: '$24.99 Per user, per month billed annually', like: false, note: 'A higher tier than the example plan.' }
        ] }
    ]
  }
};
