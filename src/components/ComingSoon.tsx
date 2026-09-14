import GlassCard from "@/components/ui/GlassCard";

export default function ComingSoon({ label }: { label: string }) {
  return (
    <div className="pt-4">
      <GlassCard className="flex min-h-[40vh] flex-col items-center justify-center text-center">
        <p className="text-sm font-medium text-foreground/50">{label}</p>
        <p className="mt-2 text-sm text-foreground/40">Coming soon.</p>
      </GlassCard>
    </div>
  );
}
