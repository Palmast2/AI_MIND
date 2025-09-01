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


Teniendo la base de datos cuando mandes un mensaje en /chat se guardara en la db