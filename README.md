# MercApp

Marketplace de mercado de barrio que conecta a **clientes** con **vendedores** cercanos (radio de 2.5 km). Aplicación web de una sola página (HTML + CSS + JavaScript, sin frameworks), pensada para desplegarse en **Netlify** u otro hosting estático.

## Archivos

| Archivo | Descripción |
|---|---|
| `index.html` | Estructura de la página. Enlaza a `styles.css` y `app.js`. |
| `styles.css` | Todos los estilos (incluye imágenes de fondo embebidas en base64). |
| `app.js` | Toda la lógica de la aplicación (vistas, carrito, pagos, mapa, ventas, etc.). |
| `README.md` | Este archivo. |

> Los tres archivos deben estar **en la misma carpeta**. `index.html` busca `styles.css` y `app.js` por ruta relativa.

## Cómo probarlo localmente

Por seguridad del navegador, algunas funciones (geolocalización, descargas, QR) requieren servir los archivos por HTTP, no abrir el HTML con doble clic.

Opción rápida con Python:

```bash
cd carpeta_del_proyecto
python3 -m http.server 8000
# abre http://localhost:8000
```

## Cómo publicarlo en Netlify

1. Entra a Netlify → **Add new site → Deploy manually**.
2. Arrastra la carpeta que contiene `index.html`, `styles.css` y `app.js`.
3. Netlify te da una URL `https://...netlify.app` con **HTTPS** (necesario para geolocalización y cámara).

## Credenciales de prueba

**Cliente**
- Usuario: `789789@mercapp.com` · Contraseña: `789789`
- Administrador (modo cliente, con editor de colores): `456456@mercapp.com` · `456456`

**Vendedor** (perfil propio de cada tienda)
- `123123@mercapp.com` · `123123`
- `789789@mercapp.com` · `789789`
- `456456@mercapp.com` · `456456`
- `321321@mercapp.com` · `321321`

> En el inicio de sesión, selecciona el rol (Cliente / Vendedor) antes de ingresar.

## Funcionalidades principales

**Cliente**
- Catálogo por **16 categorías**, búsqueda y orden (A–Z, Precio, agrupar por categorías).
- Mapa con geolocalización en tiempo real y mercados a 2.5 km.
- Carrito con **IGV (18%)**, modos **Delivery** / **Recojo en tienda** y validación de datos.
- Pago con **Yape** (QR) y **boleta de venta** descargable con **código QR** que abre la boleta en línea.
- **Mis pedidos** con opción **Ver boleta** (requiere iniciar sesión).

**Vendedor**
- Perfil/tienda editable, publicación de productos y ubicación del mercado en el mapa.
- **Mensajes** y **Llamadas** con clientes.
- Módulo **Ventas**: dashboard por mes, ticket por producto y **ticket de cierre de caja** (subtotal, IGV = 0, total, estado de caja).

**General**
- Modo claro/oscuro, diseño responsive (PC, Android, iOS), fondos por rol.

## Notas técnicas

- **Persistencia**: los datos (cuentas, pedidos, tema) se guardan en `localStorage` del navegador. No hay backend; para sincronizar entre dispositivos se puede integrar **Supabase** (hay andamiaje preparado en el código).
- **Pagos**: la verificación de Yape es manual/simbólica (sin pasarela real). Para cobros verificables se recomienda una pasarela peruana (Culqi, Mercado Pago).
- **Mapa**: usa Leaflet (se carga desde CDN). La geolocalización requiere **HTTPS**.
- **QR**: el generador se carga desde CDN al vuelo; los datos se procesan en el navegador.
- Las cifras del módulo de **Ventas** son simuladas de forma estable hasta conectar ventas reales.

---
Hecho para MercApp — Lima, Perú.
