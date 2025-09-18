/**
 * Sistema de Envío de Gmail en Tiempo Real
 * Grupo Global Brands S.A.C.
 * Manejador del formulario principal de contacto
 * DESHABILITADO - USANDO SISTEMA INTEGRADO EN INDEX.HTML
 */

// SCRIPT DESHABILITADO - Salir inmediatamente
console.warn('🚫 gmail_handler.js DESHABILITADO - usando sistema integrado');

// Prevenir ejecución del resto del script
if (true) {
    console.log('🚀 Redirigiendo a sistema integrado en index.html');
    // Bloquear todas las variables globales
    window.gmailFormHandler = null;
    window.GmailFormHandler = null;
    window.CONFIG = null;
    window.NotificationManager = null;
    window.FormValidator = null;
    
    // Salir del script
    throw new Error('gmail_handler.js deshabilitado - usando sistema integrado');
}

// === EL RESTO DEL CÓDIGO ESTÁ DESHABILITADO ===

// Configuración global
const CONFIG = {
    API_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:8000/php gmail/enviar.php' 
        : 'https://grupoglobalbrandsperu.com/php gmail/enviar.php', // URL completa para servidor real
    TIMEOUT: 30000, // 30 segundos
    RETRY_ATTEMPTS: 3,
    DEBUG: true
};

// Utilidades de notificación
const NotificationManager = {
    create(message, type = 'info', duration = 5000) {
        // Eliminar notificaciones existentes
        document.querySelectorAll('.notification-toast').forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification-toast ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">${this.getIcon(type)}</div>
                <div class="notification-message">${message}</div>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Mostrar con animación
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Auto-ocultar
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 400);
        }, duration);
        
        return notification;
    },
    
    getIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            loading: '⏳'
        };
        return icons[type] || icons.info;
    }
};

// Validador de formulario
const FormValidator = {
    rules: {
        name: {
            required: true,
            minLength: 2,
            pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
            message: 'El nombre debe tener al menos 2 caracteres y solo contener letras'
        },
        email: {
            required: true,
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Por favor ingrese un email válido'
        },
        phone: {
            required: true,
            pattern: /^[\d\+\-\(\)\s]{9,15}$/,
            message: 'El teléfono debe tener entre 9 y 15 dígitos'
        },
        service: {
            required: true, // Volver a activar como requerido
            message: 'Por favor seleccione un servicio'
        },
        company: {
            required: false
        }
    },
    
    validate(formData) {
        const errors = [];
        
        // Debug: mostrar todos los datos del formulario
        console.log('Datos del formulario para validación:');
        for (const [field, value] of formData.entries()) {
            console.log(`${field}: "${value}" (length: ${value ? value.length : 0})`);
        }
        
        for (const [field, value] of formData.entries()) {
            const rule = this.rules[field];
            if (!rule) continue;
            
            // Campo requerido
            if (rule.required && (!value || value.trim() === '')) {
                errors.push(`${this.getFieldLabel(field)} es obligatorio`);
                continue;
            }
            
            // Validar solo si hay valor
            if (value && value.trim()) {
                // Longitud mínima
                if (rule.minLength && value.trim().length < rule.minLength) {
                    errors.push(rule.message);
                    continue;
                }
                
                // Patrón
                if (rule.pattern && !rule.pattern.test(value.trim())) {
                    errors.push(rule.message);
                    continue;
                }
            }
        }
        
        console.log('Errores de validación:', errors);
        return errors;
    },
    
    getFieldLabel(field) {
        const labels = {
            name: 'Nombre',
            email: 'Email',
            phone: 'Teléfono',
            service: 'Servicio',
            company: 'Empresa'
        };
        return labels[field] || field;
    }
};

// Manejador del formulario de Gmail
class GmailFormHandler {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.submitBtn = null;
        this.originalBtnText = '';
        this.isSubmitting = false;
        this.retryCount = 0;
        
        if (!this.form) {
            console.error(`Formulario con ID "${formId}" no encontrado`);
            return;
        }
        
