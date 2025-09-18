<?php
// Configuración optimizada para entornos de producción
ini_set('display_errors', 0); // Desactivar en producción
ini_set('log_errors', 1);
error_reporting(E_ALL);

// Configurar zona horaria para Perú
date_default_timezone_set('America/Lima');

// Log de inicio para debug (solo en desarrollo)
if (isset($_ENV['APP_ENV']) && $_ENV['APP_ENV'] === 'development') {
    error_log("[INIT] Script enviar.php iniciado - " . date('Y-m-d H:i:s'));
}

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Verificar si los archivos de PHPMailer existen antes de incluirlos


$gmail= $_POST['email'];
$nombre= $_POST['name'];

$mailerFiles = [
    'src/Exception.php',
    'src/PHPMailer.php',
    'src/SMTP.php'
];

$mailerAvailable = true;
foreach ($mailerFiles as $file) {
    if (!file_exists(__DIR__ . '/' . $file)) {
        error_log("[ERROR] Archivo faltante: " . __DIR__ . '/' . $file);
        $mailerAvailable = false;
        break;
    }
}

// Solo incluir PHPMailer si todos los archivos existen
if ($mailerAvailable) {
    require 'src/Exception.php';
    require 'src/PHPMailer.php';
    require 'src/SMTP.php';
}

// Cargar configuración SMTP desde archivo externo
$smtpConfig = [];
if (file_exists(__DIR__ . '/smtp_config.php')) {
    $smtpConfig = include __DIR__ . '/smtp_config.php';
} else {
    error_log("[ERROR] Archivo de configuración SMTP no encontrado");
    $smtpConfig = [
        'smtp' => [
            'host' => 'smtp.gmail.com',
            'username' => 'grupoblogalbrandsperu@gmail.com',
            'password' => '', // Debe ser actualizado
            'port' => 587,
            'encryption' => 'tls',
            'timeout' => 15
        ],
        'sender' => [
            'email' => 'grupoblogalbrandsperu@gmail.com',
            'name' => 'Grupo Global Brands'
        ],
        'recipients' => [
            'primary' => 'grupoblogalbrandsperu@gmail.com',
            'secondary' => 'atencionalcliente@grupoglobalbrandsperu.com'
        ]
    ];
}

// Headers para CORS y respuesta JSON
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = [
    'http://127.0.0.1:5500', 
    'http://localhost:8000', 
    'http://localhost:5500', 
    'https://grupoglobalbrandsperu.com',
    'http://grupoglobalbrandsperu.com'
];

