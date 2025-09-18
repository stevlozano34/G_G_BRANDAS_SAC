# Sistema de Envío de Emails - Grupo Global Brands

## Descripción

Este sistema maneja el envío de emails desde el formulario de contacto del sitio web. Está diseñado para funcionar tanto en entornos locales como en servidores de producción con restricciones.

## Cómo funciona

1. **Formulario HTML** - El formulario en `index.html` captura los datos del usuario
2. **JavaScript** - Interceptar el envío del formulario y enviar los datos mediante AJAX
3. **PHP Handler** - El script `enviar.php` procesa los datos y envía emails

## Métodos de envío (en orden de prioridad)

1. **PHPMailer con SMTP de Gmail** - Método principal
2. **Función mail() de PHP** - Fallback si SMTP falla
3. **Almacenamiento local** - Último recurso si ambos métodos anteriores fallan

## Archivos importantes

- `enviar.php` - Script principal de procesamiento
- `src/` - Directorio con archivos de PHPMailer
- `contactos_backup.json` - Archivo de respaldo para mensajes cuando el envío falla
- `mensajes_recibidos.log` - Log de todos los mensajes recibidos

## Solución de problemas

### Si los emails no llegan en producción:

1. **Verificar PHPMailer**: Asegúrate de que los archivos en `src/` existen
2. **Verificar función mail()**: Algunos servidores compartidos deshabilitan esta función
3. **Revisar archivos de respaldo**: Los mensajes se guardan en `contactos_backup.json`

### Credenciales de Gmail

Las credenciales están configuradas en el script `enviar.php`:
- Usuario: `grupoblogalbrandsperu@gmail.com`
- Contraseña: (almacenada en el script)

## Notas importantes

- El sistema funciona incluso si el envío automático de emails falla
- Todos los mensajes se registran en archivos de respaldo
- Los usuarios reciben confirmación de que su mensaje fue recibido
- El equipo puede revisar manualmente los mensajes en `contactos_backup.json`