        this.init();
    }
    
    init() {
        this.submitBtn = this.form.querySelector('button[type="submit"]');
        if (this.submitBtn) {
            this.originalBtnText = this.submitBtn.innerHTML;
        }
        
        this.addEventListeners();
        this.addRealTimeValidation();
        
        // Debug: verificar que todos los campos necesarios estén presentes
        const requiredFields = ['name', 'email', 'phone', 'service'];
        requiredFields.forEach(field => {
            const input = this.form.querySelector(`[name="${field}"]`);
            if (input) {
                console.log(`✓ Campo encontrado: ${field} (${input.tagName})`);
            } else {
                console.warn(`⚠️ Campo faltante: ${field}`);
            }
        });
        
        CONFIG.DEBUG && console.log('GmailFormHandler inicializado correctamente');
    }
    
    addEventListeners() {
        // Prevenir envío por defecto y otros manejadores con mayor prioridad
        this.form.addEventListener('submit', (e) => {
            console.log('🛑 Form submit intercepted by GmailFormHandler');
            e.preventDefault();
            e.stopImmediatePropagation();
            e.stopPropagation();
            this.handleSubmit();
        }, true); // useCapture = true para mayor prioridad
        
        // Listener adicional como respaldo
        this.form.addEventListener('submit', (e) => {
            console.log('🛑 Secondary form submit intercepted');
            e.preventDefault();
            e.stopImmediatePropagation();
            e.stopPropagation();
            this.handleSubmit();
        });
        
        // Validación en tiempo real del teléfono
        const phoneInput = this.form.querySelector('input[name="phone"]');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                // Permitir solo números, +, -, (, ), espacios
                e.target.value = e.target.value.replace(/[^\d\+\-\(\)\s]/g, '');
            });
        }
        
        // Limpiar errores al escribir
        this.form.querySelectorAll('input, select, textarea').forEach(input => {
            input.addEventListener('input', () => {
                input.classList.remove('error');
                const errorMsg = input.parentNode.querySelector('.error-message');
                if (errorMsg) errorMsg.remove();
            });
        });
    }
    
    addRealTimeValidation() {
        const emailInput = this.form.querySelector('input[name="email"]');
        if (emailInput) {
            emailInput.addEventListener('blur', () => {
                const email = emailInput.value.trim();
                if (email && !FormValidator.rules.email.pattern.test(email)) {
                    this.showFieldError(emailInput, 'Email inválido');
                }
            });
        }
        
        const phoneInput = this.form.querySelector('input[name="phone"]');
        if (phoneInput) {
            phoneInput.addEventListener('blur', () => {
                const phone = phoneInput.value.trim();
                if (phone && !FormValidator.rules.phone.pattern.test(phone)) {
                    this.showFieldError(phoneInput, 'Teléfono inválido');
                }
            });
        }
    }
    
    showFieldError(input, message) {
        input.classList.add('error');
        
        // Remover mensaje anterior
        const existingError = input.parentNode.querySelector('.error-message');
        if (existingError) existingError.remove();
        
        // Agregar nuevo mensaje
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        input.parentNode.appendChild(errorDiv);
    }
    
    async handleSubmit() {
        if (this.isSubmitting) return;
        
        // Bloquear navegación durante envío
        if (window.setFormSubmitting) {
            window.setFormSubmitting(true);
        }
        
        console.log('=== INICIO DE ENVÍO DE FORMULARIO ===');
        const formData = new FormData(this.form);
        
        console.log('FormData creado. Campos encontrados:');
        for (const [key, value] of formData.entries()) {
            console.log(`  ${key}: "${value}"`);
        }
        
        // Validar formulario
        const errors = FormValidator.validate(formData);
        if (errors.length > 0) {
            console.log('Errores de validación encontrados:', errors);
            NotificationManager.create(
                `Errores en el formulario:<br>• ${errors.join('<br>• ')}`,
                'error',
                7000
            );
            this.highlightErrors(formData);
            return;
        }
        
        console.log('Validación exitosa, continuando con envío...');
        
        // Mostrar estado de carga
        this.setSubmitState(true);
        NotificationManager.create('Enviando mensaje...', 'loading', 2000);
        
        try {
            // Preparar datos para envío
            const submitData = {
                nombre: formData.get('name'),
                email: formData.get('email'),
                telefono: formData.get('phone'),
                empresa: formData.get('company') || '',
                servicio: formData.get('service'),
                mensaje: formData.get('message') || `Solicitud desde formulario web.
                         
Empresa: ${formData.get('company') || 'No especificada'}
Servicio solicitado: ${formData.get('service')}

El cliente está interesado en obtener información sobre nuestros servicios.`
            };
            
            CONFIG.DEBUG && console.log('Enviando datos:', submitData);
            
            const response = await this.sendEmail(submitData);
            
            if (response.success) {
                this.handleSuccess(response);
            } else {
                throw new Error(response.message || 'Error desconocido');
            }
            
        } catch (error) {
            console.error('Error en envío:', error);
            this.handleError(error);
        } finally {
            this.setSubmitState(false);
            
            // Desbloquear navegación
            if (window.setFormSubmitting) {
                window.setFormSubmitting(false);
            }
        }
    }
    
    async sendEmail(data) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);
        
        try {
            const response = await fetch(CONFIG.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            CONFIG.DEBUG && console.log('Respuesta del servidor:', result);
            
            return result;
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Tiempo de espera agotado. Por favor, intente nuevamente.');
            }
            
            throw error;
        }
    }
    
    handleSuccess(response) {
        // Resetear contador de reintentos
        this.retryCount = 0;
        
        // Mostrar mensaje de éxito
        NotificationManager.create(
            `✅ ${response.message}<br><small>Tiempo de respuesta: ${response.data?.tiempo_respuesta || '24 horas'}</small>`,
            'success',
            8000
        );
        
        // Limpiar formulario
        this.form.reset();
        
        // Opcional: scroll suave hacia arriba
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Evento personalizado para analytics
        window.dispatchEvent(new CustomEvent('formSubmitSuccess', {
            detail: { response, timestamp: new Date().toISOString() }
        }));
        
        CONFIG.DEBUG && console.log('Formulario enviado exitosamente');
    }
    
    handleError(error) {
        let message = 'Error al enviar el mensaje. ';
        
        if (this.retryCount < CONFIG.RETRY_ATTEMPTS) {
            this.retryCount++;
            message += `Reintentando... (${this.retryCount}/${CONFIG.RETRY_ATTEMPTS})`;
            
            NotificationManager.create(message, 'warning', 3000);
            
            // Reintentar después de un breve delay
            setTimeout(() => this.handleSubmit(), 2000);
            return;
        }
        
        // Mostrar error definitivo
        message += 'Por favor, intente nuevamente o contáctenos directamente.';
        NotificationManager.create(message, 'error', 10000);
        
        // Reset contador
        this.retryCount = 0;
        
        // Evento personalizado para analytics
        window.dispatchEvent(new CustomEvent('formSubmitError', {
            detail: { error: error.message, timestamp: new Date().toISOString() }
        }));
        
        CONFIG.DEBUG && console.error('Error definitivo en formulario:', error);
    }
    
    highlightErrors(formData) {
        // Resaltar campos con errores
        for (const [field] of formData.entries()) {
            const input = this.form.querySelector(`[name="${field}"]`);
            if (input && FormValidator.rules[field]?.required && !formData.get(field).trim()) {
                input.classList.add('error');
            }
        }
    }
    
    setSubmitState(isLoading) {
        this.isSubmitting = isLoading;
        
        if (!this.submitBtn) return;
        
        this.submitBtn.disabled = isLoading;
        
        if (isLoading) {
            this.submitBtn.innerHTML = `
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Enviando...
            `;
        } else {
            this.submitBtn.innerHTML = this.originalBtnText;
        }
    }
}

