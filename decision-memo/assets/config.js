/* Site settings. Fill these in before you rely on the contact form. See README.md.
   The easiest way to fill in the Google Form block is the form-setup.html helper. */
window.SITE = {
  /* Option 1: a Google Form. Leave these empty if you use option 2.
     action  is the form's address with "viewform" changed to "formResponse".
     entries are the field numbers Google gives each question, for example "entry.123456789". */
  googleForm: {
    action: "",
    entries: { pain: "", industry: "", contact: "", source: "" }
  },
  /* Option 2: a form service that accepts a plain form post and replies with JSON,
     for example https://formspree.io/f/xxxxxxxx. Leave empty if you use option 1. */
  formEndpoint: "",
  /* The address shown on the contact page for questions and deletion requests.
     Leave empty to show a plain sentence instead. */
  contactEmail: ""
};
