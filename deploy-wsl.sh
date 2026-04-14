#!/bin/bash

# ==========================================
# Configuración del Despliegue (¡MODIFICA ESTO!)
# ==========================================
# Reemplaza con el correo de tu otra cuenta de Google
GOOGLE_ACCOUNT="123.tytyaa@gmail.com" 

# Reemplaza con el ID de tu proyecto en Google Cloud (no el nombre)
PROJECT_ID="microservicio-471115"            

# Región de Google Cloud
REGION="us-central1"                      

# Nombre de la aplicación en Cloud Run
SERVICE_NAME="lumen"                 
# ==========================================

echo "============================================"
echo "🚀 Iniciando despliegue de $SERVICE_NAME a Cloud Run"
echo "============================================"

# 1. Autenticación con la cuenta específica
echo "🔑 Paso 1: Autenticando con la cuenta de Google..."
echo "Te pedirá iniciar sesión. Si estás en WSL, abrirá tu navegador o te dará un link para copiar/pegar."
gcloud auth login $GOOGLE_ACCOUNT --no-launch-browser

# 2. Configuración de Gcloud
echo "⚙️ Paso 2: Configurando el proyecto..."
gcloud config set account $GOOGLE_ACCOUNT
gcloud config set project $PROJECT_ID

# 3. Despliegue
echo "☁️ Paso 3: Construyendo y desplegando en un solo paso..."
echo "Esto tomará varios minutos ya que construirá el proyecto usando Cloud Build."

# Usamos --source . para que Google Cloud arme automáticamente 
# la imagen Docker de tu proyecto Next.js y lo suba a Cloud Run
gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION \
  --port 3000 \
  --allow-unauthenticated

echo "============================================"
echo "✅ ¡Proceso completado!"
echo "Tu aplicación debería estar disponible en la URL de arriba."
echo "============================================"
