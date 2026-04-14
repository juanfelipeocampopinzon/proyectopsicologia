# Guia de Imagenes - LUMEN

## Estructura de Carpetas

Crea las siguientes carpetas en `/public/images/`:

```
public/
  images/
    professionals/    <- Fotos de profesionales
    resources/        <- Thumbnails de recursos (opcional)
    avatars/          <- Avatares de usuarios (opcional)
```

## Imagenes Necesarias

### 1. Profesionales (`/images/professionals/`)

| Archivo | Dimensiones | Descripcion |
|---------|-------------|-------------|
| maria-gonzalez.jpg | 400x400px | Dra. Maria Gonzalez - Ansiedad y Estres |
| carlos-ramirez.jpg | 400x400px | Dr. Carlos Ramirez - Depresion y Duelo |
| ana-torres.jpg | 400x400px | Lic. Ana Torres - Autoestima |
| luis-mendoza.jpg | 400x400px | Dr. Luis Mendoza - Terapia de Pareja |
| patricia-vega.jpg | 400x400px | Dra. Patricia Vega - Trauma y PTSD |
| roberto-silva.jpg | 400x400px | Lic. Roberto Silva - Adicciones |

**Notas:**
- Fotos profesionales con fondo neutro
- Expresion amigable y accesible
- Buena iluminacion
- Formato cuadrado (1:1)

### 2. Recursos (Opcional) (`/images/resources/`)

| Archivo | Dimensiones | Descripcion |
|---------|-------------|-------------|
| featured-meditation.jpg | 800x600px | Imagen destacada de meditacion |

**Nota:** El nuevo diseno usa iconos con gradientes coloridos en lugar de fotos para los recursos. Solo necesitas agregar imagenes si deseas personalizar el contenido destacado.

### 3. Avatares (Opcional) (`/images/avatars/`)

| Archivo | Dimensiones | Descripcion |
|---------|-------------|-------------|
| user-1.jpg | 80x80px | Avatar usuario 1 |
| user-2.jpg | 80x80px | Avatar usuario 2 |
| user-3.jpg | 80x80px | Avatar usuario 3 |
| user-4.jpg | 80x80px | Avatar usuario 4 |

## Como Agregar las Imagenes

1. Crea las carpetas necesarias en `/public/images/`
2. Agrega tus imagenes con los nombres exactos indicados
3. Las imagenes apareceran automaticamente en la aplicacion

## Fallbacks del Nuevo Diseno

El nuevo diseno incluye fallbacks elegantes:
- **Profesionales**: Muestra la inicial del apellido con gradiente
- **Recursos**: Usa iconos con fondos de gradiente colorido
- **Avatares**: Muestra circulos con gradiente

Esto significa que la app se ve completa incluso sin imagenes personalizadas.

## Formatos Recomendados

- **JPG**: Para fotos de personas
- **PNG**: Para imagenes con transparencia
- **WebP**: Para mejor compresion (opcional)

## Optimizacion

Para mejor rendimiento:
- Comprime las imagenes sin perder calidad
- Usa herramientas como TinyPNG o Squoosh
- Tamano maximo recomendado: 300KB por imagen
