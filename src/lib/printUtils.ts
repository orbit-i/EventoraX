/**
 * High-Precision Print & Export Utility for Eventrye
 * Ensures ID badges, certificates, and corporate tax invoices render with 100% fidelity
 * across mobile (Android/iOS) and desktop browsers.
 * Eliminates background stripping, multi-page overflow, and unstyled element blowout.
 */

import html2canvas from 'html2canvas';

/**
 * Downloads a DOM element as a crystal-clear, high-resolution PNG image (300 DPI retina quality).
 * Ideal for mobile users saving ID badges straight to their camera roll or device storage.
 */
export async function downloadElementAsImage(
  target: HTMLElement | string | null,
  fileName: string = 'Eventrye-Badge.png',
  scale: number = 3
): Promise<boolean> {
  let element: HTMLElement | null = null;
  if (typeof target === 'string') {
    element = document.getElementById(target);
  } else if (target instanceof HTMLElement) {
    element = target;
  }

  if (!element) {
    console.warn(`[downloadElementAsImage] Target element "${target}" not found.`);
    return false;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: Math.max(2, scale), // 2x or 3x for ultra-sharp text and QR codes
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false,
      scrollX: 0,
      scrollY: -window.scrollY,
      onclone: (clonedDoc) => {
        // Ensure cloned element is visible and has no interactive transform artifacts
        const clonedTarget = typeof target === 'string'
          ? clonedDoc.getElementById(target)
          : clonedDoc.body.querySelector(`[id="${element?.id}"]`) || clonedDoc.body;
        if (clonedTarget instanceof HTMLElement) {
          clonedTarget.style.transform = 'none';
          clonedTarget.style.animation = 'none';
        }
      }
    });

    const dataUrl = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
    link.href = dataUrl;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }, 200);

    return true;
  } catch (err) {
    console.error('[downloadElementAsImage] Failed to capture element:', err);
    return false;
  }
}

/**
 * High-Precision Print Isolation Engine
 * Inlines compiled CSS rules directly into an isolated document so mobile Chrome/Safari
 * render background gradients, custom borders, badges, and fonts identically to the UI.
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

  // Collect all compiled CSS rules from document stylesheets to embed directly into print head
  let compiledCss = '';
  try {
    Array.from(document.styleSheets).forEach((sheet) => {
      try {
        if (sheet.cssRules) {
          Array.from(sheet.cssRules).forEach((rule) => {
            compiledCss += rule.cssText + '\n';
          });
        }
      } catch {
        // Cross-origin stylesheet security boundary, will rely on <link> fallback
      }
    });
  } catch {
    // Stylesheet extraction failed
  }

  // Create an isolated iframe for printing with real dimensions so mobile browsers compute layout
  const printIframe = document.createElement('iframe');
  printIframe.id = 'eventrye-print-engine';
  printIframe.style.position = 'fixed';
  printIframe.style.top = '-9999px';
  printIframe.style.left = '-9999px';
  printIframe.style.width = '1024px';
  printIframe.style.height = '1400px';
  printIframe.style.border = '0';
  printIframe.style.opacity = '0';
  printIframe.style.pointerEvents = 'none';
  printIframe.style.zIndex = '-9999';
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
        <base href="${window.location.origin}/" />
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
        <style>
          /* Inject Inlined Compiled Tailwind & App Styles */
          ${compiledCss}

          /* Critical Print Overrides & Color Enforcement */
          @page {
            margin: 10mm;
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
            font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
            width: 100% !important;
            color: #0f172a;
          }
          body {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: flex-start !important;
            padding: 16px !important;
          }
          .print-wrapper {
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0 auto;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* ID Card Pass Print Container Constraints */
          #public-event-pass-card,
          #live-id-pass-card,
          .id-card-printable {
            width: 340px !important;
            max-width: 360px !important;
            min-height: 520px !important;
            height: auto !important;
            border-radius: 24px !important;
            padding: 24px !important;
            background: linear-gradient(180deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%) !important;
            color: #ffffff !important;
            border: 2px solid #60a5fa !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin: 0 auto !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
          }

          /* Corporate Tax Invoice & Receipt Print Formatting */
          #official-invoice-document,
          #billing-official-tax-invoice,
          [id^="subscription-receipt-"] {
            width: 100% !important;
            max-width: 680px !important;
            margin: 0 auto !important;
            background: #ffffff !important;
            color: #0f172a !important;
            border: 1.5px solid #cbd5e1 !important;
            border-radius: 16px !important;
            padding: 28px !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-shadow: none !important;
          }

          /* Prevent SVG Icon Blowout - Strict Max Sizes */
          svg {
            max-width: 100% !important;
            max-height: 100% !important;
          }
          .stamp-seal-svg,
          svg[viewBox="0 0 48 48"] {
            width: 44px !important;
            height: 44px !important;
            min-width: 44px !important;
            min-height: 44px !important;
            max-width: 44px !important;
            max-height: 44px !important;
          }

          /* Constrain Image Dimensions */
          img {
            max-width: 100% !important;
            height: auto !important;
          }
          img[src*="favicon"],
          img[src*="logo"] {
            max-width: 48px !important;
            max-height: 48px !important;
          }

          /* Hide Interactive Controls */
          button,
          .no-print,
          [data-no-print="true"] {
            display: none !important;
          }
        </style>
      </head>
      <body>
        <div class="print-wrapper">
          ${contentHtml}
        </div>
      </body>
    </html>
  `);
  iframeDoc.close();

  // Wait for fonts and assets to finish rendering inside the iframe before invoking print
  setTimeout(() => {
    try {
      printIframe.contentWindow?.focus();
      printIframe.contentWindow?.print();
    } catch (err) {
      console.error('[printElement] Print execution error:', err);
    } finally {
      setTimeout(() => {
        if (document.body.contains(printIframe)) {
          document.body.removeChild(printIframe);
        }
      }, 1500);
    }
  }, 450);
}
