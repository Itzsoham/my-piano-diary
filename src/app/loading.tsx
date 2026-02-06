import { AppLoader } from "@/components/ui/app-loader";

export default function Loading() {
  return (
    <div className="flex min-h-[calc(100vh-var(--header-height,0px))] w-full items-center justify-center p-8">
      <AppLoader />
    </div>
  );
}
