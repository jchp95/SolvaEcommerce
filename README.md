# TiendaOnline

Este repositorio contiene dos proyectos principales:

- **tiendaonline.client/**: Aplicación frontend en React (Vite).
- **TiendaOnline.Server/**: API backend en ASP.NET Core Web API.

## Estructura

```
TiendaOnline.sln
TiendaOnline.Server/        # Backend ASP.NET Core
    ...
tiendaonline.client/        # Frontend React
    ...
```

## Cómo ejecutar localmente

### Backend (ASP.NET Core)

1. Ve a la carpeta `TiendaOnline.Server`.
2. Ejecuta:
   ```sh
   dotnet run
   ```

### Frontend (React)

1. Ve a la carpeta `tiendaonline.client`.
2. Instala dependencias:
   ```sh
   npm install
   ```
3. Ejecuta la app:
   ```sh
   npm run dev
   ```

## Notas
- Configura las variables de entorno necesarias en ambos proyectos.
- El archivo `.gitignore` está preparado para ignorar archivos innecesarios de ambos entornos.
