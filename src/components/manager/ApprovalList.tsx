import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatIDR } from "@/lib/currency";
import { toast } from "sonner";
import { useEffect } from "react";

export default function ApprovalList() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ["approval-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("approval_requests")
        .select(`
          *,
          rooms (room_name, room_number)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user profiles separately
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(r => r.requested_by))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);

        // Map profiles to requests
        return data.map(request => ({
          ...request,
          requester_name: profiles?.find(p => p.id === request.requested_by)?.full_name || "Unknown"
        })) as any[];
      }

      return (data || []) as any[];
    },
  });

  // Real-time subscription for approval requests
  useEffect(() => {
    const channel = supabase
      .channel('approval-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'approval_requests'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["approval-requests"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleApprove = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("approval_requests")
        .update({
          status: "approved",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      toast.success(t("approval.approved"));
      queryClient.invalidateQueries({ queryKey: ["approval-requests"] });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleReject = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("approval_requests")
        .update({
          status: "rejected",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      toast.success(t("approval.rejected"));
      queryClient.invalidateQueries({ queryKey: ["approval-requests"] });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: "secondary", icon: Clock, label: t("approval.statusPending") },
      approved: { variant: "default", icon: CheckCircle, label: t("approval.statusApproved") },
      rejected: { variant: "destructive", icon: XCircle, label: t("approval.statusRejected") },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getTypeLabel = (type: string) => {
    return type === "discount" ? t("approval.discount") : t("approval.minimumCharge");
  };

  if (isLoading) {
    return <div className="text-center py-8">{t("common.loading")}...</div>;
  }

  const pendingRequests = requests?.filter(r => r.status === "pending") || [];
  const completedRequests = requests?.filter(r => r.status !== "pending") || [];

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t("approval.pendingRequests")} ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingRequests.map((request) => (
              <Card key={request.id} className="border-l-4 border-l-yellow-500">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{getTypeLabel(request.request_type)}</Badge>
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="text-2xl font-bold">{formatIDR(request.amount)}</p>
                        {request.percentage && (
                          <p className="text-sm text-muted-foreground">
                            ({request.percentage}%)
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApprove(request.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {t("approval.approve")}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(request.id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          {t("approval.reject")}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      {request.rooms && (
                        <p className="text-muted-foreground">
                          {t("approval.room")}: {request.rooms.room_name} ({request.rooms.room_number})
                        </p>
                      )}
                      <p className="text-muted-foreground">
                        <User className="h-3 w-3 inline mr-1" />
                        {t("approval.requestedBy")}: {request.requester_name}
                      </p>
                      <p className="text-muted-foreground">
                        {t("approval.reason")}: {request.reason}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(request.created_at), "dd MMM yyyy HH:mm")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Completed Requests */}
      {completedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("approval.recentApprovals")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {completedRequests.slice(0, 10).map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {getTypeLabel(request.request_type)}
                    </Badge>
                    {getStatusBadge(request.status)}
                  </div>
                  <p className="font-semibold">{formatIDR(request.amount)}</p>
                  <p className="text-xs text-muted-foreground">
                    {request.requester_name} • {format(new Date(request.created_at), "dd MMM HH:mm")}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {!requests || requests.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {t("approval.noRequests")}
        </div>
      )}
    </div>
  );
}
