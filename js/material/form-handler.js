document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('myModal');
    const form = modal ? modal.querySelector('form') : null;
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const nombre = form.querySelector('input[type="text"]').value;
            const email = form.querySelector('input[type="email"]').value;
            const mensaje = form.querySelector('textarea').value;
            
            // Format the WhatsApp message
            const message = `¡Hola! Estoy interesado en sus servicios.\n\n` +
                          `*Nombre:* ${nombre}\n` +
                          `*Correo:* ${email}\n` +
                          `*Mensaje:* ${mensaje || 'No se proporcionó mensaje'}`;
            
            // Encode the message for URL
            const encodedMessage = encodeURIComponent(message);
            
            // WhatsApp number
            const phoneNumber = '916895252';
            
            // Open WhatsApp with the message
            window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
            
            // Close the modal
            if (modal) {
                modal.style.display = 'none';
            }
            
            // Reset the form
            form.reset();
        });
    }
});
