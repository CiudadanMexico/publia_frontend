# Procedimiento reproducible de preview / staging — PUBLIA 6.0

Producción `publia.mx` **nunca** se toca desde aquí. Todo preview sale de la rama `feature/publia-6-frontend`.

## Build

```bash
cd publia-frontend
git checkout feature/publia-6-frontend && git pull github feature/publia-6-frontend
npm ci
npm test                 # unitarios (node:test vía esbuild)
npx tsc --noEmit         # tipos
npm run build            # genera dist/
```

## Servir dist localmente

```bash
node scripts/serve-dist.mjs --port 4322 --host 127.0.0.1 --root dist
# → http://127.0.0.1:4322
```

## Exponer por túnel (URL efímera quick tunnel)

```bash
setsid nohup cloudflared tunnel --url http://127.0.0.1:4322 --no-autoupdate > /tmp/cf-staging.log 2>&1 &
grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' /tmp/cf-staging.log | head -1
```

> `/tmp` se limpia periódicamente en este host: si la URL responde `ERR`/000, relanzar los dos comandos con `setsid nohup` y leer la URL nueva del log.

## QA sobre el preview

```bash
QA_BASE=<URL-del-tunel> PLAYWRIGHT_BROWSERS_PATH=/home/dsh-dany/workspace/sprint-recorder/browsers \
LD_LIBRARY_PATH=/home/dsh-dany/workspace/.browser-libs/usr/lib/aarch64-linux-gnu:/home/dsh-dany/workspace/.browser-libs/usr/lib/x86_64-linux-gnu \
node scripts/qa.mjs
```

## Bandeja de carga (recibir paquetes como A08/A06)

Servidor local con token en `.tmp/upload-inbox/.token` (gitignored), expuesto igual con cloudflared en el puerto 4323:

```bash
node .tmp/upload-server.mjs            # POST /up/<token> guarda en .tmp/upload-inbox/
setsid nohup cloudflared tunnel --url http://127.0.0.1:4323 --no-autoupdate > /tmp/cf-up.log 2>&1 &
# URL: https://<host>.trycloudflare.com/up/<token>
```

## Staging vigente en este bloque

- Build servido: rama `feature/publia-6-frontend`, HEAD del bloque 7M-D (ver `git log -1`).
- URL vigente: `https://dam-boulevard-explaining-alaska.trycloudflare.com` (200 OK al entregar 7M-D).
- Host principal temporal-3 (159.54.133.219) sigue inalcanzable; al recuperarse, repetir el mismo procedimiento ahí (puerto documentado en inventario) y actualizar esta línea.

## Reglas

- Público = repo en GitHub: sin secretos, sin `.tmp/`, sin videos temporales (`docs/audit/video/` está gitignored pero se conserva en disco como evidencia).
- Un solo commit por corrección; no reescribir historial público.
