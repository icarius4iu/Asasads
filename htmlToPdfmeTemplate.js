/**
 * Convierte una cadena HTML (report/Jasper) en un template compatible con pdfme.
 * - Usa DOMParser para parsear el HTML.
 * - Extrae width/height de .jr-page para basePdf.
 * - Mapea cada .jr-el a un schema de pdfme (asume text para data-type='textField').
 * - Incluye data-uuid en la propiedad dataUuid del schema.
 *
 * Retorna: { basePdf: { width, height, padding }, schemas: [ [page1Elems...], [page2Elems...] ] }
 */
export function htmlToPdfmeTemplate(htmlString, options = {}) {
  // Opciones: dpi (para convertir px a mm), targetUnit ("mm" o "px")
  const { dpi = 72, targetUnit = 'mm' } = options;

  // Helper: extrae primer número (float/int) de una cadena tipo '123px' -> 123
  const pxToNum = (v) => {
    if (v == null) return 0;
    const m = String(v).match(/-?\d+(?:\.\d+)?/);
    return m ? parseFloat(m[0]) : 0;
  };

  // Convierte px a mm usando dpi: 1in = 25.4mm, 1in = dpi px => 1px = 25.4/dpi mm
  const pxToMm = (px) => (px * 25.4) / dpi;

  // Si targetUnit es 'px' devolvemos valores en px (factor = 1), si 'mm' usamos pxToMm
  const scaleFn = targetUnit === 'px' ? (v) => v : (v) => pxToMm(v);

  // Helper: parsea un string style CSS en objeto { left: '10px', top: '5px', ... }
  const parseStyle = (styleString) => {
    const obj = {};
    if (!styleString) return obj;
    styleString.split(';').forEach((pair) => {
      const [k, ...rest] = pair.split(':');
      if (!k) return;
      obj[k.trim()] = rest.join(':').trim();
    });
    return obj;
  };

  // Limpia secuencias escapadas comunes que vienen en las expresiones Jasper
  // Ej: \" -> ", \\ -> \, \n -> nueva línea (si corresponde)
  const unescapeJasperString = (s) => {
    if (!s) return s;
    // Primero, reemplazar saltos de línea por un espacio para preservar separación entre tokens
    let res = String(s).replace(/\r?\n/g, ' ');
    // Reemplazar sequences comunes: \" -> ", \\\\ -> \\, \\' -> '
    res = res.replace(/\\\\/g, '\\\\TEMP_BACKSLASH');
    res = res.replace(/\\\"/g, '"');
    res = res.replace(/\\\'/g, "'");
    // restaurar backslashes simples
    res = res.replace(/\\TEMP_BACKSLASH/g, '\\');
    // también limpiar comillas innecesarias envolventes: "..." -> ...
    if (res.startsWith('"') && res.endsWith('"')) {
      res = res.slice(1, -1);
    }
    return res;
  };

  // Normaliza espacios: colapsa múltiples espacios en uno y trim
  const normalizeWhitespace = (s) => {
    return String(s).replace(/\s+/g, ' ').trim();
  };

  // Convierte patrones concatenados de Jasper del tipo "text " + $P{param} + " more"
  // a una representación legible con placeholders: text {param} more
  const convertJasperConcatenationToPlaceholders = (s) => {
    if (!s) return s;
    let out = s;
    // Reemplazar $P{param} por {param}
    out = out.replace(/\$P\{([^}]+)\}/g, '{$1}');
    // Reemplazar concatenadores comunes: " + " o + " etc. por espacios (ya limpiados antes)
    // También quitar secuencias de + que queden
    out = out.replace(/"\s*\+\s*"/g, '');
    out = out.replace(/\+\s*/g, ' ');
    return normalizeWhitespace(out);
  };

  // parse HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');

  // buscar páginas
  const pageNodes = Array.from(doc.querySelectorAll('.jr-page'));
  const pages = pageNodes.length ? pageNodes : [doc.body];

  const schemas = pages.map((page) => {
    const pageStyle = parseStyle(page.getAttribute('style') || '');
    const pageWidth = pxToNum(pageStyle.width || pageStyle['min-width'] || 0);
    const pageHeight = pxToNum(pageStyle.height || pageStyle['min-height'] || 0);

    const elNodes = Array.from(page.querySelectorAll('.jr-el'));
    const pageSchemas = elNodes.map((el, idx) => {
      const dataType = (el.getAttribute('data-type') || '').trim();
      const type = dataType === 'textField' || dataType === 'text' ? 'text' : 'text';

      const styleObj = parseStyle(el.getAttribute('style') || '');
      const left = pxToNum(styleObj.left || styleObj.x || 0);
      const top = pxToNum(styleObj.top || styleObj.y || 0);
      const width = pxToNum(styleObj.width || 0);
      const height = pxToNum(styleObj.height || 0);

      const dataUuid = el.getAttribute('data-uuid') || null;
      const dataKey = el.getAttribute('data-key') || null;

    let rawText = unescapeJasperString((el.innerText || '') || '');
    rawText = convertJasperConcatenationToPlaceholders(rawText);

      const name = dataKey || dataUuid || `field_${idx + 1}`;

      // detectar placeholders del tipo {param}
      const placeholderMatches = Array.from(rawText.matchAll(/\{([^}]+)\}/g)).map(m => m[1]);

      // si hay placeholders, convertir el tipo a multiVariableText y generar variables
      const isMulti = placeholderMatches.length > 0;
      const finalType = isMulti ? 'multiVariableText' : type;

      const converted = {
        name,
        type: finalType,
        text: rawText,
        content: rawText,
        position: { x: scaleFn(left), y: scaleFn(top) },
        width: scaleFn(width),
        height: scaleFn(height),
        rotate: 0,
        alignment: 'left',
        verticalAlignment: 'top',
        fontSize: 12,
        lineHeight: 1,
        characterSpacing: 0,
        fontColor: '#000000',
        fontName: 'Roboto',
        backgroundColor: '',
        opacity: 1,
        strikethrough: false,
        underline: false,
        required: false,
        readOnly: false,
        dataUuid,
      };

      if (isMulti) {
        // construir content mapping simple: {v1: 'VAR_NAME', ...} pero usaremos los nombres tal cual
        const variables = placeholderMatches;
        // content se espera a veces como JSON string por compatibilidad en templates previos
        try {
          converted.content = JSON.stringify(variables.reduce((acc, v, i) => {
            // generar claves v1, v2... conservando el nombre original en values
            acc[v] = v;
            return acc;
          }, {}));
        } catch (e) {
          converted.content = rawText;
        }
        converted.variables = variables;
      }

      // agregar metadatos originales en px para posible reconversión
      converted.meta = {
        originalPx: { x: left, y: top, width, height },
      };

      return converted;
    });

    // attach metadata so we can pick basePdf from first page
    pageSchemas._pageMeta = { width: pageWidth, height: pageHeight };
    return pageSchemas;
  });

  const firstPageMeta = (schemas[0] && schemas[0]._pageMeta) || { width: 0, height: 0 };
  schemas.forEach((p) => { if (p._pageMeta) delete p._pageMeta; });

  // construir basePdf con unidades convertidas y meta con info de escala
  const baseWidth = targetUnit === 'px' ? firstPageMeta.width : pxToMm(firstPageMeta.width || 595);
  const baseHeight = targetUnit === 'px' ? firstPageMeta.height : pxToMm(firstPageMeta.height || 842);

  const template = {
    basePdf: {
      width: baseWidth,
      height: baseHeight,
      padding: [0, 0, 0, 0],
      meta: {
        originalPx: { width: firstPageMeta.width, height: firstPageMeta.height },
        dpi,
        unit: targetUnit,
        scaleFn: targetUnit === 'px' ? '1' : `px->mm (dpi=${dpi})`,
      },
    },
    schemas,
  };

  return template;
}
