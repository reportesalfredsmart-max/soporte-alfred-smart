// js/dashboard.js

document.getElementById('status-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusDiv = document.getElementById('ticket-status');
    
    // Mostrar mensaje de carga
    statusDiv.className = 'alert alert-info';
    statusDiv.innerHTML = '<i class="bi bi-hourglass-split"></i> Buscando ticket...';
    statusDiv.style.display = 'block';

    const email = document.getElementById('email').value;
    const ticketId = document.getElementById('ticket-id').value;

    try {
        const response = await fetch(`/.netlify/functions/check-status?email=${encodeURIComponent(email)}&ticketId=${encodeURIComponent(ticketId)}`);
        const ticket = await response.json();

        if (response.ok && ticket) {
            // Si se encontró el ticket, mostrar éxito
            statusDiv.className = 'alert alert-success';
            statusDiv.innerHTML = `
                <h4 class="alert-heading"><i class="bi bi-check-circle-fill"></i> Ticket Encontrado</h4>
                <p class="mb-2"><strong>Número de Ticket:</strong> ${ticket.id}</p>
                <p class="mb-2"><strong>Estado Actual:</strong> <span class="badge bg-primary">${ticket.estado}</span></p>
                <p class="mb-2"><strong>Notas del Soporte:</strong> ${ticket.notas || 'Aún no hay notas.'}</p>
                <hr>
                <p class="mb-0"><small><strong>Última Actualización:</strong> ${new Date(ticket.fecha).toLocaleString()}</small></p>
            `;
        } else {
            // Si no se encontró, mostrar advertencia
            statusDiv.className = 'alert alert-warning';
            statusDiv.innerHTML = '<i class="bi bi-exclamation-triangle-fill"></i> No se encontró un ticket con esos datos. Por favor, verifica el correo y el número de ticket.';
        }
    } catch (error) {
        // Si hay un error de red, mostrar peligro
        statusDiv.className = 'alert alert-danger';
        statusDiv.innerHTML = '<i class="bi bi-x-circle-fill"></i> Error al conectar con el servidor. Inténtalo más tarde.';
        console.error(error);
    }
});
