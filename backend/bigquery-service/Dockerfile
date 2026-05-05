# Usa la imagen oficial de Node.js ligera
FROM node:22-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json ./

# Instalar dependencias
RUN npm install --production

# Copiar el código del servicio
COPY index.js ./
COPY bigquery.js ./

# Variables de entorno y puerto de exposición
ENV PORT=8081
EXPOSE 8081

# Comando para iniciar el microservicio
CMD ["npm", "start"]
