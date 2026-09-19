REVOKE ALL ON FUNCTION public.comments_counters() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_follow() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_hype() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_pr_vote() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_pr_status() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_grade_change() FROM PUBLIC, anon, authenticated;