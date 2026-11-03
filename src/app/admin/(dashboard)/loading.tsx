import Image from "next/image";
import { Loader2 } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="flex h-full min-h-[70vh] flex-col items-center justify-center gap-6 bg-ink">
      <Image src="/logo.png" alt="Bob's Bar" width={220} height={78} className="w-[220px] h-auto animate-pulse" priority />
      <Loader2 className="size-8 animate-spin text-gold" />
    </div>
  );
}
