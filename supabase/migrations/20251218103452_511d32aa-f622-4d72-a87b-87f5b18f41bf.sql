-- Create a trigger function to auto-assign admin role to specific email
CREATE OR REPLACE FUNCTION public.auto_assign_admin_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-assign admin role for the specified admin email
  IF NEW.email = 'subhakaryam.official@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to run after user creation
DROP TRIGGER IF EXISTS assign_admin_on_signup ON auth.users;
CREATE TRIGGER assign_admin_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_admin_role();

-- Also check if user already exists and assign admin role
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'subhakaryam.official@gmail.com';
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;