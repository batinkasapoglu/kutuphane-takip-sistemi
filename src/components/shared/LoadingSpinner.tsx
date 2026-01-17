import { Loader2 } from "lucide-react";

export default function LoadingSpinner({ size = 32 }: { size?: number }) {
  return (
    <div className="flex justify-center items-center p-8">
      <Loader2 className="animate-spin text-blue-600" size={size} />
    </div>
  );
}
