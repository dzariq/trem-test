import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Clock, AlertTriangle, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LessonPlanApproval } from "@/data/lessonPlanData";

interface ApprovalSectionProps {
  approval: LessonPlanApproval;
  onChange: (approval: LessonPlanApproval) => void;
  readOnly?: boolean;
}

export function ApprovalSection({ approval, onChange, readOnly = false }: ApprovalSectionProps) {
  const getStatusConfig = (status: LessonPlanApproval["status"]) => {
    switch (status) {
      case "approved":
        return {
          icon: CheckCircle2,
          label: "Approved",
          variant: "default" as const,
          className: "bg-emerald-500 hover:bg-emerald-600"
        };
      case "pending_review":
        return {
          icon: Clock,
          label: "Pending Review",
          variant: "secondary" as const,
          className: "bg-amber-100 text-amber-700 hover:bg-amber-200"
        };
      case "needs_revision":
        return {
          icon: AlertTriangle,
          label: "Needs Revision",
          variant: "destructive" as const,
          className: ""
        };
      default:
        return {
          icon: FileCheck,
          label: "Draft",
          variant: "outline" as const,
          className: ""
        };
    }
  };

  const statusConfig = getStatusConfig(approval.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Approval Status</CardTitle>
          <Badge 
            variant={statusConfig.variant}
            className={cn("gap-1", statusConfig.className)}
          >
            <StatusIcon className="h-3 w-3" />
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        {/* All approval fields in a responsive grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Prepared by</Label>
            <Input
              value={approval.preparedBy}
              onChange={(e) => onChange({ ...approval, preparedBy: e.target.value })}
              disabled={readOnly}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Date</Label>
            <Input
              type="date"
              value={approval.preparedDate}
              onChange={(e) => onChange({ ...approval, preparedDate: e.target.value })}
              disabled={readOnly}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Checked by</Label>
            <Input
              value={approval.checkedBy || ""}
              onChange={(e) => onChange({ ...approval, checkedBy: e.target.value || null })}
              disabled={readOnly}
              placeholder="HOD/Admin"
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Checked Date</Label>
            <Input
              type="date"
              value={approval.checkedDate || ""}
              onChange={(e) => onChange({ ...approval, checkedDate: e.target.value || null })}
              disabled={readOnly}
              className="h-9"
            />
          </div>
        </div>

        {/* Status Note */}
        {approval.status === "needs_revision" && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
            <p className="text-xs text-destructive">
              This lesson plan requires revision. Please update and resubmit.
            </p>
          </div>
        )}
        
        {approval.status === "pending_review" && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
            <p className="text-xs text-amber-700">
              Waiting for HOD/Admin review and approval.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
