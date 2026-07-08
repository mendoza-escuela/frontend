type ProcessStepProps = {
  description: string;
  step: number;
};

export function ProcessStep({ description, step }: ProcessStepProps) {
  return (
    <li className="relative rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#003A70] text-sm font-bold text-white">
          {step}
        </span>
        <p className="pt-2 text-sm font-semibold leading-6 text-[#1F2937]">
          {description}
        </p>
      </div>
    </li>
  );
}
