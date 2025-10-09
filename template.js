import { text, image, barcodes } from '@pdfme/schemas';

const template = {
    schemas: [
        [
            {
                "name": "texto_cabezera contrato linea_1:1",
                "type": "text",
                "content": "CONTRATO",
                "position": {
                    "x": 10,
                    "y": 20
                },
                "width": 190,
                "height": 5,
                "rotate": 0,
                "alignment": "left",
                "verticalAlignment": "top",
                "fontSize": 16,
                "lineHeight": 1,
                "characterSpacing": 0,
                "fontColor": "#000000",
                "fontName": "Roboto",
                "backgroundColor": "",
                "opacity": 1,
                "strikethrough": false,
                "underline": false,
                "required": false,
                "readOnly": false
            },
            {
                "name": "texto_contrato_linea_2",
                "type": "multiVariableText",
                "position": {
                    "x": 10,
                    "y": 30
                },
                "required": true,
                "content": "{\"v2_Regiones\":\"V2_REGIONES\",\"v3_Fecha\":\"V3_FECHA\"}",
                "width": 190,
                "height": 5,
                "rotate": 0,
                "alignment": "left",
                "verticalAlignment": "top",
                "fontSize": 13,
                "lineHeight": 1,
                "characterSpacing": 0,
                "fontColor": "#000000",
                "fontName": "Roboto",
                "backgroundColor": "",
                "opacity": 1,
                "strikethrough": false,
                "underline": false,
                "readOnly": false,
                "text": "El contrato está siendo firmado en {v2_Regiones} con fecha del {v3_Fecha}.",
                "variables": [
                    "v2_Rergiones",
                    "v3_Fecha"
                ]
            },
            {
                "name": "texto_contrato_linea_3:4",
                "type": "multiVariableText",
                "position": {
                    "x": 10,
                    "y": 35
                },
                "required": true,
                "content": "{\"v4_Medio de Notificación\":\"V4_MEDIO DE NOTIFICACIÓN\"}",
                "width": 189.97,
                "height": 9.79,
                "rotate": 0,
                "alignment": "left",
                "verticalAlignment": "top",
                "fontSize": 13,
                "lineHeight": 1,
                "characterSpacing": 0,
                "fontColor": "#000000",
                "fontName": "Roboto",
                "backgroundColor": "",
                "opacity": 1,
                "strikethrough": false,
                "underline": false,
                "readOnly": false,
                "text": "El registro del contrato será comunicado vía {v4_Medio de Notificación} en el plazo de 10 días desde su firma.",
                "variables": [
                    "v4_Medio de Notificación"
                ]
            },
            {
                "name": "texto_contrato_linea_1",
                "type": "multiVariableText",
                "position": {
                    "x": 10,
                    "y": 25
                },
                "required": true,
                "content": "{\"v1_Nombre del Cliente\":\"V1_NOMBRE DEL CLIENTE\"}",
                "width": 189.97,
                "height": 5,
                "rotate": 0,
                "alignment": "left",
                "verticalAlignment": "top",
                "fontSize": 13,
                "lineHeight": 1,
                "characterSpacing": 0,
                "fontColor": "#000000",
                "fontName": "Roboto",
                "backgroundColor": "",
                "opacity": 1,
                "strikethrough": false,
                "underline": false,
                "readOnly": false,
                "text": "Estimado {v1_Nombre del Cliente},",
                "variables": [
                    "v1_Nombre del Cliente"
                ]
            }
        ]
    ],
    basePdf: {
        "width": 210,
        "height": 300,
        "padding": [
            20,
            10,
            20,
            10
        ]
    }
};

export default template;
