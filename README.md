# MercApp

Marketplace que conecta clientes con vendedores de mercados tradicionales de Lima
(radio ~2.5 km). App de una sola página (HTML/CSS/JS) con autenticación, perfiles,
pedidos y pago con Yape, sobre **Supabase**.

🔗 **Demo:** https://mercapp02.netlify.app

---

## 📁 Estructura

```
index.html      Página principal (enlaza styles.css y app.js)
styles.css      Estilos
app.js          Lógica de la app (Supabase, auth, pedidos, pago)
dashboard.html  Panel simple: correo + rol + cerrar sesión
reset.html      Página para fijar nueva contraseña
README.md       Este archivo
.gitignore
supabase/functions/payment-webhook/index.ts   Webhook de pago (pasarela real)
```

Los cuatro archivos base (`index.html`, `styles.css`, `app.js`, `README.md`) van
en la **raíz** del repo. `index.html` carga `styles.css` y `app.js` desde la
misma carpeta, así que deben quedar juntos.

---

## 🚀 Desplegar en Netlify

- **Git:** conecta este repositorio en Netlify. Sin build command; publish
  directory = raíz (`.`).
- **Manual:** arrastra los archivos a Netlify Drop.

Sube todo a la **raíz** del sitio (no dentro de subcarpetas).

---

## 🔑 Supabase

Proyecto: `https://mohbirhrtbgilwtuxdcu.supabase.co`
En el navegador solo va la **publishable key** (pública, segura). **Nunca** subas
`service_role` ni `sb_secret_...` al frontend ni a este repo.

### 1) Auth → URL Configuration
- **Site URL:** `https://mercapp02.netlify.app`
- **Redirect URLs:**
  - `https://mercapp02.netlify.app`
  - `https://mercapp02.netlify.app/reset.html`

### 2) Auth → Providers → Email
- Activa **Confirm email**.

### 3) Políticas RLS (SQL Editor) — necesario para pedidos
```sql
create policy "orders_select_own" on public.orders
  for select using (auth.uid() = user_id);
create policy "orders_insert_own" on public.orders
  for insert with check (auth.uid() = user_id);
create policy "orders_update_own" on public.orders
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

### Tablas
- `profiles(id → auth.users, role cliente|vendedor, created_at)`
- `orders(id, user_id → auth.users, products jsonb, subtotal, igv, delivery,
  total, payment_method yape|tarjeta|bcp, status pendiente|pagado|rechazado,
  authorization_code, created_at)`
- `messages(id, vendor_id, client_id → auth.users, sender cliente|vendedor,
  body, read, created_at)` — chat cliente ↔ vendedor (ver abajo).
- `mercados(vendor_id, company, market, lat, lng, updated_at)`

---

## 💬 Mensajes (chat cliente ↔ vendedor en tiempo real)

Por defecto el chat vivía solo en memoria. Para que **se envíe y se reciba de
verdad**, crea la tabla `messages`, activa **Realtime** y agrega las políticas.
Ejecuta en SQL Editor:

```sql
-- 1) Tabla de mensajes
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  vendor_id integer not null,
  client_id uuid references auth.users(id),
  sender text not null check (sender in ('cliente','vendedor')),
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists messages_conv_idx
  on public.messages (vendor_id, client_id, created_at);

-- 2) RLS (DEMO permisivo, igual que mercados). Ver "Seguridad" abajo.
alter table public.messages enable row level security;
create policy "messages_select" on public.messages for select using (true);
create policy "messages_insert" on public.messages for insert with check (true);
create policy "messages_update" on public.messages for update using (true);

-- 3) Realtime: habilita la tabla en la publicación
alter publication supabase_realtime add table public.messages;
```

### Cómo funciona en la app
- Cada mensaje guarda `vendor_id` (la tienda) + `client_id` (el cliente real
  autenticado) + `sender` ('cliente' | 'vendedor') + `body`.
- Al enviar, la app **inserta** la fila; gracias a **Realtime** el otro lado la
  recibe al instante (sin recargar). La app se suscribe por `vendor_id` (vendedor)
  o por `client_id` (cliente).
- El cliente debe haber iniciado sesión con **correo/Google** (usuario real de
  Supabase). El cliente demo `789789` usa el chat local antiguo (sin nube).

### ⚠️ Importante sobre los vendedores
Hoy los vendedores entran con cuentas demo (no son usuarios de Supabase). Por eso
las políticas de arriba son **permisivas** (cualquiera con la clave pública podría
leer mensajes). Para producción: convierte a los vendedores en usuarios de
Supabase (rol 'vendedor' en profiles) y cambia las políticas a algo como
`using (auth.uid() = client_id or auth.uid() = vendor_uid)`, añadiendo una
columna `vendor_uid uuid` que apunte al usuario del vendedor.

---

## 💳 Pago con Yape / BCP

Yape y BCP **no tienen API pública** para QR de cobro dinámico, código de
autorización ni webhook automático (cuenta personal). Para verificación
automática se necesita una **pasarela** (Culqi, Izipay, Niubiz, Mercado Pago) o
un contrato "Yape para Empresas".

Flujo actual (verificación manual):
1. Al confirmar el pedido se crea una fila en `orders` con `status = 'pendiente'`.
2. Se muestra el QR de Yape + un QR dinámico con el monto y la referencia, y un
   campo para el código de operación.
3. Al verificar, el pedido pasa a `status = 'pagado'` y se genera la boleta digital.

### Webhook (para una pasarela real)
```bash
supabase functions deploy payment-webhook --no-verify-jwt
supabase secrets set WEBHOOK_SECRET=tu_secreto SERVICE_ROLE_KEY=tu_service_role
```
URL: `https://mohbirhrtbgilwtuxdcu.supabase.co/functions/v1/payment-webhook`

