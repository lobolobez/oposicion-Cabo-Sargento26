# 📚 App de Estudio - Oposiciones SEPEI (Cabo y Sargento)

Aplicación web para preparar las oposiciones de Cabo y Sargento del SEPEI (Servicio de Prevención y Extinción de Incendios).

## 🚀 Cómo usar la aplicación

1. **Abrir la aplicación**: Haz doble clic en el archivo `index.html` o ábrelo con tu navegador web favorito.

2. **Seleccionar oposición**: Elige entre CABO o SARGENTO según la oposición que estés preparando.

3. **Elegir modo de estudio**:
   - **Modo Batería**: Preguntas continuas para repasar sin límite de tiempo. Ideal para estudiar y memorizar.
   - **Modo Examen**: Simulacro con 60 preguntas aleatorias, con opción de temporizador.

## ✨ Características

### Modo Batería
- ✅ Preguntas continuas sin límite
- ✅ Respuestas inmediatas con explicación
- ✅ Filtro por temas
- ✅ Progreso guardado automáticamente
- ✅ Navegación libre entre preguntas

### Modo Examen
- ✅ 60 preguntas aleatorias (como en el examen real)
- ✅ Temporizador configurable (por defecto 90 minutos)
- ✅ Opción de mezclar preguntas y respuestas
- ✅ Marcador de preguntas para revisar
- ✅ Navegador visual de todas las preguntas
- ✅ Puntuación según criterio oficial (+1 acierto, -0.25 error)
- ✅ Revisión completa de errores al finalizar

### General
- 📊 Estadísticas de progreso
- 💾 Guardado automático en el navegador
- 📱 Diseño responsive (funciona en móvil y tablet)
- 🎨 Interfaz moderna y fácil de usar

## 📝 Cómo añadir más preguntas

Las preguntas están en los archivos:
- `js/questions-cabo.js` - Preguntas para la oposición de Cabo
- `js/questions-sargento.js` - Preguntas para la oposición de Sargento

### Formato de las preguntas

```javascript
{
    id: 101,  // Número único
    topic: "Nombre del Tema",  // Tema para el filtro
    question: "¿Texto de la pregunta?",
    answers: [
        "Opción A",
        "Opción B", 
        "Opción C",
        "Opción D"
    ],
    correct: 0,  // Índice de la respuesta correcta (0=A, 1=B, 2=C, 3=D)
    explanation: "Explicación de por qué es correcta esta respuesta"
}
```

### Consejos para añadir preguntas

1. Mantén el formato exacto de las preguntas existentes
2. Usa un `id` único para cada pregunta
3. Agrupa las preguntas por temas para facilitar el filtrado
4. Incluye siempre una explicación de la respuesta correcta
5. Revisa que el índice `correct` apunte a la respuesta correcta (0-3)

## 📁 Estructura de archivos

```
App_Estudio_SEPEI/
├── index.html          # Página principal
├── css/
│   └── styles.css      # Estilos de la aplicación
├── js/
│   ├── app.js          # Lógica de la aplicación
│   ├── questions-cabo.js      # Preguntas de Cabo
│   └── questions-sargento.js  # Preguntas de Sargento
└── README.md           # Este archivo
```

## 🔧 Requisitos técnicos

- Navegador web moderno (Chrome, Firefox, Edge, Safari)
- No requiere conexión a internet (excepto para los iconos)
- No requiere instalación

## 📊 Sistema de puntuación (Modo Examen)

- **Acierto**: +1 punto
- **Error**: -0.25 puntos
- **En blanco**: 0 puntos
- **Aprobado**: 50% o más de la puntuación máxima

## 💡 Sugerencias de uso

1. **Estudio inicial**: Usa el Modo Batería para familiarizarte con las preguntas
2. **Repaso por temas**: Filtra las preguntas por tema para reforzar áreas débiles
3. **Simulacros**: Realiza exámenes completos en Modo Examen periódicamente
4. **Revisión de errores**: Después de cada examen, revisa todas las preguntas fallidas
5. **Progresión**: Intenta mejorar tu puntuación en cada simulacro

## 🆘 Solución de problemas

### El progreso no se guarda
- Asegúrate de que tu navegador permite almacenamiento local (localStorage)
- No uses el modo incógnito/privado si quieres guardar el progreso

### Las preguntas no cargan
- Verifica que los archivos JavaScript estén en la carpeta correcta
- Revisa que el formato de las preguntas sea correcto

### La aplicación se ve mal
- Actualiza tu navegador a la última versión
- Limpia la caché del navegador

## 📜 Licencia

Esta aplicación es de uso personal para la preparación de oposiciones.

---

¡Mucha suerte en tu oposición! 🍀🚒
