/* Site settings. See README.md.
   googleForm.action is the form's address with "viewform" changed to "formResponse".
   googleForm.entries are the field numbers Google gives each question. */
window.SITE = {
  googleForm: {
    action: "https://docs.google.com/forms/d/e/1FAIpQLScsn4qf_8wpqFQNbDM-r48XAteGrnp0KsFyBCnvM1tmUT46Bw/formResponse",
    entries: { pain: "entry.719865794", industry: "entry.198675700", contact: "entry.829357577", source: "" }
  },
  /* Not used while the Google Form above is set. */
  formEndpoint: "",
  /* The address shown for questions and deletion requests. Empty shows a plain sentence instead. */
  contactEmail: ""
};
