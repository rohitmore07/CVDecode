// pdf-parse (via pdfjs-dist) needs DOMMatrix, ImageData and Path2D the moment it is
// loaded. Those normally come from the optional package @napi-rs/canvas, which can be
// missing on serverless hosts like Vercel. A static import of pdf-parse then crashed
// the whole server at startup. So pdf-parse is loaded lazily, only when a PDF is
// actually analyzed, and simple stand-ins are used if the real ones are unavailable
// (extracting text never draws anything, so stand-ins are enough).
async function ensureCanvasGlobals() {
  const g = globalThis as any;
  if (g.DOMMatrix && g.ImageData && g.Path2D) return;
  try {
    const canvas: any = await import('@napi-rs/canvas');
    g.DOMMatrix ??= canvas.DOMMatrix;
    g.ImageData ??= canvas.ImageData;
    g.Path2D ??= canvas.Path2D;
  } catch (err) {
    console.warn('@napi-rs/canvas not available, using text-only stand-ins');
  }
  g.DOMMatrix ??= class DOMMatrix {};
  g.ImageData ??= class ImageData {};
  g.Path2D ??= class Path2D {};
}

export async function extractPDFText(dataBuffer: Buffer): Promise<string> {
  let parser: any;
  try {
    await ensureCanvasGlobals();
    const { PDFParse } = await import('pdf-parse');
    // Instantiate using v2 structure
    parser = new PDFParse({ data: dataBuffer });
    const result = await parser.getText();
    return result.text;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw error;
  } finally {
    if (parser) {
      await parser.destroy();
    }
  }
}