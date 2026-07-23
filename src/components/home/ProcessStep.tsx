type ProcessStepProps = {
  description: string;
  step: number;
};

export function ProcessStep({ description, step }: ProcessStepProps) {
  return (
    <li className="relative rounded-2xl border border-mendoza-border bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mendoza-blue text-sm font-bold text-white">
          {step}
        </span>
        <p className="pt-2 text-sm font-semibold leading-6 text-mendoza-text">
          {description}
        </p>
      </div>
    </li>
  );
}