// Interceptar cualquier intento de envío del formulario tempranamente
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Gmail Handler cargado en:', window.location.hostname);
    console.log('🔗 API URL configurada:', CONFIG.API_URL);
    
    // Interceptor adicional con alta prioridad
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        console.log('✅ Formulario encontrado:', contactForm);
        
        // Remover action del formulario para evitar envío GET
        contactForm.removeAttribute('action');
        contactForm.removeAttribute('method');
        
        // Listener con máxima prioridad para prevenir envío por defecto
        contactForm.addEventListener('submit', function(e) {
            console.log('🚨 INTERCEPTED: Form submit prevented');
            e.preventDefault();
            e.stopImmediatePropagation();
            e.stopPropagation();
            
            // Disparar envío manual
            if (window.gmailFormHandler) {
                console.log('📨 Llamando a handleSubmit manual');
                window.gmailFormHandler.handleSubmit();
            } else {
                console.error('❌ gmailFormHandler no disponible');
                alert('Error: Sistema de envío no inicializado. Recarga la página.');
            }
            
            return false;
        }, true);
        
        // Remover cualquier atributo que pueda causar conflictos
        contactForm.removeAttribute('data-form-type');
        contactForm.removeAttribute('action');
        contactForm.removeAttribute('method');
        
        console.log('🔧 Form attributes cleaned and priority handler installed');
        
        // Agregar handler directo al botón como respaldo
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            console.log('✅ Botón de envío encontrado:', submitBtn);
            submitBtn.addEventListener('click', function(e) {
                console.log('🔘 Botón de envío clickeado directamente');
                e.preventDefault();
                e.stopPropagation();
                
                // Disparar envío manual
                if (window.gmailFormHandler) {
                    console.log('📨 Disparando handleSubmit manual');
                    window.gmailFormHandler.handleSubmit();
                } else {
                    console.error('❌ gmailFormHandler no disponible');
                }
            });
        } else {
            console.error('❌ Botón de envío no encontrado');
        }
        
        // Interceptar navegación no deseada durante envío
        let isFormSubmitting = false;
        window.addEventListener('beforeunload', function(e) {
            if (isFormSubmitting) {
                e.preventDefault();
                e.returnValue = '';
                console.log('🛑 Navigation blocked during form submission');
                return '';
            }
        });
        
        // Hacer variable global disponible
        window.setFormSubmitting = function(state) {
            isFormSubmitting = state;
            console.log('📋 Form submitting state:', state);
        };
    } else {
        console.error('❌ Formulario contact-form no encontrado');
    }
    
    // Inicializar manejador del formulario principal
    const mainFormHandler = new GmailFormHandler('contact-form');
    
    // Hacer disponible globalmente INMEDIATAMENTE
    window.gmailFormHandler = mainFormHandler;
    console.log('🌐 gmailFormHandler ahora disponible globalmente:', window.gmailFormHandler);
    
    // Hacer disponible globalmente para debugging
    if (CONFIG.DEBUG) {
        console.log('Sistema de Gmail inicializado correctamente');
    }
    
    // Event listeners adicionales para UX
    window.addEventListener('online', () => {
        NotificationManager.create('Conexión restaurada', 'success', 3000);
    });
    
    window.addEventListener('offline', () => {
        NotificationManager.create('Sin conexión a Internet', 'warning', 5000);
    });
    
    // Función de test global para debug
    window.testFormSubmit = function() {
        console.log('🧪 Probando envío del formulario...');
        if (window.gmailFormHandler) {
            // Llenar formulario con datos de prueba
            const form = document.getElementById('contact-form');
            if (form) {
                form.querySelector('[name="name"]').value = 'Usuario Prueba';
                form.querySelector('[name="email"]').value = 'test@example.com';
                form.querySelector('[name="phone"]').value = '987654321';
                form.querySelector('[name="company"]').value = 'Empresa Test';
                const serviceSelect = form.querySelector('[name="service"]');
                if (serviceSelect && serviceSelect.options.length > 1) {
                    serviceSelect.selectedIndex = 1;
                }
                form.querySelector('[name="message"]').value = 'Mensaje de prueba';
                
                console.log('📋 Formulario llenado con datos de prueba');
                
                // Disparar envío
                window.gmailFormHandler.handleSubmit();
            }
        } else {
            console.error('❌ gmailFormHandler no disponible para testing');
        }
    };
    
    console.log('🚀 Sistema completamente inicializado. Para probar: window.testFormSubmit()');
});