---

## 🧪 Credenciales de demo

| Rol      | Usuario            | Clave  |
|----------|--------------------|--------|
| Cliente  | 789789@mercapp.com | 789789 |
| Admin    | 456456@mercapp.com | 456456 |
| Vendedor | 123123@mercapp.com | 123123 |

Selecciona el rol antes de iniciar sesión. Google es solo para clientes.

---

## 🔒 Seguridad

- Frontend: solo **publishable key** (`sb_publishable_...`).
- `service_role` / `sb_secret_...`: solo en el servidor (Edge Function), por
  variables de entorno. Si alguna se expuso, **rótala** en Supabase → Settings → API.

================================================================
## LOGIN CON GOOGLE + PERFIL COMPLETO (profiles)
================================================================

### A) Agregar campos a profiles (SQL Editor)
La tabla `profiles` solo tenia id, role, created_at. Agrega los demas:

```sql
alter table public.profiles
  add column if not exists full_name text,
  add column if not exists dni       text,
  add column if not exists phone     text,
  add column if not exists email     text;
```

Al iniciar sesion (Google o correo) la app hace UPSERT en profiles con:
id, email, role, y -si existen- full_name, dni, phone. No sobreescribe con
vacios, asi que los datos que el usuario complete en su perfil se conservan.

### B) OJO con el dominio  (IMPORTANTE)
Tu sitio publicado es **https://mercapp02.netlify.app**. Ese es el dominio que
debe usarse en `SITE_URL`, en Supabase (Site URL + Redirect URLs) y en los
enlaces de los correos. Para cambiarlo en la app edita una
sola linea en app.js (o index.html):

```js
const SITE_URL='https://mercapp02.netlify.app';   // <-- pon aqui tu dominio real
```

### C) CORRECCION sobre /auth/v1/callback
`/auth/v1/callback` NO vive en Netlify, vive en **Supabase**. La URL de callback
de Google es la de tu proyecto Supabase, NO la de Netlify:

    https://mohbirhrtbgilwtuxdcu.supabase.co/auth/v1/callback   <-- esta va en Google Cloud

`https://mercapp02.netlify.app/auth/v1/callback` NO es valida (esa ruta no existe en Netlify).

### D) Pasos para activar Google
1) Google Cloud Console -> APIs y servicios -> Credenciales ->
   "ID de cliente de OAuth" (tipo: aplicacion web).
   - Origenes autorizados de JavaScript:
       https://mohbirhrtbgilwtuxdcu.supabase.co
       https://TU-DOMINIO.netlify.app
   - URIs de redireccionamiento autorizados:
       https://mohbirhrtbgilwtuxdcu.supabase.co/auth/v1/callback
   Copia el Client ID y el Client Secret.

2) Supabase -> Authentication -> Providers -> Google:
   pega Client ID y Client Secret. Activar. Guardar.

3) Supabase -> Authentication -> URL Configuration:
   - Site URL:      https://TU-DOMINIO.netlify.app
   - Redirect URLs (agrega):
       https://TU-DOMINIO.netlify.app
       https://TU-DOMINIO.netlify.app/dashboard.html
       https://TU-DOMINIO.netlify.app/reset.html

### E) Flujo despues del login
- Con Google, Supabase redirige directo a **dashboard.html**, que muestra el
  mensaje de bienvenida con el email + rol y un boton para cerrar sesion.
- dashboard.html: si NO hay sesion, te envia de vuelta a index.html (el login).
- (La app index.html tambien detecta la sesion con onAuthStateChange y crea el
  perfil; no fuerzo el salto a dashboard desde index para no sacarte de la app.)

### Nota
No puedo ejecutar este SQL ni tocar la config de Auth/Google desde aqui (acceso
de solo lectura a tu proyecto). Estos pasos los haces tu en el panel.

---

## Login con Google para Cliente y Vendedor

La pantalla de inicio de sesión tiene dos botones de rol (🛍️ Cliente / 🏪 Vendedor).
El rol elegido **antes** de pulsar "Continuar con Google" decide cómo entra el usuario:

- **Cliente:** se crea/actualiza su perfil en `profiles` (rol `cliente`) y entra como comprador.
- **Vendedor:** al volver de Google se le crea (o recupera) automáticamente su mercado
  en la tabla `mercados`, vinculado a su cuenta con `owner_id`, y se le asigna un
  `vendor_id` nuevo (el mayor existente + 1). Luego entra directo a su tienda.

Detalle técnico: antes de redirigir a Google se guarda la intención en
`localStorage` (`mercapp_oauth_role`). Al regresar, `applySupaUser` lee ese valor:
si es `vendedor`, llama a `ensureVendorForUser`; si no, entra como cliente.

> Nota: cada vendedor nuevo con Google genera una tienda vacía. Para una demo está
> bien. Si más adelante quieres aprobar manualmente quién puede ser vendedor,
> conviene añadir una lista/tabla de aprobación.
