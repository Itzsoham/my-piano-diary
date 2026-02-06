import { AppLoader } from "@/components/ui/app-loader";

export default function Loading() {
  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <AppLoader />
    </div>
  );
}
