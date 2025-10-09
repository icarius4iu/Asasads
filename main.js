import { Designer } from '@pdfme/ui';
import { text, image, barcodes, multiVariableText, date, time, dateTime, table, select, radioGroup, checkbox } from '@pdfme/schemas';


// Importa los esquemas necesarios

import template from './template.js';
import { htmlToPdfmeTemplate } from './htmlToPdfmeTemplate.js';

const domContainer = document.getElementById('container');

// Inicializa el diseñador con template dinámico (intentamos cargar HTML desde backend)
async function initDesigner() {
    let usedTemplate = template;
    try {
        const resp = await fetch('/template.html');
        if (resp.ok) {
            const html = await resp.text();
            const converted = htmlToPdfmeTemplate(html);
            // Si la conversión devolvió algo válido, lo usamos
            if (converted && converted.schemas && converted.schemas.length) {
                usedTemplate = converted;
            }
        }
    } catch (e) {
        // fallback silencioso al template importado
        console.warn('No se pudo cargar template.html, usando template por defecto', e);
    }

    const designer = new Designer({
        domContainer,
        template: usedTemplate,
        plugins: {
            text,
            image,
            multiVariableText,
            qrcode: barcodes.qrcode,
            date,
            time,
            dateTime,
            table,
            select,
            radioGroup,
            checkbox
        },
    });

    return designer;
}

initDesigner();