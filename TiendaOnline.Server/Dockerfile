# Dockerfile multi-stage para TiendaOnline.Server (NET 9)
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Instalar Node.js (LTS 18) y herramientas necesarias para compilar el SPA
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl gnupg2 lsb-release \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && node --version \
    && npm --version \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copiar csproj(s) y restaurar dependencias
COPY ["TiendaOnline.Server/TiendaOnline.Server.csproj", "TiendaOnline.Server/"]
COPY ["tiendaonline.client/tiendaonline.client.esproj", "tiendaonline.client/"]
RUN dotnet restore "TiendaOnline.Server/TiendaOnline.Server.csproj"

# Copiar todo el repo y publicar
COPY . .
WORKDIR /src/TiendaOnline.Server
RUN dotnet publish "TiendaOnline.Server.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# Exponer puerto 80 y forzar a escuchar en 0.0.0.0
ENV ASPNETCORE_URLS=http://+:80
EXPOSE 80

# Copiar la publicación
COPY --from=build /app/publish .

# Copiar script de espera para la BD (opcional, mejora robustez al arrancar en Render)
# El script se creó en deploy/wait-for-db.sh en el repo
COPY deploy/wait-for-db.sh /app/wait-for-db.sh
RUN chmod +x /app/wait-for-db.sh

# Por defecto, el script esperará por tiendaonline-mssql:1433 (puedes ajustar con DB_HOST/DB_PORT env vars)
ENTRYPOINT ["/app/wait-for-db.sh"]
