para levantar el back hay que estar en la carpeta backend/
y crear un entorno virtual con venv (Version de python 3.8^)
una vez activado el entorno virtual ejectuar:
pip install -r requirements.txt
para que se installe todo lo necesario para hacer funcionar el backend y utilizarlo.
La documentación de como puedes interactuar con los endpoints se encuentran en:
http://127.0.0.1:8000/docs#/ (el local que aparece al ejecutar el comando para levantar el servidor virtual de desarrollo: uvicorn app.main:app --reload)

Sobre el .env:
-se ha agregado un example sobre como configurar el .env, esta configuracion es necesaria para poder utilizar los endpoints y la conexion a bases de datos.
-El archivo .env.example se explica a si mismo.
-Para dudas sobre como consumir los endpoints del backend api consultar la documentacion posterior a levantar el servidor virtual de uvicorn:http://127.0.0.1:8000/docs#/ (explicado en pasos anteriores).

Para produccion:
postgresSQL 17^
