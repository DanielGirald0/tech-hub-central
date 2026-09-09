import { AlertTriangle } from "lucide-react";
import { REPAIR_PRIORITY_COLOR, REPAIR_PRIORITY_LABEL, RepairPriority } from "@/lib/repairs";

interface Props {
  priority?: string | null;
  className?: string;
}

/** Badge reutilizable de prioridad (Normal / Prioritaria). */
const PriorityBadge = ({ priority, className = "" }: Props) => {
  const p: RepairPriority = priority === "prioritaria" ? "prioritaria" : "normal";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${REPAIR_PRIORITY_COLOR[p]} ${className}`}
    >
      {p === "prioritaria" && <AlertTriangle className="w-3 h-3" aria-hidden="true" />}
      {REPAIR_PRIORITY_LABEL[p]}
    </span>
  );
};

export default PriorityBadge;
