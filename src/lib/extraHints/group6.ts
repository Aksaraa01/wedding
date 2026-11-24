export type HintMap = Record<string, Record<string, { id?: string; en?: string }>>

// Adat templates. Every line below is a translation of the copy that template
// prints in Indonesian (its DEFAULTS object or the demo entry), so the English
// hint matches the sentence the guest will actually see in that design.
export const HINTS: HintMap = {
  "adat-bali": {
    cover_apology: {
      en: "Should any name or title be written incorrectly, we ask for your understanding.",
    },
    profiles_intro: {
      en: "Praying for the grace and blessing of Allah SWT, we were brought together to walk as one in love and harmony.",
    },
    events_intro: {
      en: "Trusting in the grace of Allah SWT, we invite you to the processions of our Balinese wedding:",
    },
    gallery_intro: {
      en: "Frames we have kept close, bearing witness to the road that led us to this day.",
    },
    gallery_quote: {
      en: "Love takes root in prayer, in a family's blessing, and in every step we take side by side.",
    },
    gift_intro_description: {
      en: "With all due respect, should you wish to send us a token of love, it may be given through:",
    },
    wishes_intro: {
      en: "With hearts full of joy, we invite you to come and offer your prayers and blessings.",
    },
    closing_message: {
      en: "Thank you for coming and for the blessings you have offered us. May Allah SWT continue to shower us with His grace.",
    },
  },
  "adat-batak": {
    profiles_intro: {
      en: "Asking for the mercy of God Almighty, we were joined to walk together in love and harmony.",
    },
    events_intro: {
      en: "Under the grace of God Almighty, we invite you to the service and the customs of our Batak wedding:",
    },
    gallery_intro: {
      en: "Frames we hold dear, which stand as witnesses of the road toward our wedding day.",
    },
    gallery_quote: {
      en: "Love grows through prayer, through a family's blessing, and through every step we walk as one.",
    },
    gift_intro_description: {
      en: "With respect, if you would like to give us a token of love, you may do so through:",
    },
    wishes_intro: {
      en: "We would be glad to have you with us, lifting a prayer of blessing over our marriage.",
    },
    closing_message: {
      en: "We thank you for your presence and your prayers, and pray that God keeps pouring out His blessing on us all.",
    },
  },
  "adat-bugis": {
    profiles_intro: {
      en: "Seeking the mercy and good pleasure of Allah SWT, we were united to take this journey in love and harmony.",
    },
    events_intro: {
      en: "With the blessing of Allah SWT, we invite you to the processions of our Bugis wedding:",
    },
    gallery_intro: {
      en: "A handful of frames we have treasured, each one a witness to the days before our wedding.",
    },
    gallery_quote: {
      en: "Love is nurtured by prayer, by the blessing of family, and by every step of the road we walk together.",
    },
    gift_intro_description: {
      en: "With respect for your kindness, should you wish to present us with a token of love, it may be sent through:",
    },
    wishes_intro: {
      en: "It is with gladness that we ask you to be present and to grant us your prayers and blessings.",
    },
    closing_message: {
      en: "Thank you for your presence and for the blessings you have given us. May Allah SWT continue to grant us His barakah.",
    },
  },
  "adat-dayak": {
    profiles_intro: {
      en: "Through the grace and blessing of Allah SWT we found one another, and now we set out together in love and harmony.",
    },
    events_intro: {
      en: "By the grace of Allah SWT, we invite you to share in the rites of our Dayak wedding:",
    },
    gallery_intro: {
      en: "These are the pictures we hold close, the record of a journey that arrives at our happy day.",
    },
    gallery_quote: {
      en: "Love blossoms in prayer, in our families' blessing, and in each step we have taken hand in hand.",
    },
    gift_intro_description: {
      en: "Without any wish to presume, if you would like to send a gift of love, you may use the details below:",
    },
    wishes_intro: {
      en: "Come and stand with us, and let your prayers and blessings be part of our celebration.",
    },
    closing_message: {
      en: "We are grateful for your presence and prayers, and we pray that Allah SWT keeps blessing every step we take.",
    },
  },
}
