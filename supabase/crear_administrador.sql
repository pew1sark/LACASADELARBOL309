-- Cómo dar acceso al panel a una persona nueva
-- ---------------------------------------------
-- 1) Crea el usuario desde el panel de Supabase:
--      Authentication → Users → Add user → Create new user
--      (marca "Auto Confirm User")
-- 2) Ejecuta esto en el SQL Editor con el correo que creaste:

insert into public.admin_users (user_id, full_name, email)
select id, 'Nombre Apellido', email
from auth.users
where email = 'correo@ejemplo.cl'
on conflict (user_id) do nothing;

-- Para quitar el acceso:
-- delete from public.admin_users where email = 'correo@ejemplo.cl';
