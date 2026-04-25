import { BRAZILIAN_CAPITALS } from '../lib/capitais'

import Image from 'next/image'

function CapitalCard({ city, abbr, image, focus }) {
  return (
    <article className="capital-card" aria-label={city}>
      <Image
        className="capital-card-image"
        src={encodeURI(image)}
        alt={city}
        fill
        sizes="130px"
        style={{ objectFit: 'cover', objectPosition: focus || 'center center' }}
      />
      <div className="capital-card-content">
        <span className="capital-card-abbr">{abbr}</span>
        <span className="capital-card-city">{city}</span>
      </div>
    </article>
  )
}

export default function CapitalTicker() {
  return (
    <section className="capital-ticker-section" aria-label="Cobertura nacional">
      <div className="capital-ticker-container">
        <div className="capital-ticker-track">
          {[0, 1].map((group) => (
            <div
              key={group}
              className="capital-ticker-row"
              aria-hidden={group === 1 ? 'true' : undefined}
            >
              {BRAZILIAN_CAPITALS.map((capital) => (
                <CapitalCard key={`${group}-${capital.slug}`} {...capital} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

