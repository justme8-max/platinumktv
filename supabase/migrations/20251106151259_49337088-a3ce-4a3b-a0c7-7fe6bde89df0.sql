-- Create chat channels table
CREATE TABLE public.chat_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'group', -- 'direct', 'group', 'announcement'
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  mentions JSONB DEFAULT '[]'::jsonb, -- Array of user IDs mentioned
  is_all_mention BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create channel members table
CREATE TABLE public.chat_channel_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_read_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(channel_id, user_id)
);

-- Enable RLS
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_channel_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_channels
CREATE POLICY "Users can view channels they are members of"
  ON public.chat_channels FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.chat_channel_members 
      WHERE channel_id = chat_channels.id
    )
  );

CREATE POLICY "Managers can create channels"
  ON public.chat_channels FOR INSERT
  WITH CHECK (has_management_access(auth.uid()));

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages in their channels"
  ON public.chat_messages FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.chat_channel_members 
      WHERE channel_id = chat_messages.channel_id
    )
  );

CREATE POLICY "Users can send messages in their channels"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.chat_channel_members 
      WHERE channel_id = chat_messages.channel_id
    )
  );

-- RLS Policies for chat_channel_members
CREATE POLICY "Users can view channel members"
  ON public.chat_channel_members FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.chat_channel_members AS cm2
      WHERE cm2.channel_id = chat_channel_members.channel_id
    )
  );

CREATE POLICY "Managers can add channel members"
  ON public.chat_channel_members FOR INSERT
  WITH CHECK (has_management_access(auth.uid()));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_channels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_channel_members;

-- Create function to check if user can use @all
CREATE OR REPLACE FUNCTION public.can_use_all_mention(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id 
    AND role IN ('owner', 'manager')
  );
$$;

-- Create indexes for better performance
CREATE INDEX idx_chat_messages_channel_id ON public.chat_messages(channel_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at DESC);
CREATE INDEX idx_chat_channel_members_user_id ON public.chat_channel_members(user_id);

-- Create default "General" channel
INSERT INTO public.chat_channels (name, type) 
VALUES ('General', 'group');