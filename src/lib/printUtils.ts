/**
 * High-Precision Print Isolation Utility
 * Ensures ONLY the targeted badge, ID pass, or certificate is printed or exported to PDF.
 * Eliminates all web page chrome, headers, footers, sidebars, modal backdrops, and multi-sheet overflow.
 */

export function printElement(
  target: HTMLElement | string | null,
  title: string = 'Eventrye Document'
): void {
  if (!target) return;

  let contentHtml = '';
  if (typeof target === 'string') {
    const el = document.getElementById(target);
    if (!el) {
      console.warn(`[printElement] Element with id "${target}" not found.`);
      return;
    }
    contentHtml = el.outerHTML;
  } else if (target instanceof HTMLElement) {
    contentHtml = target.outerHTML;
  } else {
    return;
  }

  // Extract all stylesheets and style tags from current document
  const styleNodes = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));
  const stylesHtml = styleNodes.map((node) => node.outerHTML).join('\n');

  // Create an isolated hidden iframe
  const printIframe = document.createElement('iframe');
  printIframe.id = 'eventrye-print-iframe';
  printIframe.style.position = 'fixed';
  printIframe.style.right = '0';
  printIframe.style.bottom = '0';
  printIframe.style.width = '0';
  printIframe.style.height = '0';
  printIframe.style.border = '0';
  printIframe.style.visibility = 'hidden';
  document.body.appendChild(printIframe);

  const iframeDoc = printIframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(printIframe);
    window.print();
    return;
  }

  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <title>${title}</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
        ${stylesHtml}
        <style>
          @page {
            margin: 8mm;
            size: auto;
          }
          *, *::before, *::after {
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
            width: 100% !important;
            min-height: 100% !important;
          }
          body {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 16px !important;
          }
          .print-wrapper {
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0 auto;
          }
          /* Remove interactive controls during print */
          button,
          .no-print,
          [data-no-print="true"] {
            display: none !important;
          }
          /* Ensure cards avoid page breaking */
          .print-avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        </style>
      </head>
      <body>
        <div class="print-wrapper print-avoid-break">
          ${contentHtml}
        </div>
      </body>
    </html>
  `);
  iframeDoc.close();

  // Wait for images, fonts, and styles inside iframe to settle before printing
  setTimeout(() => {
    try {
      printIframe.contentWindow?.focus();
      printIframe.contentWindow?.print();
    } catch (err) {
      console.error('[printElement] Print execution error:', err);
    } finally {
      // Remove the temporary iframe after print dialog completes
      setTimeout(() => {
        if (document.body.contains(printIframe)) {
          document.body.removeChild(printIframe);
        }
      }, 1500);
    }
  }, 400);
}
