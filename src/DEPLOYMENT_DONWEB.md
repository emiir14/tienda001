# Guía de Despliegue en un VPS de Don Web

Esta guía te mostrará cómo desplegar múltiples instancias de esta aplicación de e-commerce en un único VPS de Don Web. Cada tienda tendrá su propio dominio (o subdominio), su propia base de datos PostgreSQL y se ejecutará en un puerto diferente, gestionado por un proxy inverso (Nginx).

---

### Requisitos Previos

*   Un VPS contratado en Don Web (se recomienda Ubuntu 22.04 o superior).
*   Acceso SSH a tu VPS.
*   Dominios o subdominios para cada tienda apuntando a la IP de tu VPS.

---

## Parte 1: Configuración Inicial del Servidor

Estos pasos solo necesitas hacerlos una vez en tu VPS.

#### 1. Conéctate a tu VPS por SSH
```bash
ssh tu_usuario@direccion_ip_de_tu_vps
```

#### 2. Actualiza tu Servidor
```bash
sudo apt update && sudo apt upgrade -y
```

#### 3. Instala Node.js y npm
Usaremos `nvm` (Node Version Manager) para instalar y gestionar versiones de Node.js, ya que es más flexible.

```bash
# Instala curl para descargar nvm
sudo apt install curl -y

# Descarga e instala nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Carga nvm en la sesión actual
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Instala la versión LTS (Long-Term Support) de Node.js
nvm install --lts

# Verifica la instalación
node -v  # Debería mostrar una versión como v20.x.x
npm -v   # Debería mostrar una versión como 10.x.x
```

#### 4. Instala PostgreSQL
```bash
sudo apt install postgresql postgresql-contrib -y

# Inicia sesión en PostgreSQL para crear usuarios y bases de datos
sudo -i -u postgres
```
Una vez dentro de la consola de PostgreSQL (verás `postgres@...$`), puedes salir con `exit`.

#### 5. Instala Nginx y PM2
*   **Nginx** actuará como un proxy inverso, dirigiendo el tráfico de tus dominios a la aplicación Node.js correcta.
*   **PM2** es un gestor de procesos que mantendrá tus aplicaciones Next.js corriendo constantemente y las reiniciará si fallan.

```bash
# Instala Nginx
sudo apt install nginx -y

# Instala PM2 globalmente con npm
npm install pm2 -g

# Habilita Nginx para que inicie con el sistema
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## Parte 2: Despliegue de una Nueva Tienda

Repite estos pasos para **cada** tienda que quieras añadir a tu VPS.

#### 1. Crea la Base de Datos y el Usuario
Es crucial que cada tienda tenga su propia base de datos aislada.

```bash
# Conéctate como usuario de postgres
sudo -u postgres psql

# Dentro de la consola de psql, ejecuta los siguientes comandos:
# Reemplaza 'nombre_tienda_db' y 'usuario_tienda' con nombres únicos para esta tienda.
# Reemplaza 'contraseña_segura' con una contraseña fuerte.

CREATE DATABASE nombre_tienda_db;
CREATE USER usuario_tienda WITH ENCRYPTED PASSWORD 'contraseña_segura';
GRANT ALL PRIVILEGES ON DATABASE nombre_tienda_db TO usuario_tienda;

# Sal de la consola de psql
\q
```

#### 2. Clona el Proyecto
Crea un directorio para tus tiendas y clona el código fuente desde GitHub.

```bash
# Vuelve a tu usuario normal (si sigues como postgres)
exit

# Crea un directorio para tus proyectos (si no existe)
mkdir -p ~/proyectos

# Navega al directorio y clona tu proyecto
cd ~/proyectos
git clone https://github.com/tu_usuario/tu_repositorio.git nombre_de_la_tienda

# Entra en el directorio de la nueva tienda
cd nombre_de_la_tienda
```

#### 3. Instala Dependencias y Crea el Archivo de Entorno

```bash
# Instala las dependencias del proyecto
npm install

# Crea el archivo de entorno local a partir del ejemplo
cp .env.example .env.local
```

#### 4. Configura las Variables de Entorno
Abre `.env.local` con un editor como `nano`:
```bash
nano .env.local
```
Configura las variables. **Esto es específico para cada tienda.**

```env
# --- BASE DE DATOS (OBLIGATORIO EN PRODUCCIÓN) ---
# Usa los datos que creaste en el paso 1.
POSTGRES_URL="postgres://usuario_tienda:contraseña_segura@localhost:5432/nombre_tienda_db"

