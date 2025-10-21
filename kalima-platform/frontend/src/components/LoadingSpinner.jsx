import { Loader } from "lucide-react";

export function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center h-64">
      <Loader className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}