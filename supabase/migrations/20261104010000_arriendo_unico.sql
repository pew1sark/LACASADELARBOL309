-- ============================================================
-- El espacio se arrienda completo a precio fijo ($140.000).
-- Los paquetes anteriores y los servicios extra quedan ocultos (no se
-- borran: se pueden reactivar desde el panel → Precios y servicios).
-- ============================================================
update public.packages set active = false where slug <> 'arriendo-espacio';

insert into public.packages (slug, name, subtitle, description, event_type_id, price, price_is_from,
  weekend_price, included_guests, extra_guest_price, duration_hours, max_guests, image_url, badge, sort_order, active)
values ('arriendo-espacio', 'Arriendo del espacio', 'La casa completa, solo para tu evento',
  'Uso exclusivo de salón, galpón de juegos, patio, cocina, baños y sala multiuso.',
  null, 140000, false, null, null, 0, 3.5, 60, 'images/fotos/salon-principal.webp', null, 0, true)
on conflict (slug) do update set
  price = excluded.price, price_is_from = false, weekend_price = null, included_guests = null,
  extra_guest_price = 0, event_type_id = null, active = true, sort_order = 0;

delete from public.package_services
 where package_id = (select id from public.packages where slug = 'arriendo-espacio');

insert into public.package_services (package_id, name, sort_order)
select p.id, s.name, s.ord from public.packages p
cross join (values
  ('Uso exclusivo de toda la casa', 1),
  ('Salón principal con mesas y sillas', 2),
  ('Galpón de juegos: inflable y cama elástica', 3),
  ('Taca-taca y air hockey', 4),
  ('Bloques gigantes y juegos de madera', 5),
  ('Patio con ping pong y básquetbol', 6),
  ('Cocina equipada', 7),
  ('Baños', 8),
  ('Sala multiuso', 9)
) as s(name, ord)
where p.slug = 'arriendo-espacio';

update public.addons set active = false;
update public.time_slots set surcharge = 0;

update public.settings set
  city = 'Chiguayante', region = 'Biobío', address = coalesce(nullif(address, 'Calle 309'), 'Los Castaños'),
  hero_image_url = 'images/fotos/salon-principal.webp'
where id = 1;

update public.faqs set answer = 'Elige la fecha y el horario en el calendario, cuéntanos de tu evento y la solicitud te llega lista a WhatsApp. Confirmamos la disponibilidad y tu fecha queda reservada al recibir el abono.'
 where question = '¿Cómo reservo una fecha?';
update public.faqs set answer = 'Sí. Puedes traer tu propia comida, torta y decoración. La cocina equipada está incluida en el arriendo.'
 where question = '¿Puedo llevar mi propia comida y torta?';
update public.faqs set answer = 'La capacidad máxima es de 60 personas.'
 where question = '¿Cuántas personas caben?';
