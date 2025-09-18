document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById("solicitarModal");
    const btn = document.querySelector("a[href='#solicitar']");
    const span = document.querySelector("#solicitarModal .close");
    const form = document.getElementById("solicitarForm");

    // Function to open modal
    function openModal() {
        if (modal) {
            modal.style.display = "flex";
            // Trigger reflow
            void modal.offsetWidth;
            // Add show class for animation
            modal.classList.add('show');
            // Prevent background scroll
            document.body.style.overflow = 'hidden';
            // Focus on first input
            const firstInput = modal.querySelector('input, select, textarea');
            if (firstInput) firstInput.focus();
        }
    }

    // Function to close modal
    function closeModal() {
        if (modal) {
            modal.classList.remove('show');
            // Wait for animation to complete before hiding
            setTimeout(() => {
                modal.style.display = "none";
                // Restore body scroll
                document.body.style.overflow = '';
            }, 300);
        }
    }

    // Open modal when clicking the button
    if (btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            openModal();
        });
    }

    // Close modal when clicking the close button
    if (span) {
        span.addEventListener('click', closeModal);
    }

    // Close modal when clicking outside the modal content
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal();
        }
    });

    // Close with Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === "Escape" && modal.style.display === "flex") {
            closeModal();
        }
    });

    // Form submission
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            // Here you can add your form submission logic
            alert('¡Gracias por tu solicitud! Nos pondremos en contacto contigo pronto.');
            form.reset();
            closeModal();
        });
    }
});