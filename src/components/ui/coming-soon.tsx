import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface ComingSoonCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function ComingSoonCard({ icon: Icon, title, description }: ComingSoonCardProps) {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-white/10">
      <CardHeader>
        <div className="p-3 bg-secondary/20 rounded-lg w-fit mb-2">
          <Icon className="h-6 w-6 text-secondary" />
        </div>
        <CardTitle className="text-white font-fredoka text-xl">{title}</CardTitle>
        <CardDescription className="text-white/70">{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
