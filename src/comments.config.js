// Feedback form settings for this tool. The component itself is a copy of
// the one on srichalla.com and is identical byte for byte; only this file
// differs between apps.
//
// `source` must be present in ALLOWED_SOURCES in srichalla-infra, and this
// site's origin in ALLOWED_ORIGINS, or submissions are rejected.

export const commentsConfig = {
  source: 'retirement-planner',
  endpoint: 'https://1y6xsk6ddk.execute-api.us-east-1.amazonaws.com/comments',
  heading: 'Feedback',
  intro:
    'Tell me where this is wrong, what it assumes that it should not, or what your situation needs that it does not handle. This goes to me directly and is not published anywhere.',
  privacyNote: 'Your name and email are optional, and I will only use them to reply.',
  successMessage: 'Thank you. I read every one of these.',
}
