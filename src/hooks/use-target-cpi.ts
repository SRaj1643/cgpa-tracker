import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export function useTargetCpi() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["target-cpi", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<number | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("target_cpi")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      const v = data?.target_cpi;
      return v == null ? null : Number(v);
    },
  });

  const mutation = useMutation({
    mutationFn: async (target: number | null) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update({ target_cpi: target })
        .eq("id", user.id);
      if (error) throw error;
      return target;
    },
    onSuccess: (target) => {
      qc.setQueryData(["target-cpi", user?.id], target);
      toast.success(target == null ? "Goal cleared" : `Goal set to ${target.toFixed(2)} CPI`);
    },
    onError: () => toast.error("Could not save goal"),
  });

  return {
    target: query.data ?? null,
    loading: query.isLoading,
    setTarget: (v: number | null) => mutation.mutate(v),
    saving: mutation.isPending,
  };
}
