# MercApp

Marketplace de mercado de barrio (cliente + vendedor, radio 2.5 km). App web de una sola pagina (HTML + CSS + JS, sin frameworks). Conectada a Supabase y lista para Netlify.

## Archivos
- `index.html` - estructura (enlaza styles.css y app.js)
- `styles.css` - estilos
- `app.js` - logica (incluye Supabase Auth, Google, mercados)
- `README.md` - este archivo

Los 3 archivos deben ir en la MISMA carpeta.

## Probar local
```bash
python3 -m http.server 8000   # abrir http://localhost:8000
```

## Publicar en Netlify
Netlify -> Add new site -> Deploy manually -> arrastra la carpeta. Te da una URL HTTPS.

================================================================
## SUPABASE (ya conectado)
================================================================
- URL: https://mohbirhrtbgilwtuxdcu.supabase.co
- Publishable key: sb_publishable_TpSVjpmseRSdp6JnTcm4nw_CSvh_9Ko
Ya estan puestas en app.js (SUPABASE_URL / SUPABASE_ANON_KEY).

### 1) Crear tabla de mercados (SQL Editor, una vez)
```sql
create table if not exists public.mercados (
  vendor_id integer primary key,
  company text, market text,
  lat double precision, lng double precision,
  updated_at timestamptz default now()
);
alter table public.mercados enable row level security;
create policy "mercados_select_public" on public.mercados for select using (true);
create policy "mercados_insert_public" on public.mercados for insert with check (true);
create policy "mercados_update_public" on public.mercados for update using (true) with check (true);
```

### 2) Login real con CORREO Y CONTRASENA (Supabase Auth)
Ya funciona en el codigo:
- "Crear cuenta nueva" -> crea usuario real en Supabase (Authentication > Users).
- Iniciar sesion -> valida contra Supabase.
Opcional: en Supabase -> Authentication -> Providers -> Email, puedes desactivar
"Confirm email" para que el usuario entre sin confirmar el correo. Si lo dejas
activo, el usuario debe confirmar desde su correo antes de iniciar sesion.

### 3) Crear cuenta / entrar con GOOGLE  (PASOS QUE DEBES HACER TU)
El boton "Continuar con Google" ya esta en la app. Para que funcione:
a) Google Cloud Console (console.cloud.google.com):
   - Crea un proyecto -> APIs y servicios -> Pantalla de consentimiento OAuth (External).
   - Credenciales -> Crear credenciales -> ID de cliente de OAuth -> Aplicacion web.
   - En "URIs de redireccionamiento autorizados" agrega EXACTAMENTE:
       https://mohbirhrtbgilwtuxdcu.supabase.co/auth/v1/callback
   - Copia el Client ID y Client Secret.
b) Supabase -> Authentication -> Providers -> Google:
   - Activa "Enable", pega Client ID y Client Secret, guarda.
c) Supabase -> Authentication -> URL Configuration:
   - Site URL: la URL de tu sitio (ej. https://TU-SITIO.netlify.app)
   - Redirect URLs: agrega tambien esa misma URL (y http://localhost:8000 para pruebas).
Sin estos pasos, Google devuelve error de "redirect" o "provider not enabled".

### 4) ADMINISTRADOR
- En app.js busca:  const ADMIN_EMAILS=['456456@mercapp.com','admin@mercapp.com'];
  Agrega ahi tu correo (el de Google o el de tu cuenta) para que entre como admin.
- Tambien existe el admin de demo:  456456@mercapp.com / 456456
- El admin entra como cliente con permisos extra: en el menu (engranaje) aparece
  "Personalizacion de colores" para cambiar la paleta de la app.

## Credenciales de prueba (demo, offline)
Cliente: 789789@mercapp.com / 789789
Admin:   456456@mercapp.com / 456456
Vendedor: 123123 / 789789 / 456456 / 321321  @mercapp.com  (pass = mismo numero)
> Elige el rol (Cliente / Vendedor) antes de entrar. El boton de Google es para Cliente.

================================================================
## QUE NO PUEDO HACER YO (lo tienes que hacer tu)
================================================================
1. Activar el proveedor Google en Supabase y crear las credenciales en Google
   Cloud (necesita tu cuenta Google y la consola de Google). Ver paso 3.
2. Configurar Site URL / Redirect URLs en Supabase (paso 3c).
3. Crear las tablas / politicas RLS en la base (pega el SQL de arriba). No tengo
   permiso de ejecutar SQL en tu proyecto desde aqui.
4. Hacer push a GitHub / desplegar: yo genero los archivos; tu los subes a tu
   repo o a Netlify. (Estar conectado a GitHub no afecta a Supabase.)
5. Pasarela de pago real (Yape/Culqi/Mercado Pago): la verificacion de pago en la
   app es simbolica; cobrar de verdad requiere una pasarela y backend.

## Seguridad (importante)
Las politicas RLS de 'mercados' son abiertas (demo). Los usuarios de Auth
(correo/Google) si son reales y seguros. Para datos sensibles por usuario,
crea tablas con RLS basadas en auth.uid().

## Notas
- Responsive en PC, Android e iOS. Modo claro/oscuro.
- El mapa (Leaflet) y el QR se cargan por CDN; geolocalizacion requiere HTTPS.
- Ventas: cifras simuladas estables hasta conectar ventas reales.

---
MercApp - Lima, Peru.
