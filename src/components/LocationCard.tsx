import { SITE_CONFIG } from "@/data/site"

export function LocationCard() {
  const { address, hours, contact } = SITE_CONFIG
  const mapQuery = encodeURIComponent(`${address.plusCode} ${address.city}`)
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`

  return (
    <section
      className="location-block surface-paper"
      aria-labelledby="location-heading"
    >
      <div className="location-block__map">
        <div className="location-map-graphic">
          <svg
            viewBox="0 0 500 360"
            className="location-map-svg"
            aria-hidden="true"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <linearGradient id="mapBg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0d1a14" />
                <stop offset="100%" stopColor="#1b3025" />
              </linearGradient>
              <radialGradient id="pinGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(212, 175, 55, 0.34)" />
                <stop offset="100%" stopColor="rgba(212, 175, 55, 0)" />
              </radialGradient>
            </defs>

            <rect width="500" height="360" fill="url(#mapBg)" />

            {/* Abstract road network — Kigali's ridge roads curve */}
            <path
              d="M-20,120 Q140,70 300,130 T520,110"
              stroke="#2c4536"
              strokeWidth="7"
              fill="none"
            />
            <path
              d="M-20,200 Q160,230 520,190"
              stroke="#2c4536"
              strokeWidth="9"
              fill="none"
            />
            <path
              d="M-20,290 Q200,260 520,300"
              stroke="#2c4536"
              strokeWidth="5"
              fill="none"
            />
            <path
              d="M150,-20 Q170,180 130,380"
              stroke="#2c4536"
              strokeWidth="5"
              fill="none"
            />
            <path
              d="M330,-20 Q310,170 360,380"
              stroke="#2c4536"
              strokeWidth="6"
              fill="none"
            />

            {/* The roundabout people actually navigate by */}
            <circle
              cx="150"
              cy="200"
              r="15"
              fill="none"
              stroke="#7fa28d"
              strokeWidth="2.5"
            />
            <text
              x="150"
              y="246"
              fill="#94a79a"
              fontSize="9.5"
              textAnchor="middle"
              letterSpacing="2"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              ROUNDABOUT
            </text>

            {/* Location pin */}
            <circle cx="300" cy="180" r="48" fill="url(#pinGlow)" />
            <circle
              cx="300"
              cy="180"
              r="18"
              fill="none"
              stroke="#d4af37"
              strokeWidth="1.2"
              strokeDasharray="3 4"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 300 180"
                to="360 300 180"
                dur="40s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="300" cy="180" r="8" fill="#d4af37" />
            <circle cx="300" cy="180" r="3.5" fill="#0d1a14" />

            <g transform="translate(300, 143)">
              <rect
                x="-42"
                y="-20"
                width="84"
                height="24"
                fill="#0d1a14"
                stroke="#d4af37"
                strokeWidth="1"
              />
              <text
                x="0"
                y="-4"
                fill="#f4f1eb"
                fontSize="10"
                textAnchor="middle"
                letterSpacing="2.5"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                AMARI
              </text>
            </g>
          </svg>

          <div className="location-map-overlay">
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
              style={{
                minHeight: "44px",
                padding: "0 22px",
                background: "var(--paper)",
                color: "var(--forest-900)",
              }}
            >
              Open in Maps
            </a>
          </div>
        </div>
      </div>

      <div className="location-block__info">
        <div className="location-detail">
          <h2 id="location-heading" className="location-detail__label">
            Where we are
          </h2>
          <p className="location-detail__text">
            {address.street}
            <br />
            {address.neighborhood}, {address.city}
            <br />
            {address.landmark}
          </p>
        </div>

        <div className="location-detail">
          <p className="location-detail__label">Plus Code</p>
          <p className="location-detail__text">
            <span className="location-detail__code">{address.plusCode}</span>
            <br />
            Paste this into Google Maps — it is more reliable here than a street
            address.
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
            {hours.note}
          </p>
        </div>

        <div className="location-actions">
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="tlink"
          >
            Get directions
            <span className="tlink__arrow" aria-hidden="true">
              &rarr;
            </span>
          </a>
          <a
            href={`https://wa.me/${contact.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="tlink"
          >
            Ask us on WhatsApp
            <span className="tlink__arrow" aria-hidden="true">
              &rarr;
            </span>
          </a>
        </div>
      </div>
    </section>
  )
}

export default LocationCard
