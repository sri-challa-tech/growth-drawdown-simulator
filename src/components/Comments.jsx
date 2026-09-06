import { useState } from 'react'

// Portable feedback form. Deliberately imports nothing from the host app:
// config and trackEvent come in as props, and every class is namespaced
// cf-*, so this file can be copied into any of the tools unchanged. When a
// third app needs it, this is the file that becomes the shared package.
//
// config: { source, endpoint, heading, intro, privacyNote, successMessage,
//           pageTitle? }

const MAX_MESSAGE = 2000
const MAX_NAME = 100
const MAX_EMAIL = 200

// Minimal sanity check. Real validation happens server side; this only
// catches obvious typos before the round trip.
function looksLikeEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export default function Comments({ config, trackEvent = () => {} }) {
  const [message, setMessage] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('') // honeypot, humans leave this empty
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const trimmed = message.trim()
    if (!trimmed) {
      setError('Please write a message before sending.')
      return
    }
    if (email && !looksLikeEmail(email)) {
      setError('That email address does not look right.')
      return
    }

    // A bot filled the hidden field. Pretend it worked and send nothing.
    if (website) {
      setStatus('sent')
      return
    }

    setStatus('sending')

    const payload = {
      source: config.source,
      message: trimmed,
      name: name.trim(),
      email: email.trim(),
      // Falls back to the document title, so a new page reports its own
      // name without any extra configuration.
      pageTitle: config.pageTitle || document.title,
      pageUrl: window.location.href,
    }

    // Stub mode, for building the UI before an endpoint exists.
    if (!config.endpoint) {
      console.info('[comments] stub mode, nothing sent:', payload)
      setStatus('sent')
      return
    }

    try {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      setStatus('sent')
      // No message text, only whether contact details came with it. The
      // comment itself belongs in the database, not in an analytics vendor.
      trackEvent('feedback_submit', {
        source: config.source,
        has_name: Boolean(name.trim()),
        has_email: Boolean(email.trim()),
      })
    } catch {
      setStatus('error')
      setError('That did not go through. Please try again in a moment.')
      // Worth knowing about. A form that silently fails looks identical to
      // a form nobody uses.
      trackEvent('feedback_error', { source: config.source })
    }
  }

  if (status === 'sent') {
    return (
      <section className="cf-section" id="feedback">
        <h2 className="cf-heading">{config.heading}</h2>
        <p className="cf-intro" role="status">
          {config.successMessage}
        </p>
      </section>
    )
  }

  const sending = status === 'sending'

  return (
    <section className="cf-section" id="feedback">
      <h2 className="cf-heading">{config.heading}</h2>
      <p className="cf-intro">{config.intro}</p>

      <form className="cf-form" onSubmit={handleSubmit} noValidate>
        <div className="cf-field">
          <label htmlFor="cf-message">Message</label>
          <textarea
            id="cf-message"
            name="message"
            rows={5}
            maxLength={MAX_MESSAGE}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={sending}
            required
          />
        </div>

        <div className="cf-field-row">
          <div className="cf-field">
            <label htmlFor="cf-name">
              Name <span className="cf-optional">optional</span>
            </label>
            <input
              id="cf-name"
              name="name"
              type="text"
              maxLength={MAX_NAME}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={sending}
            />
          </div>

          <div className="cf-field">
            <label htmlFor="cf-email">
              Email <span className="cf-optional">optional</span>
            </label>
            <input
              id="cf-email"
              name="email"
              type="email"
              maxLength={MAX_EMAIL}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={sending}
            />
          </div>
        </div>

        {/* Honeypot. Hidden from people, tempting to bots. */}
        <div className="cf-honeypot" aria-hidden="true">
          <label htmlFor="cf-website">Website</label>
          <input
            id="cf-website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        <div className="cf-actions">
          <button className="cf-submit" type="submit" disabled={sending}>
            {sending ? 'Sending' : 'Send'}
          </button>
          <p className="cf-privacy">{config.privacyNote}</p>
        </div>

        {/* Rendered only when there is something to say. Reserving the space
            would avoid a layout shift, but leaves dead space under the button
            on every render where nothing is wrong, which is most of them. */}
        {error && (
          <p className="cf-error" role="alert">
            {error}
          </p>
        )}
      </form>
    </section>
  )
}
