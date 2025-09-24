-- Add approval system fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN approved_by UUID REFERENCES public.profiles(id),
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN rejection_reason TEXT;

-- Update existing profiles to be approved (since they already exist)
UPDATE public.profiles SET approval_status = 'approved', approved_at = NOW() WHERE approval_status = 'pending';

-- Create sales reports view for admins
CREATE VIEW public.sales_reports AS
SELECT 
  p.full_name as representative_name,
  p.id as representative_id,
  COUNT(o.id) as total_orders,
  COALESCE(SUM(o.total_amount), 0) as total_sales,
  COALESCE(SUM(o.commission_amount), 0) as total_commissions,
  DATE_TRUNC('month', o.created_at) as month_year
FROM public.profiles p
LEFT JOIN public.orders o ON p.id = o.representative_id
WHERE p.role = 'representante'
GROUP BY p.id, p.full_name, DATE_TRUNC('month', o.created_at)
ORDER BY month_year DESC, total_sales DESC;

-- Create notification logs table
CREATE TABLE public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  email_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on notification_logs
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for notification_logs
CREATE POLICY "Admins can manage all notifications"
ON public.notification_logs
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Users can view their own notifications"
ON public.notification_logs
FOR SELECT
USING (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));