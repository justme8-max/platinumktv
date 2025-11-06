import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, AtSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface Message {
  id: string;
  content: string;
  user_id: string;
  is_all_mention: boolean;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface ChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ChatDialog({ open, onOpenChange }: ChatDialogProps) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [canUseAllMention, setCanUseAllMention] = useState(false);
  const [channelId, setChannelId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      loadUserAndChannel();
    }
  }, [open]);

  useEffect(() => {
    if (channelId) {
      loadMessages();
      subscribeToMessages();
    }
  }, [channelId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadUserAndChannel = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setCurrentUser(user);

    // Check if user can use @all mention
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    setCanUseAllMention(
      roleData?.role === "owner" || roleData?.role === "manager"
    );

    // Get or create General channel membership
    const { data: channels } = await supabase
      .from("chat_channels")
      .select("id")
      .eq("name", "General")
      .single();

    if (channels) {
      setChannelId(channels.id);

      // Add user to channel if not already a member
      const { error } = await supabase
        .from("chat_channel_members")
        .upsert({ channel_id: channels.id, user_id: user.id }, { onConflict: 'channel_id,user_id' });
    }
  };

  const loadMessages = async () => {
    if (!channelId) return;

    const { data: messagesData } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (messagesData) {
      // Fetch profiles for all users
      const userIds = [...new Set(messagesData.map(m => m.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      const messagesWithProfiles = messagesData.map(msg => ({
        ...msg,
        profiles: profilesMap.get(msg.user_id) || { full_name: "User", email: "" }
      }));

      setMessages(messagesWithProfiles);
    }
  };

  const subscribeToMessages = () => {
    if (!channelId) return;

    const channel = supabase
      .channel(`chat-${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          // Fetch message and profile
          const { data: messageData } = await supabase
            .from("chat_messages")
            .select("*")
            .eq("id", payload.new.id)
            .single();

          if (messageData) {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("full_name, email")
              .eq("id", messageData.user_id)
              .single();

            const messageWithProfile = {
              ...messageData,
              profiles: profileData || { full_name: "User", email: "" }
            };

            setMessages((prev) => [...prev, messageWithProfile]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !channelId || !currentUser) return;

    const isAllMention = newMessage.includes("@all");
    
    if (isAllMention && !canUseAllMention) {
      toast.error(t("chat.no_permission_all"));
      return;
    }

    const { error } = await supabase.from("chat_messages").insert({
      channel_id: channelId,
      user_id: currentUser.id,
      content: newMessage,
      is_all_mention: isAllMention,
    });

    if (error) {
      toast.error(t("chat.failed_send"));
      return;
    }

    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const insertAllMention = () => {
    if (canUseAllMention) {
      setNewMessage((prev) => prev + "@all ");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            {t("chat.team_chat")}
            {canUseAllMention && (
              <span className="text-xs text-muted-foreground">
                ({t("chat.you_can_use_all")})
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwn = message.user_id === currentUser?.id;
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {message.profiles?.full_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex flex-col gap-1 max-w-[70%] ${isOwn ? "items-end" : ""}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">
                        {message.profiles?.full_name || "User"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.created_at).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        isOwn
                          ? "bg-gradient-primary text-primary-foreground"
                          : "bg-muted"
                      } ${message.is_all_mention ? "ring-2 ring-primary" : ""}`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    </div>
                    {message.is_all_mention && (
                      <span className="text-xs text-primary font-medium">
                        {t("chat.at_all")}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t">
          <div className="flex gap-2">
            {canUseAllMention && (
              <Button
                variant="outline"
                size="icon"
                onClick={insertAllMention}
                title={t("chat.mention_all")}
              >
                <AtSign className="h-4 w-4" />
              </Button>
            )}
            <Input
              placeholder={t("chat.type_message")}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
