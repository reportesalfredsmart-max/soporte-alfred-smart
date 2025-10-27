// netlify/functions/check-status.js
const { GoogleSpreadsheet } = require('google-spreadsheet');
const creds = JSON.parse(process.env.GOOGLE_SHEET_CREDENTIALS);

exports.handler = async (event, context) => {
    const { email, ticketId } = event.queryStringParameters;

    if (!email || !ticketId) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Faltan parámetros' }) };
    }

    try {
        const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID);
        await doc.useServiceAccountAuth(creds);
        await doc.loadInfo();
        const sheet = doc.sheetsByIndex[0];
        const rows = await sheet.getRows();

        const ticket = rows.find(row => row['ID Ticket'] === ticketId && row['Email Usuario'] === email);

        if (ticket) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    id: ticket['ID Ticket'],
                    estado: ticket['Estado'],
                    notas: ticket['Notas del Soporte'],
                    fecha: ticket['Fecha y Hora']
                }),
            };
        } else {
            return { statusCode: 404, body: JSON.stringify({ error: 'Ticket no encontrado' }) };
        }
    } catch (error) {
        console.error("Error consultando Google Sheets:", error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Error del servidor' }) };
    }
};
