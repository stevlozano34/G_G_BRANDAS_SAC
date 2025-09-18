document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const modal = document.getElementById('saberMasModal');
    const modalContent = document.querySelector('.modal-saber-mas-content');
    const closeBtn = document.querySelector('.close-saber-mas');
    const saberMasButtons = document.querySelectorAll('[data-modal="saber-mas"]');
    
    // Función para abrir el modal
    function openModal() {
        if (modal) {
            // Mostrar el modal
            modal.style.display = 'flex';
            // Forzar reflow para la animación
            void modal.offsetWidth;
            // Añadir clase para mostrar con animación
            setTimeout(() => {
                modal.classList.add('show');
            }, 10);
            // Bloquear scroll del body
            document.body.style.overflow = 'hidden';
        }
    }

    // Función para cerrar el modal
    function closeModal() {
        if (modal) {
            // Iniciar animación de salida
            modal.classList.remove('show');
            // Esperar a que termine la animación antes de ocultar
            setTimeout(() => {
                modal.style.display = 'none';
                // Restaurar scroll del body
                document.body.style.overflow = '';
            }, 300);
        }
    }

    // Evento para abrir el modal desde cualquier botón con data-modal="saber-mas"
    saberMasButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            openModal();
        });
    });

    // Cerrar al hacer clic en el botón de cerrar
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    // Cerrar al hacer clic fuera del contenido del modal
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    // Cerrar con la tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal && modal.classList.contains('show')) {
            closeModal();
        }
    });

    // Prevenir que el clic dentro del contenido cierre el modal
    if (modalContent) {
        modalContent.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
});