# --- CREDENCIALES DE ADMIN (OBLIGATORIO EN PRODUCCIÓN) ---
ADMIN_EMAIL="tu_email_de_admin@dominio.com"
ADMIN_PASSWORD="una_contraseña_muy_segura"

# --- MERCADO PAGO (CREDENCIALES DE PRODUCCIÓN) ---
MERCADOPAGO_ACCESS_TOKEN="TU_ACCESS_TOKEN_DE_PRODUCCION"
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY="TU_PUBLIC_KEY_DE_PRODUCCION"

# --- URL DEL SITIO (¡CRÍTICO PARA PAGOS!) ---
# ¡IMPORTANTE! Usa el dominio final de esta tienda, con https://
NEXT_PUBLIC_SITE_URL="https://tienda1.com"

# --- MAILCHIMP (OPCIONAL) ---
# MAILCHIMP_API_KEY="tu_api_key_de_mailchimp"
# MAILCHIMP_SERVER_PREFIX="usXX"
# MAILCHIMP_AUDIENCE_ID="tu_id_de_audiencia"
```
Guarda el archivo (`Ctrl+X`, luego `Y`, y `Enter`).

#### 5. Ejecuta las Migraciones de la Base de Datos
Copia el contenido del archivo `database.sql` y ejecútalo en la base de datos de tu tienda.

```bash
# Ejecuta el SQL en la base de datos específica de la tienda
sudo -u postgres psql -d nombre_tienda_db < database.sql
```
*Alternativamente, puedes conectarte con `psql` y pegar el contenido manualmente.*

#### 6. Construye y Lanza la Aplicación con PM2
Cada tienda debe correr en un **puerto único**.

```bash
# Construye la aplicación para producción
npm run build

# Lanza la aplicación con PM2
# Reemplaza 'nombre_tienda_app' con un nombre único para PM2.
# Reemplaza '3001' con un puerto único para esta tienda (3002, 3003, etc.).
pm2 start npm --name "nombre_tienda_app" -- start -- -p 3001

# Guarda la lista de procesos de PM2 para que se reinicien con el servidor
pm2 save
```
Puedes ver el estado de tus aplicaciones con `pm2 list`.

---

## Parte 3: Configuración del Proxy Inverso (Nginx)

Este paso conecta tu dominio a la aplicación que está corriendo en un puerto específico.

1.  **Crea un archivo de configuración de Nginx para tu tienda:**
    ```bash
    sudo nano /etc/nginx/sites-available/tienda1.com
    ```

2.  **Pega la siguiente configuración:**
    Reemplaza `tienda1.com` con tu dominio y `3001` con el puerto que elegiste para esta tienda.

    ```nginx
    server {
        listen 80;
        server_name tienda1.com www.tienda1.com;

        location / {
            proxy_pass http://localhost:3001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
    ```
    Guarda y cierra el archivo.

3.  **Activa la configuración y prueba Nginx:**
    ```bash
    # Crea un enlace simbólico para activar el sitio
    sudo ln -s /etc/nginx/sites-available/tienda1.com /etc/nginx/sites-enabled/

    # Prueba la sintaxis de la configuración de Nginx
    sudo nginx -t 
    # Si dice "syntax is ok" y "test is successful", puedes continuar.

    # Recarga Nginx para aplicar los cambios
    sudo systemctl reload nginx
    ```

4.  **Configura SSL con Let's Encrypt (Recomendado):**
    ```bash
    # Instala Certbot, la herramienta para Let's Encrypt
    sudo apt install certbot python3-certbot-nginx -y

    # Solicita un certificado para tu dominio
    sudo certbot --nginx -d tienda1.com -d www.tienda1.com
    ```
    Sigue las instrucciones en pantalla. Certbot modificará tu archivo de Nginx para usar HTTPS y configurará la renovación automática.

¡Y eso es todo! Tu tienda ahora debería estar en línea en `https://tienda1.com`.

---

### Mantenimiento y Actualizaciones

Para actualizar el código de una tienda:
1.  Navega a su directorio: `cd ~/proyectos/nombre_de_la_tienda`
2.  Trae los últimos cambios: `git pull`
3.  Instala nuevas dependencias (si las hay): `npm install`
4.  Re-construye la aplicación: `npm run build`
5.  Reinicia la aplicación con PM2: `pm2 restart nombre_tienda_app`