// Estilos CSS inyectados dinámicamente
const styles = `
<style>
/* Estilos para notificaciones */
.notification-toast {
    position: fixed;
    top: 20px;
    right: 20px;
    max-width: 400px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    z-index: 10000;
    transform: translateX(100%);
    transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    opacity: 0;
}

.notification-toast.show {
    transform: translateX(0);
    opacity: 1;
}

.notification-content {
    display: flex;
    align-items: flex-start;
    padding: 16px;
    gap: 12px;
}

.notification-icon {
    font-size: 20px;
    line-height: 1;
    flex-shrink: 0;
}

.notification-message {
    flex: 1;
    font-size: 14px;
    line-height: 1.5;
    color: #333;
}

.notification-close {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: #666;
    line-height: 1;
    padding: 0;
    margin-left: 8px;
}

.notification-close:hover {
    color: #333;
}

/* Tipos de notificación */
.notification-toast.success {
    border-left: 4px solid #28a745;
}

.notification-toast.error {
    border-left: 4px solid #dc3545;
}

.notification-toast.warning {
    border-left: 4px solid #ffc107;
}

.notification-toast.info {
    border-left: 4px solid #17a2b8;
}

.notification-toast.loading {
    border-left: 4px solid #007bff;
}

/* Estilos para campos con error */
.form-control.error {
    border-color: #dc3545 !important;
    box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25) !important;
}

.error-message {
    color: #dc3545;
    font-size: 12px;
    margin-top: 5px;
    display: block;
}

/* Mejoras responsive para notificaciones */
@media (max-width: 768px) {
    .notification-toast {
        right: 10px;
        left: 10px;
        max-width: none;
        transform: translateY(-100%);
    }
    
    .notification-toast.show {
        transform: translateY(0);
    }
}

/* Animación de carga en botón */
.spinner-border-sm {
    width: 1rem;
    height: 1rem;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.spinner-border {
    display: inline-block;
    width: 2rem;
    height: 2rem;
    vertical-align: text-bottom;
    border: 0.25em solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spin 0.75s linear infinite;
}
</style>
`;

// Inyectar estilos
document.head.insertAdjacentHTML('beforeend', styles);