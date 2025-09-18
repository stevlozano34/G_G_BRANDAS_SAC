// Esperar a que el documento esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // Obtener el formulario por su ID
    const form = document.getElementById('solicitarForm');
    
    // Si el formulario existe
    if (form) {
        // Agregar evento de envío al formulario
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Obtener valores del formulario con validaciones
            const nombre = document.getElementById('nombre')?.value.trim() || '';
            const email = document.getElementById('email')?.value.trim() || '';
            const telefono = document.getElementById('telefono')?.value.trim() || '';
            const servicioSelect = document.getElementById('servicio');
            const servicioTexto = servicioSelect?.options[servicioSelect?.selectedIndex]?.text || 'No especificado';
            const mensaje = document.getElementById('mensaje')?.value.trim() || 'No se proporcionó mensaje';
            
            // Validar campos obligatorios
            if (!nombre || !email || !telefono) {
                alert('Por favor complete los campos obligatorios: Nombre, Email y Teléfono.');
                return;
            }
            
            // Formatear el mensaje para WhatsApp
            const message = `¡Hola! Estoy interesado en sus servicios.\n\n` +
                          `*Nombre Completo:* ${nombre}\n` +
                          `*Correo Electrónico:* ${email}\n` +
                          `*Teléfono:* ${telefono}\n` +
                          `*Servicio de Interés:* ${servicioTexto}\n` +
                          `*Mensaje:* ${mensaje}`;
            
            // Codificar el mensaje para la URL
            const encodedMessage = encodeURIComponent(message);
            
            // Número de WhatsApp (usando el número del botón flotante de WhatsApp)
            const phoneNumber = '51948181248';
            
            // Abrir WhatsApp con el mensaje en una nueva pestaña
            window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
            
            // Cerrar el modal (si existe)
            const modal = document.querySelector('.modal2');
            if (modal) {
                modal.style.display = 'none';
            }
            
            // Reiniciar el formulario
            form.reset();
        });
    }
});
