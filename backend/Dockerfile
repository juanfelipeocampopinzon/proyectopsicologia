# Usa la imagen oficial de Node.js ligera
FROM node:22-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json ./

# Instalar dependencias
RUN npm install --production

# Copiar el código del servidor
COPY index.js ./

# Variables de entorno y puerto de exposición
ENV PORT=8080
EXPOSE 8080

# Comando para iniciar el microservicio
CMD ["npm", "start"]
