# Weather API

API REST para obtener información meteorológica en tiempo real, construida con **NestJS** y **TypeScript**. Permite consultar el clima por ciudad y obtener datos detallados de temperatura, humedad, viento y condiciones atmosféricas.

## 🚀 Tecnologías

- Node.js
- NestJS
- TypeScript
- Axios (para consumo de APIs externas)
- Redis (para cache y mejora de rendimiento)
- ESLint (para mantener calidad y consistencia de código)

## 📝 Features

### ✅ Actualmente implementadas
- Consulta de clima actual por ciudad.
- Integración con APIs externas de datos meteorológicos.
- Cache de resultados usando Redis para optimizar tiempos de respuesta.
- Respuesta con datos relevantes: temperatura, humedad, velocidad del viento, descripción del clima.
- Manejo de errores y validaciones básicas de entrada.

### 🔜 Próximas / En desarrollo
- Pronóstico del clima por 7 días.
- Autenticación para usuarios premium (con limitaciones de uso gratuitas).
- Endpoint de búsqueda por coordenadas geográficas.
- Documentación automática de la API con Swagger.

## ⚡ Instalación

git clone https://github.com/gusgarozzo/weather_api.git
cd weather_api
npm install
npm run start:dev


## 📖 Documentación (Swagger)

La API cuenta con documentación interactiva usando **Swagger**.  
Una vez que la aplicación esté corriendo, podés acceder a ella en:

http://localhost:3000/api/swagger (Esta es una URL temporal mientras la API se encuentra en desarrollo y aún no ha sido desplegada en un servidor).

Allí podés explorar todos los endpoints disponibles, probar consultas y ver los modelos de respuesta.  
El título de la documentación es **Weather API Documentation**.


