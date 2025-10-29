# Dockerfile para SQL Server (Linux) - basado en la imagen oficial
FROM mcr.microsoft.com/mssql/server:2022-latest

# Variables obligatorias para la imagen oficial
ENV ACCEPT_EULA=Y
ENV SA_PASSWORD=MyStrongPass123

EXPOSE 1433

# Ejecutar SQL Server
CMD ["/opt/mssql/bin/sqlservr"]

