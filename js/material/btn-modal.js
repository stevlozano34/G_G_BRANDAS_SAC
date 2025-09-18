document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById("myModal");
    const btn = document.getElementById("openModal");
    const span = document.getElementsByClassName("close")[0];

    function openModal() {
        if (modal) {
            modal.style.display = "block";
            // Trigger reflow
            void modal.offsetWidth;
            // Add show class for animation
            modal.classList.add('show');
            // Prevent background scroll
            document.body.style.overflow = 'hidden';
        }
    }

    function closeModal() {
        if (modal) {
            modal.classList.remove('show');
            // Wait for animation to complete before hiding
            setTimeout(() => {
                modal.style.display = "none";
                // Restore body scroll
                document.body.style.overflow = '';
            }, 300); // Match this with your CSS transition time
        }
    }

    if (btn) {
        btn.onclick = function(e) {
            e.preventDefault();
            openModal();
        }
    }

    if (span) {
        span.onclick = function() {
            closeModal();
        }
    }

    window.onclick = function(event) {
        if (event.target === modal) {
            closeModal();
        }
    }

    // Close with Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modal && modal.style.display === 'block') {
            closeModal();
        }
    });
});