# App Movil con Capacitor

Este proyecto ya esta preparado para generar apps nativas con Capacitor usando la app web de `public/`.

## Comandos

```bash
npm run build
npm run mobile:sync
```

Android:

```bash
npm run mobile:android
```

iOS:

```bash
npm run mobile:ios
```

## Requisitos

- Android requiere Android Studio, Android SDK y `ANDROID_HOME` configurado.
- iOS requiere macOS con Xcode.
- Despues de cambiar archivos web, ejecutar `npm run mobile:sync` para copiar los cambios a `android/` e `ios/`.

## Backend

La app movil usa `https://clusterag.vercel.app` como backend desde `app-config.js`. Si cambia el dominio de produccion, actualizar `window.__cluster_api_base_url`.
