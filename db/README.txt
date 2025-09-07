postgres (PostgreSQL) 17.5
https://www.enterprisedb.com/downloads/postgres-postgresql-downloads



Estructura del Proyecto:
AI_MIND/
└── db/
    ├── init.sql            # Script para crear todas las tablas y extensiones
    ├── chat.sql            # Script para modificacion de la tabla mensajes
    ├── directrices.sql            # Script de advertencias, estrategias.
    

Consideraciones:
pip install markdown
pip install openai
pip install reportlab
PostgresSQL 17.5
pgcrypto 1.3


Teniendo la base de datos cuando mandes un mensaje en /chat se guardara en la db y tambien en algunos casos 
extremos se guardan algunos mensajes del usuario en eventos criticos

Para poder usar los reportes deberia de verse la ruta asi:
ejem: /api/v1/pdf/{user_id}/2025/8
ejem: /api/v1/meses/{user_id}