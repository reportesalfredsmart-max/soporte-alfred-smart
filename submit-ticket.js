// netlify/functions/submit-ticket.js

const nodemailer = require('nodemailer');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const cloudinary = require('cloudinary').v2;
const { formidable } = require('formidable');
const { Readable } = require('stream'); // Importamos la clase Readable

// --- CONFIGURACIÓN (desde variables de entorno en Netlify) ---
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
});

const creds = JSON.parse(process.env.GOOGLE_SHEET_CREDENTIALS);

// --- FUNCIÓN PRINCIPAL ---
exports.handler = async (event, context) => {
    const form = formidable({ multiples: true, allowEmptyFiles: true, minFileSize: 0 });
    
    // --- SOLUCIÓN DEFINITIVA: Crear un stream de datos para formidable ---
    // Netlify envía el body como un string codificado en Base64.
    const bodyBuffer = Buffer.from(event.body, 'base64');

    // Creamos un stream de lectura a partir del buffer. Esto es lo que formidable necesita.
    const stream = Readable.from(bodyBuffer);
    // Le añadimos los headers de la petición original para que formidable sepa cómo interpretar los datos.
    stream.headers = event.headers;

    try {
        // Ahora parseamos el stream, que es el formato correcto.
        const [fields, files] = await form.parse(stream);

        // --- El resto del código sigue igual ---
        const email = Array.isArray(fields.email) ? fields.email[0] : fields.email;
        const nombre = Array.isArray(fields.nombre) ? fields.nombre[0] : fields.nombre;
        const telefono = Array.isArray(fields.telefono) ? fields.telefono[0] : fields.telefono;
        const direccion = Array.isArray(fields.direccion) ? fields.direccion[0] : fields.direccion;
        const piso = Array.isArray(fields.piso) ? fields.piso[0] : fields.piso;
        const ciudad = Array.isArray(fields.ciudad) ? fields.ciudad[0] : fields.ciudad;
        const prioridad = Array.isArray(fields.prioridad) ? fields.prioridad[0] : fields.prioridad;
        const dispositivo = Array.isArray(fields.dispositivo) ? fields.dispositivo[0] : fields.dispositivo;
        const subcategoria = Array.isArray(fields.subcategoria) ? fields.subcategoria[0] : fields.subcategoria;
        const estadoDispositivo = Array.isArray(fields['estado-dispositivo']) ? fields['estado-dispositivo'][0] : fields['estado-dispositivo'];
        const descripcion = Array.isArray(fields.descripcion) ? fields.descripcion[0] : fields.descripcion;

        // 1. SUBIR ARCHIVOS A CLOUDINARY
        let attachmentUrls = [];
        if (files.adjuntos) {
            const fileArray = Array.isArray(files.adjuntos) ? files.adjuntos : [files.adjuntos];
            for (const file of fileArray) {
                // --- MEJORA: Solo subimos el archivo si su tamaño es mayor que 0 ---
                if (file && file.size > 0) {
                    try {
                        const result = await cloudinary.uploader.upload(file.filepath, { resource_type: 'auto' });
                        attachmentUrls.push(result.secure_url);
                    } catch (uploadError) {
                        console.error("Error subiendo archivo a Cloudinary:", uploadError);
                    }
                }
            }
        }

        // 2. GENERAR ID DE TICKET ÚNICO
        const now = new Date();
        const ticketId = `ALF-${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;

        // 3. GUARDAR EN GOOGLE SHEET
        const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID);
        await doc.useServiceAccountAuth(creds);
        await doc.loadInfo();
        const sheet = doc.sheetsByIndex[0];

        const newRow = {
            'ID Ticket': ticketId,
            'Fecha y Hora': now.toISOString(),
            'Email Usuario': email,
            'Nombre': nombre,
            'Teléfono': telefono,
            'Dirección Completa': `${direccion}, ${piso}, ${ciudad}`,
            'Prioridad': prioridad,
            'Dispositivo': dispositivo,
            'Subcategoría': subcategoria,
            'Estado Dispositivo': estadoDispositivo,
            'Descripción': descripcion,
            'URLs de Adjuntos': attachmentUrls.join(', '),
            'Estado': 'Pendiente',
            'Notificación Enviada': 'FALSE'
        };
        await sheet.addRow(newRow);

        // 4. ENVIAR CORREO DE CONFIRMACIÓN AL USUARIO
        const mailToUser = {
            from: `"Soporte Alfred Smart" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: `Hemos recibido tu reporte - ${ticketId}`,
            html: `<h2>Hola, ${nombre}.</h2>
                   <p>Gracias por contactarnos. Hemos recibido tu reporte y ha sido registrado con el número de ticket:</p>
                   <h3>${ticketId}</h3>
                   <p>Nuestro equipo lo revisará y te contactará a la brevedad.</p>
                   <br>
                   <p>Atentamente,<br>El equipo de Alfred Smart</p>`,
        };
        await transporter.sendMail(mailToUser);

        // 5. RESPONDER AL FRONTEND
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Ticket created successfully', ticketId: ticketId }),
        };

    } catch (error) {
        console.error("Error en submit-ticket:", error);
        return { statusCode: 500, body: JSON.stringify({ error: 'No se pudo procesar el ticket.' }) };
    }
};
