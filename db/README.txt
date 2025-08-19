postgres (PostgreSQL) 17.5
https://www.enterprisedb.com/downloads/postgres-postgresql-downloads

postgrest-v13.0.2-windows-x86-64
https://github.com/PostgREST/postgrest/releases


Estructura del Proyecto:
AI_MIND/
└── db/
    ├── init.sql            # Script para crear todas las tablas y extensiones
    ├── postgrest.conf      # Archivo de configuración de PostgREST
    └── postgrest.exe       # Ejecutable de PostgREST


antes de eso el postrest tienes que instalarlo y tambien agregar el path
del postgrest al sistema de tu pc

ya ahora si con esa estructura y con las credenciales
Ejecuta el script init.sql dentro de la base ia_mind_db para crear todas las tablas:
\i path/a/AI_MIND/db/init.sql

y corres el servidor:
cd AI_MIND/db
.\postgrest.exe postgrest.conf
se veria el comando asi
