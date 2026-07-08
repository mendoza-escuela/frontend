import { Star } from 'lucide-react';

const certificationLevels = [
  { stars: 1, title: 'Estado inicial', colorClass: 'bg-[#D7265E]' },
  { stars: 2, title: 'Desarrollo bajo', colorClass: 'bg-[#F5B51B]' },
  { stars: 3, title: 'Estado intermedio', colorClass: 'bg-[#007C89]' },
  { stars: 4, title: 'Estado avanzado', colorClass: 'bg-[#003A70]' },
  { stars: 5, title: 'Escuela promotora', colorClass: 'bg-[#6DBE45]' },
];

export function CertificationScale() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {certificationLevels.map((level) => (
        <article
          className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm"
          key={level.stars}
        >
          <div className="flex items-center gap-1" aria-label={`${level.stars} estrellas`}>
            {Array.from({ length: 5 }, (_, starIndex) => (
              <Star
                aria-hidden="true"
                className={
                  starIndex < level.stars
                    ? 'fill-[#F5B51B] text-[#F5B51B]'
                    : 'text-[#E5E7EB]'
                }
                key={starIndex}
                size={18}
              />
            ))}
          </div>
          <div className="mt-5 flex items-center gap-3">
            <span className={`h-3 w-3 rounded-full ${level.colorClass}`} />
            <h3 className="text-sm font-bold text-[#1F2937]">{level.title}</h3>
          </div>
          <p className="mt-2 text-sm text-[#6B7280]">
            {level.stars} estrella{level.stars > 1 ? 's' : ''}
          </p>
        </article>
      ))}
    </div>
  );
}
