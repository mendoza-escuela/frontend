import { Star } from 'lucide-react';

const certificationLevels = [
  { stars: 1, title: 'Estado inicial', colorClass: 'bg-mendoza-blue/30' },
  { stars: 2, title: 'Desarrollo bajo', colorClass: 'bg-mendoza-sky' },
  { stars: 3, title: 'Estado intermedio', colorClass: 'bg-mendoza-blue/60' },
  { stars: 4, title: 'Estado avanzado', colorClass: 'bg-mendoza-blue' },
  { stars: 5, title: 'Escuela promotora', colorClass: 'bg-mendoza-gold' },
];

export function CertificationScale() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {certificationLevels.map((level) => (
        <article
          className="rounded-2xl border border-mendoza-border bg-white p-5 shadow-sm"
          key={level.stars}
        >
          <div className="flex items-center gap-1" aria-label={`${level.stars} estrellas`}>
            {Array.from({ length: 5 }, (_, starIndex) => (
              <Star
                aria-hidden="true"
                className={
                  starIndex < level.stars
                    ? 'fill-mendoza-gold text-mendoza-gold'
                    : 'text-mendoza-border'
                }
                key={starIndex}
                size={18}
              />
            ))}
          </div>
          <div className="mt-5 flex items-center gap-3">
            <span className={`h-3 w-3 rounded-full ${level.colorClass}`} />
            <h3 className="text-sm font-bold text-mendoza-text">{level.title}</h3>
          </div>
          <p className="mt-2 text-sm text-mendoza-muted">
            {level.stars} estrella{level.stars > 1 ? 's' : ''}
          </p>
        </article>
      ))}
    </div>
  );
}
