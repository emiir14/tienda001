
# Guía de Implementación: Calculadora de Envíos de Correo Argentino

Este documento explica los pasos necesarios para activar y configurar la integración con la API de Correo Argentino para el cálculo de costos de envío.

## Requisitos Previos

1.  **Cuenta en Correo Argentino:** Debes tener una cuenta de cliente con Correo Argentino que te dé acceso a sus servicios de API.
2.  **Credenciales de API:** Necesitarás obtener un **API Key** o un **Token de Acceso** para autenticar tus solicitudes.

## Pasos para la Configuración

### 1. Obtener Credenciales de la API

Actualmente, Correo Argentino utiliza un sistema llamado **MiCorreo** para la gestión de envíos y la integración. Deberás seguir estos pasos (sujetos a cambios por parte de Correo Argentino):

1.  **Regístrate en MiCorreo:** Ingresa al portal de [MiCorreo](https://www.correoargentino.com.ar/micorreo) y crea una cuenta de empresa.
2.  **Contacta a Soporte Técnico/Comercial:** Es muy probable que necesites contactar al equipo de soporte o a tu representante comercial de Correo Argentino para solicitar el acceso a la API de cálculo de costos ("tarifador").
3.  **Recibe tu API Key:** El equipo de Correo Argentino te proporcionará el API Key, la URL del endpoint y la documentación técnica detallada de la API que este sistema espera.

### 2. Configurar Variables de Entorno

Una vez que tengas tu API Key, debes agregarla a tu archivo `.env.local`. Si no tienes este archivo, puedes duplicar `.env.example` y renombrarlo.

Abre tu archivo `.env.local` y agrega las siguientes variables:

```bash
# ===============================================
# CORREO ARGENTINO - CONFIGURACIÓN DE ENVÍOS
# ===============================================

# Tu API Key/Token proveído por Correo Argentino.
# Se mantiene en el backend por seguridad.
CORREO_ARGENTINO_API_KEY="TU_API_KEY_AQUI"

# El código postal de origen desde donde se realizan los envíos.
# Este es el CP de tu tienda o depósito.
NEXT_PUBLIC_ORIGIN_POSTAL_CODE="1425" # Ejemplo: Palermo, CABA

# El peso por defecto del paquete en kilogramos (kg).
# Dado que se venden joyas, un peso bajo como 0.5 kg es un buen default.
DEFAULT_PACKAGE_WEIGHT_KG="0.5"
```

### 3. Reiniciar el Servidor

Después de modificar el archivo `.env.local`, es **crucial** que reinicies tu servidor de desarrollo para que las nuevas variables de entorno sean cargadas correctamente.

```bash
npm run dev
# o
yarn dev
```

### 4. Verificar la Implementación

Una vez reiniciado, el sistema estará listo.
1.  Navega a la página de cualquier producto.
2.  Utiliza el componente "Calcula tu envío" introduciendo un código postal de destino.
3.  El sistema debería mostrar el costo de envío calculado por la API de Correo Argentino.
4.  El costo de envío se agregará automáticamente al total de la compra en el carrito y en la página de checkout.

Con estos pasos, la integración estará completa y funcionando.
