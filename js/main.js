// js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. LÓGICA DE SUBCATEGORÍAS ---

    // Obtenemos los elementos del DOM que necesitamos manipular
    const dispositivoSelect = document.getElementById('dispositivo');
    const subcategoriaContainer = document.getElementById('subcategoria-container');
    const subcategoriaSelect = document.getElementById('subcategoria');

    // Este objeto actúa como una pequeña base de datos de subcategorías.
    // Puedes añadir más opciones aquí fácilmente.
    const subcategorias = {
        'Clima': ['No enfría', 'No calienta', 'Fuga de agua', 'Ruidos extraños', 'No responde a la app'],
        'Persianas': ['No sube/baja', 'Atascada a mitad de camino', 'Hace ruido', 'No responde a la app'],
        'Iluminación': ['Parpadea', 'No enciende', 'Cambia de color sola', 'No responde a la app'],
        'Accesos': ['Llave/código no funciona', 'Cerradura atascada', 'Problema con lector biométrico', 'Batería baja'],
        'Datos de Consumo': ['Datos incorrectos', 'No se actualizan', 'Sensor dañado'],
        'Reservas de Espacios': ['No puedo reservar', 'Reserva no aparece', 'Error en el calendario'],
        'Otros': [] // Para 'Otros', no mostraremos subcategorías predefinidas
    };

    // Añadimos un "escuchador" de eventos. Cuando el usuario cambie la selección del dispositivo...
    dispositivoSelect.addEventListener('change', () => {
        const selectedDevice = dispositivoSelect.value;
        // Limpiamos las opciones anteriores
        subcategoriaSelect.innerHTML = '<option value="">Selecciona...</option>';

        // Si el dispositivo seleccionado tiene subcategorías en nuestro objeto...
        if (subcategorias[selectedDevice]) {
            subcategorias[selectedDevice].forEach(sub => {
                const option = document.createElement('option');
                option.value = sub;
                option.textContent = sub;
                subcategoriaSelect.appendChild(option);
            });
            // Mostramos el contenedor de la subcategoría
            subcategoriaContainer.style.display = 'block';
        } else {
            // Si no, lo ocultamos
            subcategoriaContainer.style.display = 'none';
        }
    });


  // --- 2. LÓGICA DE ENVÍO DEL FORMULARIO (MEJORADA) ---

const form = document.getElementById('incident-form');
const statusDiv = document.getElementById('form-status');

form.addEventListener('submit', async function (e) {
    // Prevenimos el comportamiento por defecto del formulario (recargar la página)
    e.preventDefault();
    
    // Mostramos el div y el mensaje de carga
    statusDiv.style.display = 'block';
    statusDiv.className = 'alert alert-info'; // Usamos clases de Bootstrap
    statusDiv.innerHTML = '<i class="bi bi-hourglass-split"></i> Enviando reporte...';

    const formData = new FormData(form);

    try {
        const response = await fetch('/.netlify/functions/submit-ticket', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            const result = await response.json();
            // Mensaje de éxito
            statusDiv.className = 'alert alert-success';
            statusDiv.innerHTML = `
                <h4 class="alert-heading"><i class="bi bi-check-circle-fill"></i> ¡Reporte enviado con éxito!</h4>
                <p class="mb-0">Tu número de ticket es: <strong>${result.ticketId}</strong></p>
                <hr>
                <p class="mb-0">Recibirás una confirmación por correo en breve.</p>
            `;
            form.reset();
            subcategoriaContainer.style.display = 'none';
        } else {
            const errorText = await response.text();
            // Mensaje de error
            statusDiv.className = 'alert alert-danger';
            statusDiv.innerHTML = `<i class="bi bi-x-circle-fill"></i> Hubo un problema: ${errorText}`;
        }
    } catch (error) {
        // Mensaje de error de red
        statusDiv.className = 'alert alert-danger';
        statusDiv.innerHTML = `<i class="bi bi-x-circle-fill"></i> Hubo un problema de conexión. Inténtalo de nuevo.`;
        console.error('Error:', error);
    }
});
            // --- MEJORA CLAVE ---
            // Verificamos si la respuesta del servidor fue exitosa (código 200-299)
            if (response.ok) {
                // Si fue exitosa, intentamos parsear el JSON
                const result = await response.json();
                statusDiv.innerHTML = `<strong>¡Reporte enviado con éxito!</strong><br>Tu número de ticket es: <strong>${result.ticketId}</strong><br>Recibirás una confirmación por correo.`;
                form.reset(); // Limpiamos el formulario
                subcategoriaContainer.style.display = 'none'; // Ocultamos subcategorías
            } else {
                // Si hubo un error (400, 500, etc.), leemos el cuerpo de la respuesta como TEXTO
                const errorText = await response.text();
                // Y lanzamos un nuevo error con ese mensaje
                throw new Error(errorText || 'Error al enviar el reporte.');
            }
        } catch (error) {
            // Ahora este bloque mostrará el error real del servidor
            statusDiv.textContent = `Hubo un problema: ${error.message}`;
            console.error('Error:', error);
        }
    });
});
