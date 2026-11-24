export type HintMap = Record<string, Record<string, { id?: string; en?: string }>>

// The adat (traditional) wedding templates ship the same skeleton copy in their
// components, so the English hints are written per region instead of lifted from
// the shared DEFAULT_* objects: Banjar (South Kalimantan), Betawi (Jakarta) and
// Jawa each keep their own ritual vocabulary and tone.
export const HINTS: HintMap = {
  "adat-banjar": {
    profiles_intro: {
      en: "By the mercy and blessing of Allah SWT, we were brought together to walk as one in the custom of our Banjar families: in love, in patience, and in prayer.",
    },
    events_intro: {
      en: "By the mercy and blessing of Allah SWT, we invite you to join the ceremonies of our Banjar wedding:",
    },
    gallery_intro: {
      en: "Frames of riverbank evenings, family gatherings, and quiet prayers — the road that carried us to this blessed day.",
    },
    gallery_quote: {
      en: "Love grows through prayer, the blessing of our elders, and every step we take together.",
    },
    gift_intro_description: {
      en: "Without diminishing our respect, and with no obligation, for those who wish to send a token of love, the details are below:",
    },
    wishes_intro: {
      en: "With joyful hearts, we invite you to be with us and to leave your prayers and blessings for the life we begin.",
    },
    closing_message: {
      en: "For your presence and your prayers, we thank you from the bottom of our hearts. May Allah SWT continue to pour out His blessings on us all.",
    },
  },
  "adat-betawi": {
    profiles_intro: {
      en: "By the grace and blessing of Allah SWT, we were brought together to walk side by side — two Betawi families joined in one love.",
    },
    events_intro: {
      en: "By the grace and blessing of Allah SWT, we invite you to our Betawi wedding, from the palang pintu to the akad nikah:",
    },
    gallery_intro: {
      en: "Frames we keep close: the sirih kuning, the family gatherings, and the easy laughter that shaped us.",
    },
    gallery_quote: {
      en: "Love takes root in prayer, in the restu of our big Betawi family, and in every step we take side by side.",
    },
    gift_intro_description: {
      en: "Nothing is expected of you — yet if you wish to send a token of love, here is how:",
    },
    wishes_intro: {
      en: "With great joy we invite you to come and leave your prayers and blessings, the words that make a Betawi wedding complete.",
    },
    closing_message: {
      en: "For coming and for your prayers, thank you. May Allah SWT always keep our two families in His blessing.",
    },
  },
  "adat-jawa": {
    profiles_intro: {
      en: "By the grace and blessing of Allah SWT, we were brought together to walk side by side, with the patience, respect, and warmth of our Javanese upbringing.",
    },
    events_intro: {
      en: "By the grace and blessing of Allah SWT, we invite you to the processions of our Javanese wedding — the akad nikah and the panggih, where two families become one:",
    },
    gallery_intro: {
      en: "A few frames we hold dear — quiet mornings, family blessings, and the slow, sure road that led us to this day.",
    },
    gallery_quote: {
      en: "Love grows in prayer, in the blessing of our elders, and in every step we take together — gently and patiently, for the long road.",
    },
    gift_intro_description: {
      en: "Your presence is already the greatest gift. If you would like to send a token of love, the details are below.",
    },
    wishes_intro: {
      en: "With joyful hearts, we invite you to be present and to offer your prayers and blessings, on which every Javanese wedding rests.",
    },
    closing_message: {
      en: "It would be an honour and a joy for us if you would grace our wedding day with your presence and your blessing.",
    },
  },
}
