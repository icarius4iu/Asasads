import { Designer } from '@pdfme/ui';
import { generate } from '@pdfme/generator';
import { text, image, barcodes, multiVariableText, date, time, dateTime, table, select, radioGroup, checkbox } from '@pdfme/schemas';

import template from './template.js';
import { htmlToPdfmeTemplate } from './htmlToPdfmeTemplate.js';

const domContainer = document.getElementById('container');

// Variables globales para acceso desde funciones
let designer = null;
let currentTemplate = null;

// Inicializa el diseñador con template dinámico
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
                console.log(`📄 Template cargado: ${converted.basePdf.meta?.numPages || 1} página(s)`);
            }
        }
    } catch (e) {
        console.warn('No se pudo cargar template.html, usando template por defecto', e);
    }

    currentTemplate = usedTemplate;

    designer = new Designer({
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

    // Exponer globalmente para debugging
    window.pdfmeDesigner = designer;
    window.currentTemplate = currentTemplate;

    return designer;
}

// Función para descargar el template como JSON
function downloadTemplate() {
    if (!designer) {
        alert('El designer no está inicializado');
        return;
    }

    try {
        const templateData = designer.getTemplate();
        const jsonString = JSON.stringify(templateData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `pdfme-template-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('✅ Template descargado exitosamente');
    } catch (error) {
        console.error('Error descargando template:', error);
        alert('Error al descargar el template: ' + error.message);
    }
}

// Función para generar PDF
async function generatePdf() {
    if (!designer) {
        alert('El designer no está inicializado');
        return;
    }

    try {
        const templateData = designer.getTemplate();
        
        // Crear inputs vacíos para cada página
        const inputs = templateData.schemas.map((pageSchema) => {
            const pageInputs = {};
            pageSchema.forEach((field) => {
                // Usar el content o text del campo como valor por defecto
                pageInputs[field.name] = field.content || field.text || '';
            });
            return pageInputs;
        });

        console.log('🔄 Generando PDF...');
        
        const pdf = await generate({
            template: templateData,
            inputs: inputs,
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

        // Descargar el PDF
        const blob = new Blob([pdf.buffer], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `documento-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('✅ PDF generado exitosamente');
    } catch (error) {
        console.error('Error generando PDF:', error);
        alert('Error al generar el PDF: ' + error.message);
    }
}

// Event listeners para los botones
document.getElementById('btnDownloadTemplate')?.addEventListener('click', downloadTemplate);
document.getElementById('btnGeneratePdf')?.addEventListener('click', generatePdf);

// Inicializar
initDesigner();

// Exponer funciones globalmente para uso desde consola
window.downloadTemplate = downloadTemplate;
window.generatePdf = generatePdf;