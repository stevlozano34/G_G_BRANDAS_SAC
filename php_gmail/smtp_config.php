<?php
// Configuración de SMTP para Gmail - Mantener fuera del directorio web público en producción
return [
    'smtp' => [
        'host' => 'smtp.gmail.com',
        'username' => 'grupoblogalbrandsperu@gmail.com',
        'password' => 'tzzr rjbj rdoo tafo', // Contraseña de aplicación real
        'port' => 587,
        'encryption' => 'tls'
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
?>