# 🔐 Configuración de Secretos - TiendaOnline

## ⚠️ IMPORTANTE: Configuración Local

Para que la aplicación funcione correctamente en tu máquina local, necesitas configurar tus claves secretas.

### 📝 Pasos de Configuración

1. **Las claves reales ya están en**: `appsettings.Development.json`
   - Este archivo NO se sube a GitHub (está en .gitignore)
   - Ya contiene tus claves de Stripe, Meilisearch, etc.

2. **El archivo `appsettings.json`** contiene valores de ejemplo
   - Es seguro para GitHub
   - Otros desarrolladores deben reemplazar con sus propias claves

### 🔑 Claves Necesarias

#### Stripe (Requerido para pagos)
```json
"Stripe": {
  "PublicKey": "pk_test_...",
  "SecretKey": "sk_test_..."
}
```
Obtén tus claves en: https://dashboard.stripe.com/test/apikeys

#### Meilisearch (Búsqueda)
```json
"Meilisearch": {
  "ServerUrl": "http://localhost:7700",
  "MasterKey": "tu-master-key-aqui"
}
```

#### Base de Datos
```json
"ConnectionStrings": {
  "DefaultConnection": "Data Source=localhost,1434;Initial Catalog=EcommercePro;User Id=SA;Password=TuPassword;TrustServerCertificate=True;"
}
```

#### JWT
```json
"Jwt": {
  "SecretKey": "minimo-32-caracteres-para-seguridad-jwt",
  "Issuer": "TiendaOnline.Server",
  "Audience": "TiendaOnline.Client",
  "ExpireDays": 1
}
```

### ✅ Verificación

La aplicación usará automáticamente:
- `appsettings.Development.json` en modo Development (local)
- `appsettings.json` como fallback

### 🚀 Para Otros Desarrolladores

Si clonas este proyecto:

1. Copia `appsettings.json` a `appsettings.Development.json`
2. Reemplaza los valores de ejemplo con tus propias claves
3. Nunca commites `appsettings.Development.json` (ya está en .gitignore)

### 📚 Documentación de APIs

- [Stripe API Keys](https://stripe.com/docs/keys)
- [Stripe Connect Setup](https://dashboard.stripe.com/settings/connect)
- [Meilisearch](https://www.meilisearch.com/docs)

---

**Nota**: Tus claves reales ya están configuradas y listas para usar. Este cambio solo protege tus secretos de ser expuestos en GitHub.