if (in_array($origin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: *');
}

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
header('Access-Control-Max-Age: 86400'); // Cache por 24 horas

// Función para respuesta JSON
function jsonResponse($success, $message, $data = null) {
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    exit;
}

// Función para validar email
function validarEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

// Función para sanitizar datos
function sanitizar($data) {
    return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
}

// Manejar preflight OPTIONS request
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Función para manejar el envío de formulario sin PHPMailer
function handleFormSubmissionWithoutPHPMailer($smtpConfig) {
    // Obtener datos del POST o JSON
    $input = json_decode(file_get_contents('php://input'), true);
    
    if ($input) {
        // Datos vienen como JSON
        $nombre   = sanitizar($input['nombre'] ?? $input['name'] ?? '');
        $email    = sanitizar($input['email'] ?? '');
        $telefono = sanitizar($input['telefono'] ?? $input['phone'] ?? '');
        $empresa  = sanitizar($input['empresa'] ?? $input['company'] ?? '');
        $servicio = sanitizar($input['servicio'] ?? $input['service'] ?? '');
        $mensaje  = sanitizar($input['mensaje'] ?? $input['message'] ?? '');
    } else {
        // Datos vienen como form-data
        $nombre   = sanitizar($_POST['nombre'] ?? $_POST['name'] ?? '');
        $email    = sanitizar($_POST['email'] ?? '');
        $telefono = sanitizar($_POST['telefono'] ?? $_POST['phone'] ?? '');
        $empresa  = sanitizar($_POST['empresa'] ?? $_POST['company'] ?? '');
        $servicio = sanitizar($_POST['servicio'] ?? $_POST['service'] ?? '');
        $mensaje  = sanitizar($_POST['mensaje'] ?? $_POST['message'] ?? '');
    }
    
    // Validación de campos obligatorios
    if (empty($nombre)) {
        jsonResponse(false, 'El nombre es obligatorio');
    }
    if (empty($email) || !validarEmail($email)) {
        jsonResponse(false, 'El email es obligatorio y debe ser válido');
    }
    if (empty($telefono)) {
        jsonResponse(false, 'El teléfono es obligatorio');
    }
    if (empty($servicio)) {
        $servicio = 'Consulta general';
    }
    if (empty($mensaje)) {
        $mensaje = 'Sin mensaje adicional';
    }
    
    // Registrar en log
    error_log("[FORM SUBMIT] Nuevo mensaje recibido de $nombre ($email)");
    
    // Verificar si la función mail() está disponible
    if (!function_exists('mail')) {
        error_log("[ERROR] La función mail() no está disponible en este servidor");
        // Guardar en archivo de respaldo
        saveToBackupFile($nombre, $email, $telefono, $empresa, $servicio, $mensaje);
        jsonResponse(false, "Hubo un problema técnico con el envío automático de emails. Tu mensaje ha sido registrado pero no se pudo enviar por email.", [
            'nombre' => $nombre,
            'servicio' => $servicio,
            'metodo_envio' => 'archivo_local',
            'tiempo_respuesta' => '24 horas'
        ]);
    }

    // Intentar enviar con mail() de PHP
    $to = $smtpConfig['recipients']['primary'] . ', ' . $smtpConfig['recipients']['secondary'];
    $subject = "[URGENTE] Nuevo contacto - $servicio";
    
    $message = "
    🔔 NUEVO MENSAJE DE CONTACTO
    ==========================
    
    Fecha: " . date('d/m/Y H:i:s') . "
    
    👤 Nombre: $nombre
    📧 Email: $email
    📱 Teléfono: $telefono
    🏢 Empresa: " . ($empresa ?: 'No especificada') . "
    🎯 Servicio: $servicio
    
    💬 Mensaje:
    $mensaje
    
    ==========================
    Este mensaje fue enviado desde el formulario de contacto de Grupo Global Brands
    URL: https://grupoglobalbrandsperu.com
    ";
    
    $headers = "From: " . $smtpConfig['sender']['email'] . "\r\n";
    $headers .= "Reply-To: $email\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
    
    // Registrar intento en log
    error_log("Intentando enviar email con mail(): To: $to, Subject: $subject");
    
    // Intentar enviar con mail() de PHP
    if (@mail($to, $subject, $message, $headers)) {
        error_log("[SUCCESS] Email enviado exitosamente con mail() de PHP");
        
        // ENVIAR EMAIL DE CONFIRMACIÓN AL USUARIO
        $confirmSubject = "✅ Confirmación de recepción - Grupo Global Brands";
        $confirmMessage = "
        ✅ Solicitud Recibida
        
        Hola " . htmlspecialchars($nombre) . ",
        
        Hemos recibido tu solicitud sobre: " . htmlspecialchars($servicio) . "
        
        Datos registrados:
        - Email: " . htmlspecialchars($email) . "
        - Teléfono: " . htmlspecialchars($telefono) . "
        - Fecha: " . date('d/m/Y H:i:s') . "
        
        Nos pondremos en contacto contigo dentro de las próximas 24 horas.
        
        Grupo Global Brands S.A.C.
        ";
        
        $confirmHeaders = "From: " . $smtpConfig['sender']['email'] . "\r\n";
        $confirmHeaders .= "Content-Type: text/plain; charset=UTF-8\r\n";
        
        // Intentar enviar email de confirmación
        @mail($email, $confirmSubject, $confirmMessage, $confirmHeaders);
        
        jsonResponse(true, "¡Mensaje enviado correctamente! Te contactaremos pronto.", [
            'nombre' => $nombre,
            'servicio' => $servicio,
            'metodo_envio' => 'mail_php',
            'tiempo_respuesta' => '24 horas',
            'confirmacion_usuario' => 'enviada'
        ]);
    } else {
        error_log("[ERROR] Fallo al enviar email con mail() de PHP");
        // Guardar en archivo de respaldo
        saveToBackupFile($nombre, $email, $telefono, $empresa, $servicio, $mensaje);
        jsonResponse(false, "Hubo un problema técnico con el envío automático de emails. Tu mensaje ha sido registrado pero no se pudo enviar por email.", [
            'nombre' => $nombre,
            'servicio' => $servicio,
            'metodo_envio' => 'archivo_local',
            'tiempo_respuesta' => '24 horas'
        ]);
    }
}

// Función para guardar en archivo de respaldo
function saveToBackupFile($nombre, $email, $telefono, $empresa, $servicio, $mensaje) {
    // Guardar en archivo de respaldo para seguimiento manual
    $backupData = [
        'timestamp' => date('Y-m-d H:i:s'),
        'nombre' => $nombre,
        'email' => $email,
        'telefono' => $telefono,
        'empresa' => $empresa,
        'servicio' => $servicio,
        'mensaje' => $mensaje,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
    ];
    
    // Crear archivo de respaldo si no existe
    $backupFile = __DIR__ . '/contactos_backup.json';
    $existingData = [];
    
    if (file_exists($backupFile)) {
        $existingData = json_decode(file_get_contents($backupFile), true) ?? [];
    }
    
    $existingData[] = $backupData;
    
    // Intentar guardar y verificar
    $saveResult = @file_put_contents($backupFile, json_encode($existingData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    
    // También guardar en log para respaldo adicional
    $logMessage = "
============================================================
📧 NUEVO MENSAJE (Guardado local)
Fecha: " . date('Y-m-d H:i:s') . "
----------------------------------------
👤 Nombre: $nombre
📧 Email: $email
📱 Teléfono: $telefono
🏢 Empresa: " . ($empresa ?: 'No especificada') . "
🎯 Servicio: $servicio
💬 Mensaje: $mensaje
🌐 IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . "
🔧 User Agent: " . ($_SERVER['HTTP_USER_AGENT'] ?? 'unknown') . "
============================================================

";
    @file_put_contents(__DIR__ . '/mensajes_recibidos.log', $logMessage, FILE_APPEND | LOCK_EX);
    
    if ($saveResult !== false) {
        error_log("[BACKUP] Datos guardados exitosamente en contactos_backup.json");
    } else {
        error_log("[ERROR] Fallo al guardar datos en contactos_backup.json");
    }
}

// Verificar que existe REQUEST_METHOD y es POST
if (isset($_SERVER["REQUEST_METHOD"]) && $_SERVER["REQUEST_METHOD"] === "POST") {
    // Si PHPMailer no está disponible, usar método alternativo inmediatamente
    if (!$mailerAvailable) {
        error_log("[INFO] PHPMailer no disponible, usando método alternativo");
        handleFormSubmissionWithoutPHPMailer($smtpConfig);
        exit;
    }
    
    // Obtener datos del POST o JSON
    $input = json_decode(file_get_contents('php://input'), true);
    
    if ($input) {
        // Datos vienen como JSON
        $nombre   = sanitizar($input['nombre'] ?? $input['name'] ?? '');
        $email    = sanitizar($input['email'] ?? '');
        $telefono = sanitizar($input['telefono'] ?? $input['phone'] ?? '');
        $empresa  = sanitizar($input['empresa'] ?? $input['company'] ?? '');
        $servicio = sanitizar($input['servicio'] ?? $input['service'] ?? '');
        $mensaje  = sanitizar($input['mensaje'] ?? $input['message'] ?? '');
    } else {
        // Datos vienen como form-data
        $nombre   = sanitizar($_POST['nombre'] ?? $_POST['name'] ?? '');
        $email    = sanitizar($_POST['email'] ?? '');
        $telefono = sanitizar($_POST['telefono'] ?? $_POST['phone'] ?? '');
        $empresa  = sanitizar($_POST['empresa'] ?? $_POST['company'] ?? '');
        $servicio = sanitizar($_POST['servicio'] ?? $_POST['service'] ?? '');
        $mensaje  = sanitizar($_POST['mensaje'] ?? $_POST['message'] ?? '');
    }
    
    // Validación de campos obligatorios
    if (empty($nombre)) {
        jsonResponse(false, 'El nombre es obligatorio');
    }
    if (empty($email) || !validarEmail($email)) {
        jsonResponse(false, 'El email es obligatorio y debe ser válido');
    }
    if (empty($telefono)) {
        jsonResponse(false, 'El teléfono es obligatorio');
    }
    if (empty($servicio)) {
        $servicio = 'Consulta general';
    }
    if (empty($mensaje)) {
        $mensaje = 'Sin mensaje adicional';
    }

    // Configuración SMTP optimizada para producción
    function configurarSMTP($mail, $smtpConfig, $intento = 1) {
        // Configuración 1: Gmail STARTTLS (puerto 587) - timeout reducido para entornos compartidos
        if ($intento == 1) {
            $mail->isSMTP();
            $mail->Host       = $smtpConfig['smtp']['host'];
            $mail->SMTPAuth   = true;
            $mail->Username   = $smtpConfig['smtp']['username'];
            $mail->Password   = $smtpConfig['smtp']['password'];
            $mail->SMTPSecure = $smtpConfig['smtp']['encryption'];
            $mail->Port       = $smtpConfig['smtp']['port'];
            $mail->Timeout    = $smtpConfig['smtp']['timeout'];
            $mail->CharSet    = 'UTF-8';
            $mail->SMTPKeepAlive = false;
            $mail->SMTPAutoTLS = true;
            
            // Configuración SSL optimizada para producción
            $mail->SMTPOptions = array(
                'ssl' => array(
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'allow_self_signed' => true,
                    'crypto_method' => STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT
                )
            );
            
            // Activar debug para diagnóstico en producción
            $mail->SMTPDebug = 0; // Desactivado en producción para mejorar el rendimiento
            
        } else {
            // Segundo intento: Gmail SSL (puerto 465) - timeout reducido
            $mail->isSMTP();
            $mail->Host       = $smtpConfig['smtp']['host'];
            $mail->SMTPAuth   = true;
            $mail->Username   = $smtpConfig['smtp']['username'];
            $mail->Password   = $smtpConfig['smtp']['password'];
            $mail->SMTPSecure = 'ssl';
            $mail->Port       = 465;
            $mail->Timeout    = $smtpConfig['smtp']['timeout'];
            $mail->CharSet    = 'UTF-8';
            $mail->SMTPKeepAlive = false;
            $mail->SMTPAutoTLS = true;
            
            $mail->SMTPOptions = array(
                'ssl' => array(
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'allow_self_signed' => true,
                    'crypto_method' => STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT
                )
            );
            
            $mail->SMTPDebug = 0; // Desactivado en producción
        }
        
        return [
            'from_email' => $smtpConfig['sender']['email'],
            'from_name' => $smtpConfig['sender']['name']
        ];
    }

    $mail = new PHPMailer(true);
    $intentos = 0;
    $maxIntentos = 2;
    $emailEnviado = false;
    $ultimoError = '';

    // Intentar enviar con configuración rápida primero
    while (!$emailEnviado && $intentos < $maxIntentos) {
        $intentos++;
        
        try {
            // Crear nueva instancia para cada intento
            $mail->clearAddresses();
            $mail->clearAllRecipients();
            $mail->clearAttachments();
            $mail->clearCustomHeaders();
            
            $smtpConfigResult = configurarSMTP($mail, $smtpConfig, $intentos);

            // Configurar destinatarios y contenido
            $mail->setFrom($smtpConfigResult['from_email'], $smtpConfigResult['from_name'] . ' - Formulario');
            $mail->addAddress($smtpConfig['recipients']['primary'], 'Administrador');
            $mail->addAddress($smtpConfig['recipients']['secondary'], 'Empresa');
            $mail->addReplyTo($email, $nombre);

            $mail->isHTML(true);
            $mail->Subject = "[URGENTE] Nuevo contacto - $servicio";
            
            // HTML simplificado para máxima velocidad
            $mail->Body = "
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
                <div style='background: #2c3e50; color: white; padding: 20px; text-align: center;'>
                    <h2>🔔 Nuevo Mensaje de Contacto</h2>
                    <p>Recibido el " . date('d/m/Y H:i:s') . "</p>
                </div>
                <div style='background: #f8f9fa; padding: 20px; border: 1px solid #dee2e6;'>
                    <p><strong>👤 Nombre:</strong> $nombre</p>
                    <p><strong>📧 Email:</strong> $email</p>
                    <p><strong>📱 Teléfono:</strong> $telefono</p>
                    <p><strong>🏢 Empresa:</strong> " . ($empresa ?: 'No especificada') . "</p>
                    <p><strong>🎯 Servicio:</strong> $servicio</p>
                    <p><strong>💬 Mensaje:</strong></p>
                    <div style='background: white; padding: 15px; border-radius: 5px; margin-top: 10px;'>
                        " . nl2br(htmlspecialchars($mensaje)) . "
                    </div>
                </div>
            </div>
            ";
            
            $mail->AltBody = "🔔 NUEVO CONTACTO\n\nNombre: $nombre\nEmail: $email\nTeléfono: $telefono\nEmpresa: " . ($empresa ?: 'No especificada') . "\nServicio: $servicio\nMensaje: $mensaje\nFecha: " . date('d/m/Y H:i:s');

            // Intentar enviar
            $mail->send();
            $emailEnviado = true;
            
        } catch (Exception $e) {
            $ultimoError = $e->getMessage();
            error_log("[SMTP ERROR] Intento $intentos falló: " . $ultimoError);
            
            // Si es el primer intento y falla, intentar fallback inmediatamente
            if ($intentos == 1) {
                // Continuar con el segundo intento
            } else {
                // Ambos intentos fallaron
            }
        }
    }
    
    // Verificar si el email se envió exitosamente
    if ($emailEnviado) {
        // ENVIAR EMAIL DE CONFIRMACIÓN AL USUARIO
        try {
            $confirmacion = new PHPMailer(true);
            
            // Configurar para enviar desde la empresa al usuario
            $confirmacion->isSMTP();
            $confirmacion->Host       = $smtpConfig['smtp']['host'];
            $confirmacion->SMTPAuth   = true;
            $confirmacion->Username   = $smtpConfig['smtp']['username'];
            $confirmacion->Password   = $smtpConfig['smtp']['password'];
            $confirmacion->SMTPSecure = $smtpConfig['smtp']['encryption'];
            $confirmacion->Port       = $smtpConfig['smtp']['port'];
            $confirmacion->Timeout    = $smtpConfig['smtp']['timeout'];
            $confirmacion->CharSet    = 'UTF-8';
            $confirmacion->SMTPAutoTLS = true;
            
            // Configurar email de confirmación
            $confirmacion->setFrom($smtpConfig['sender']['email'], $smtpConfig['sender']['name']);
            $confirmacion->addAddress($email, $nombre);
            $confirmacion->addReplyTo($smtpConfig['sender']['email'], $smtpConfig['sender']['name']);
            
            $confirmacion->isHTML(true);
            $confirmacion->Subject = "✅ Confirmación de recepción - Grupo Global Brands";
            
            $confirmacion->Body = "
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
                <div style='background: #28a745; color: white; padding: 20px; text-align: center;'>
                    <h2>✅ Solicitud Recibida</h2>
                    <p>Gracias por contactarnos, " . htmlspecialchars($nombre) . "</p>
                </div>
                <div style='background: #f8f9fa; padding: 20px; border: 1px solid #dee2e6;'>
                    <h3>Detalles de tu solicitud:</h3>
                    <p><strong>📧 Email:</strong> " . htmlspecialchars($email) . "</p>
                    <p><strong>📱 Teléfono:</strong> " . htmlspecialchars($telefono) . "</p>
                    <p><strong>🎯 Servicio:</strong> " . htmlspecialchars($servicio) . "</p>
                    <p><strong>🕐 Fecha:</strong> " . date('d/m/Y H:i:s') . "</p>
                    <hr>
                    <p>Hemos recibido tu solicitud y nuestro equipo se pondrá en contacto contigo dentro de las próximas <strong>24 horas</strong>.</p>
                </div>
                <div style='text-align: center; padding: 20px; font-size: 12px; color: #666;'>
                    <p>Grupo Global Brands S.A.C.</p>
                </div>
            </div>
            ";
            
            $confirmacion->AltBody = "
            ✅ Solicitud Recibida
            
            Hola " . htmlspecialchars($nombre) . ",
            
            Hemos recibido tu solicitud sobre: " . htmlspecialchars($servicio) . "
            
            Datos registrados:
            - Email: " . htmlspecialchars($email) . "
            - Teléfono: " . htmlspecialchars($telefono) . "
            - Fecha: " . date('d/m/Y H:i:s') . "
            
            Nos pondremos en contacto contigo dentro de las próximas 24 horas.
            
            Grupo Global Brands S.A.C.
            ";
            
            // Intentar enviar email de confirmación
            $confirmacion->send();
            
        } catch (Exception $e) {
            // No detener el proceso si falla la confirmación
            error_log("[CONFIRMATION ERROR] " . $e->getMessage());
        }
        
        // Respuesta exitosa inmediata
        jsonResponse(true, "¡Mensaje enviado correctamente! Te contactaremos pronto.", [
            'nombre' => $nombre,
            'servicio' => $servicio,
            'tiempo_respuesta' => '24 horas',
            'email_enviado' => true,
            'intento_exitoso' => $intentos,
            'metodo_envio' => 'gmail_smtp',
            'confirmacion_usuario' => 'enviada'
        ]);
    } else {
        // MÉTODO ALTERNATIVO: Intentar con mail() de PHP como fallback confiable
        error_log("[INFO] Gmail SMTP falló después de $intentos intentos. Último error: $ultimoError. Intentando método alternativo mail()...");
        
        // Verificar si la función mail() está disponible
        if (!function_exists('mail')) {
            error_log("[ERROR] La función mail() no está disponible en este servidor");
            // Guardar en archivo de respaldo
            saveToBackupFile($nombre, $email, $telefono, $empresa, $servicio, $mensaje);
            jsonResponse(false, "Hubo un problema técnico con el envío automático de emails. Tu mensaje ha sido registrado pero no se pudo enviar por email.", [
                'nombre' => $nombre,
                'servicio' => $servicio,
                'metodo_envio' => 'archivo_local',
                'tiempo_respuesta' => '24 horas'
            ]);
        }

        // Crear mensaje de texto plano
        $to = $smtpConfig['recipients']['primary'] . ', ' . $smtpConfig['recipients']['secondary'];
        $subject = "[URGENTE] Nuevo contacto - $servicio";
        
        $message = "
        🔔 NUEVO MENSAJE DE CONTACTO
        ==========================
        
        Fecha: " . date('d/m/Y H:i:s') . "
        
        👤 Nombre: $nombre
        📧 Email: $email
        📱 Teléfono: $telefono
        🏢 Empresa: " . ($empresa ?: 'No especificada') . "
        🎯 Servicio: $servicio
        
        💬 Mensaje:
        $mensaje
        
        ==========================
        Este mensaje fue enviado desde el formulario de contacto de Grupo Global Brands
        URL: https://grupoglobalbrandsperu.com
        ";
        
        $headers = "From: " . $smtpConfig['sender']['email'] . "\r\n";
        $headers .= "Reply-To: $email\r\n";
        $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
        $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
        
        // Registrar intento en log
        error_log("Intentando enviar email con mail(): To: $to, Subject: $subject");
        
        // Intentar enviar con mail() de PHP
        if (@mail($to, $subject, $message, $headers)) {
            error_log("[SUCCESS] Email enviado exitosamente con mail() de PHP");
            
            // ENVIAR EMAIL DE CONFIRMACIÓN AL USUARIO
            $confirmSubject = "✅ Confirmación de recepción - Grupo Global Brands";
            $confirmMessage = "
            ✅ Solicitud Recibida
            
            Hola " . htmlspecialchars($nombre) . ",
            
            Hemos recibido tu solicitud sobre: " . htmlspecialchars($servicio) . "
            
            Datos registrados:
            - Email: " . htmlspecialchars($email) . "
            - Teléfono: " . htmlspecialchars($telefono) . "
            - Fecha: " . date('d/m/Y H:i:s') . "
            
            Nos pondremos en contacto contigo dentro de las próximas 24 horas.
            
            Grupo Global Brands S.A.C.
            ";
            
            $confirmHeaders = "From: " . $smtpConfig['sender']['email'] . "\r\n";
            $confirmHeaders .= "Content-Type: text/plain; charset=UTF-8\r\n";
            
            // Intentar enviar email de confirmación
            @mail($email, $confirmSubject, $confirmMessage, $confirmHeaders);
            
            jsonResponse(true, "¡Mensaje enviado correctamente! Te contactaremos pronto.", [
                'nombre' => $nombre,
                'servicio' => $servicio,
                'metodo_envio' => 'mail_php',
                'tiempo_respuesta' => '24 horas',
                'confirmacion_usuario' => 'enviada'
            ]);
        } else {
            // Si ambos métodos fallan - NO dar falso positivo
            error_log("[ERROR] Todos los intentos fallaron. Último error SMTP: $ultimoError");
            
            // Guardar en archivo de respaldo para seguimiento manual
            saveToBackupFile($nombre, $email, $telefono, $empresa, $servicio, $mensaje);
            
            jsonResponse(false, "Hubo un problema técnico con el envío automático de emails. Tu mensaje ha sido registrado pero no se pudo enviar por email.", [
                'nombre' => $nombre,
                'servicio' => $servicio,
                'metodo_envio' => 'archivo_local',
                'tiempo_respuesta' => '24 horas'
            ]);
        }
    }
} else {
    // Método no permitido
    http_response_code(405);
    jsonResponse(false, "Método no permitido. Este endpoint solo acepta solicitudes POST.");
}
?>