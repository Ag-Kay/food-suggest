/**
 * The privacy policy, written once and shown in two places:
 * - in the app (Profile → Privacy policy), and
 * - as docs/PRIVACY_POLICY.md, the public web version both app stores ask for.
 * `privacy-policy.test.ts` fails if the two drift apart; regenerate the doc with
 * `pnpm --filter @food-suggest/mobile policy:write`.
 *
 * Keep it true: when what the app collects changes, change this first.
 */

/** Filled in before release (tracked in docs/PROGRESS.md, M6b). */
export const POLICY_OWNER = '[Owner name, to be added before release]';
export const POLICY_CONTACT = '[privacy contact email, to be added before release]';
export const POLICY_UPDATED = '8 November 2026';

export interface PolicySection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export const PRIVACY_POLICY: PolicySection[] = [
  {
    heading: 'The short version',
    bullets: [
      'Without an account, your answers, meal plan and shopping lists stay on your phone.',
      'No ads, no tracking across apps or websites, no analytics, and we never sell your data.',
      'With an account, we keep your email, saved meals, meal plan and shopping lists so they sync between phones. Your food and health preferences are stored only if you agree.',
      'You can delete everything at any time, from the app.',
    ],
  },
  {
    heading: 'Who we are',
    paragraphs: [
      `Food Suggest is run by ${POLICY_OWNER}, who is responsible for your data. Questions or requests: ${POLICY_CONTACT}.`,
    ],
  },
  {
    heading: 'What stays on your phone',
    paragraphs: ['These are stored only on your phone, and removed when you use "Clear data on this phone" or delete the app:'],
    bullets: [
      'Your answers: birth year, goal, diet, allergies, foods to avoid, cooking time and skill.',
      'Meals you viewed recently, your meal plan and your shopping lists.',
      'Display settings, such as showing calories.',
      'Copies of meals you opened, so they can be read offline.',
    ],
  },
  {
    heading: 'What we receive when you use the app',
    bullets: [
      'Suggestions: your answers are sent with the request, used to pick meals, and not saved.',
      'Shopping lists: the meals you planned are sent to add up ingredients, and not saved.',
      'Like any web service, our servers briefly record technical details of each request (time, the page asked for, the result and your IP address) to keep the service secure and stop abuse. These records are kept for no more than 30 days.',
    ],
  },
  {
    heading: 'If you create an account',
    bullets: [
      'Your email address, to send you sign-in codes. There is no password.',
      'Your saved meals, meal plan and shopping lists, so they are the same on every phone you sign in to.',
      'Your preferences and allergies, only if you agree when signing in. We record when you agreed and to which version of this policy. You can stop this in Profile; your preferences are then deleted from your account and stay on your phone.',
    ],
  },
  {
    heading: 'Health-related information',
    paragraphs: [
      'Allergies and diet can say something about your health, so we treat them as sensitive. We store them only with your consent, use them only to choose and check meals for you, and never use them for advertising.',
    ],
  },
  {
    heading: 'Who else handles your data',
    paragraphs: [
      'We use a small number of service providers who act on our instructions and may not use your data for anything else:',
    ],
    bullets: [
      'Supabase: accounts, sign-in codes, and storage for meal photos.',
      'Our database and server hosting provider, where account data is kept.',
      'An email delivery service, which sends the sign-in code to your address.',
    ],
  },
  {
    heading: 'Where your data is kept',
    paragraphs: [
      'Our providers may store data outside Ghana. We only use providers that protect personal data to a standard comparable with the Data Protection Act, 2012 (Act 843).',
    ],
  },
  {
    heading: 'How long we keep it',
    bullets: [
      'On your phone: until you clear it or delete the app.',
      'Account data: until you delete your account. Plan days more than 30 days old are removed automatically, and items you delete are fully removed within 60 days.',
      'Deleting your account (Profile → Delete account) permanently removes your account and everything in it straight away.',
    ],
  },
  {
    heading: 'Your rights',
    paragraphs: [
      `You can see, correct and delete your data in the app. You can also ask us for a copy of your data, or ask any question about it, at ${POLICY_CONTACT}. If you are unhappy with how we handle your data, you can complain to Ghana's Data Protection Commission.`,
    ],
  },
  {
    heading: 'Age',
    paragraphs: [
      'Food Suggest is for people aged 16 and over. We ask for your birth year to check this, and we do not suggest weight-loss goals to anyone under 18.',
    ],
  },
  {
    heading: 'Not medical advice',
    paragraphs: [
      'Food Suggest gives general food and nutrition information. Nutrition values are estimates. Always check ingredient labels for allergens, and speak to a doctor or dietitian about medical diets.',
    ],
  },
  {
    heading: 'Changes to this policy',
    paragraphs: [
      'If we change this policy, we will update the date below. If a change affects how we use your preferences and allergies, we will ask for your agreement again before it applies.',
    ],
  },
];

/** Markdown for the public web version (docs/PRIVACY_POLICY.md). */
export function policyMarkdown(): string {
  const lines = ['# Food Suggest privacy policy', '', `Last updated: ${POLICY_UPDATED}`, ''];
  for (const s of PRIVACY_POLICY) {
    lines.push(`## ${s.heading}`, '');
    for (const p of s.paragraphs ?? []) lines.push(p, '');
    if (s.bullets?.length) lines.push(...s.bullets.map((b) => `- ${b}`), '');
  }
  return lines.join('\n');
}
