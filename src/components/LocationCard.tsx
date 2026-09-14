import { SITE_CONFIG } from '@/data/site'

export function LocationCard() {
  const { address, hours, contact } = SITE_CONFIG
  const mapQuery = encodeURIComponent(`${address.plusCode} ${address.city}`)
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`

  return (
    <section className="location-block" aria-labelledby="location-heading">
      <div className="location-block__map">
        <div className="location-map-graphic">
          <svg viewBox="0 0 500 360" className="location-map-svg" aria-hidden="true">
            <defs>
              <linearGradient id="mapBg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1a2e23" />
                <stop offset="100%" stopColor="#253e30" />
              </linearGradient>
              <radialGradient id="pinGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(212, 175, 55, 0.4)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>

            <rect width="500" height="360" fill="url(#mapBg)" />

            {/* Abstract road network — Kigali's ridge roads curve */}
            <path d="M-20,120 Q140,70 300,130 T520,110" stroke="#365040" strokeWidth="7" fill="none" opacity="0.6" />
            <path d="M-20,200 Q160,230 520,190" stroke="#365040" strokeWidth="9" fill="none" opacity="0.75" />
            <path d="M-20,290 Q200,260 520,300" stroke="#365040" strokeWidth="5" fill="none" opacity="0.45" />
            <path d="M150,-20 Q170,180 130,380" stroke="#365040" strokeWidth="5" fill="none" opacity="0.5" />
            <path d="M330,-20 Q310,170 360,380" stroke="#365040" strokeWidth="6" fill="none" opacity="0.55" />

            {/* Roundabout — the landmark people navigate by */}
            <circle cx="150" cy="200" r="15" fill="none" stroke="#7fa28d" strokeWidth="3" opacity="0.75" />
            <text x="150" y="245" fill="#bcc9bf" fontSize="10" textAnchor="middle" style={{ fontFamily: 'var(--font-sans)' }} letterSpacing="1px">
              ROUNDABOUT
            </text>

            {/* Location pin */}
            <circle cx="300" cy="180" r="45" fill="url(#pinGlow)" />
            <circle cx="300" cy="180" r="18" fill="none" stroke="#d4af37" strokeWidth="1.5" strokeDasharray="3 3">
              <animateTransform attributeName="transform" type="rotate" from="0 300 180" to="360 300 180" dur="24s" repeatCount="indefinite" />
            </circle>
            <circle cx="300" cy="180" r="9" fill="#d4af37" />
            <circle cx="300" cy="180" r="4" fill="#1c3528" />

            <g transform="translate(300, 145)">
              <rect x="-58" y="-22" width="116" height="26" rx="2" fill="#1c3528" stroke="#d4af37" strokeWidth="1" />
              <text x="0" y="-5" fill="#faf8f4" fontSize="11" style={{ fontFamily: 'var(--font-sans)' }} fontWeight="500" textAnchor="middle" letterSpacing="1.5px">
                {SITE_CONFIG.name.toUpperCase()}
              </text>
            </g>
          </svg>

          <div className="location-map-overlay">
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--solid btn--sm"
              style={{ minHeight: '40px', padding: '0 24px' }}
            >
              Open in Google Maps ↗
            </a>
          </div>
        </div>
      </div>

      <div className="location-block__info">
        <div className="location-detail">
          <h2 id="location-heading" className="location-detail__label">Where we are</h2>
          <p className="location-detail__text">
            {address.street}
            <br />
            {address.neighborhood}, {address.city}
            <br />
            <span style={{ color: 'var(--ink-meta)' }}>{address.landmark}</span>
          </p>
        </div>

        <div className="location-detail">
          <p className="location-detail__label">Plus Code</p>
          <p className="location-detail__text">
            <span className="location-detail__code">{address.plusCode}</span>
            <br />
            <span style={{ color: 'var(--ink-meta)' }}>
              Paste this into Google Maps — it is more reliable here than a street address.
            </span>
          </p>
        </div>

        <div className="location-detail">
          <p className="location-detail__label">Parking</p>
          <p className="location-detail__text">{address.parking}</p>
        </div>

        <div className="location-detail">
          <p className="location-detail__label">Open</p>
          <p className="location-detail__text">
            {hours.weekdays}
            <br />
            {hours.weekends}
            <br />
            <span style={{ color: 'var(--ink-meta)' }}>{hours.note}</span>
          </p>
        </div>

        <div style={{ marginTop: '12px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="tlink">
            Get directions →
          </a>
          <a
            href={`https://wa.me/${contact.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="tlink"
          >
            Ask us on WhatsApp →
          </a>
        </div>
      </div>
    </section>
  )
}

export default LocationCard
