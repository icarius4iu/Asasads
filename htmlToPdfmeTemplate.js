/**
 * Convierte una cadena HTML (report/Jasper) en un template compatible con pdfme.
 * - Soporta HTML del backend v2 con múltiples .jr-page pre-paginadas.
 * - Cada .jr-page del HTML se convierte en una página del template pdfme.
 *
 * Retorna: { basePdf: { width, height, padding }, schemas: [ [page1Elems...], [page2Elems...] ] }
 */
export function htmlToPdfmeTemplate(htmlString, options = {}) {
  const { dpi = 72, targetUnit = 'mm' } = options;

  // Helper: extrae número de una cadena tipo '123px' -> 123
  const pxToNum = (v) => {
    if (v == null) return 0;
    const m = String(v).match(/-?\d+(?:\.\d+)?/);
    return m ? parseFloat(m[0]) : 0;
  };

  // Convierte px a mm
  const pxToMm = (px) => (px * 25.4) / dpi;
  const scaleFn = targetUnit === 'px' ? (v) => v : (v) => pxToMm(v);

  // Parsea string style CSS en objeto
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

  // Limpia texto de secuencias escapadas (para compatibilidad con v1)
  const cleanText = (s) => {
    if (!s) return '';
    let result = String(s);
    // Normalizar espacios y quitar escapes residuales
    result = result.replace(/\r?\n/g, ' ');
    result = result.replace(/\s+/g, ' ').trim();
    return result;
  };

  // Parse HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');

  // Buscar todas las páginas .jr-page
  const pageNodes = Array.from(doc.querySelectorAll('.jr-page'));
  
  // Si no hay páginas, usar body como fallback
  const pages = pageNodes.length > 0 ? pageNodes : [doc.body];

  // Obtener dimensiones de la primera página
  const firstPageStyle = parseStyle(pages[0]?.getAttribute('style') || '');
  const pageWidthPx = pxToNum(firstPageStyle.width || 595);
  const pageHeightPx = pxToNum(firstPageStyle.height || 842);

  // Procesar cada página
  const schemas = pages.map((page, pageIdx) => {
    const elNodes = Array.from(page.querySelectorAll('.jr-el'));
    
    return elNodes.map((el, idx) => {
      const dataType = (el.getAttribute('data-type') || '').trim();
      const styleObj = parseStyle(el.getAttribute('style') || '');
      
      const left = pxToNum(styleObj.left || 0);
      const top = pxToNum(styleObj.top || 0);
      const width = pxToNum(styleObj.width || 0);
      const height = pxToNum(styleObj.height || 0);

      const dataUuid = el.getAttribute('data-uuid') || null;
      const dataKey = el.getAttribute('data-key') || null;
      const rawText = cleanText(el.innerText || '');

      const name = dataKey || dataUuid || `field_p${pageIdx + 1}_${idx + 1}`;

      // Detectar placeholders {param}
      const placeholderMatches = Array.from(rawText.matchAll(/\{([^}]+)\}/g)).map(m => m[1]);
      const isMulti = placeholderMatches.length > 0;
      const finalType = isMulti ? 'multiVariableText' : 'text';

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
        fontSize: 10,
        lineHeight: 1.2,
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
        try {
          converted.content = JSON.stringify(placeholderMatches.reduce((acc, v) => {
            acc[v] = v;
            return acc;
          }, {}));
          converted.variables = placeholderMatches;
        } catch (e) {
          converted.content = rawText;
        }
      }

      return converted;
    });
  });

  // Construir basePdf
  const baseWidth = targetUnit === 'px' ? pageWidthPx : pxToMm(pageWidthPx);
  const baseHeight = targetUnit === 'px' ? pageHeightPx : pxToMm(pageHeightPx);

  const template = {
    basePdf: {
      width: baseWidth,
      height: baseHeight,
      padding: [0, 0, 0, 0],
      meta: {
        originalPx: { width: pageWidthPx, height: pageHeightPx },
        numPages: schemas.length,
        dpi,
        unit: targetUnit,
      },
    },
    schemas,
  };

  console.log(`📄 Template convertido: ${schemas.length} página(s), ${schemas.reduce((sum, p) => sum + p.length, 0)} elementos`);

  return template;
}
