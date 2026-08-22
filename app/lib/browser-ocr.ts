"use client";

export type OcrProgress = {
  stage: "loading" | "rendering" | "recognizing" | "complete";
  page: number;
  totalPages: number;
  percent: number;
  message: string;
};

export type OcrPage = {
  page: number;
  text: string;
  confidence: number;
  previewDataUrl?: string;
};

export type OcrResult = {
  text: string;
  confidence: number;
  pageCount: number;
  pages: OcrPage[];
};

const MAX_PDF_PAGES = 12;
const MAX_RENDER_PIXELS = 2_200_000;
const TARGET_SCALE = 1.7;

function cleanOcrText(value: string) {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

function progressPercent(page: number, totalPages: number, fraction = 0) {
  return Math.min(99, Math.round(((page - 1 + fraction) / Math.max(1, totalPages)) * 100));
}

async function createOcrWorker(
  totalPages: number,
  currentPage: () => number,
  onProgress?: (progress: OcrProgress) => void,
) {
  const { createWorker, OEM, PSM } = await import("tesseract.js");
  const worker = await createWorker("eng", OEM.LSTM_ONLY, {
    workerPath: "/ocr/tesseract/worker.min.js",
    corePath: "/ocr/tesseract/core",
    langPath: "/ocr/tesseract/lang",
    gzip: true,
    logger(message) {
      if (!onProgress || message.status !== "recognizing text") return;
      const page = currentPage();
      onProgress({
        stage: "recognizing",
        page,
        totalPages,
        percent: progressPercent(page, totalPages, Number(message.progress || 0)),
        message: `Reading page ${page} of ${totalPages}…`,
      });
    },
  });
  await worker.setParameters({
    tessedit_pageseg_mode: PSM.AUTO,
    preserve_interword_spaces: "1",
  });
  return worker;
}

function canvasForViewport(width: number, height: number) {
  const pixelCount = Math.max(1, width * height);
  const boundedScale = Math.min(TARGET_SCALE, Math.sqrt(MAX_RENDER_PIXELS / pixelCount));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(width * boundedScale));
  canvas.height = Math.max(1, Math.floor(height * boundedScale));
  return { canvas, scale: boundedScale };
}

function releaseCanvas(canvas: HTMLCanvasElement) {
  canvas.width = 1;
  canvas.height = 1;
  canvas.remove();
}

async function recognizePdf(
  blob: Blob,
  onProgress?: (progress: OcrProgress) => void,
  signal?: AbortSignal,
) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/ocr/pdf.worker.min.mjs";
  const pdf = await pdfjs.getDocument({
    data: new Uint8Array(await blob.arrayBuffer()),
    isEvalSupported: false,
  }).promise;
  if (pdf.numPages > MAX_PDF_PAGES) {
    await pdf.destroy();
    throw new Error(
      `This OCR review can read up to ${MAX_PDF_PAGES} pages at once. Split this ${pdf.numPages}-page PDF into smaller evidence files first.`,
    );
  }

  let activePage = 1;
  onProgress?.({
    stage: "loading",
    page: 1,
    totalPages: pdf.numPages,
    percent: 0,
    message: "Loading the private OCR engine…",
  });
  const worker = await createOcrWorker(pdf.numPages, () => activePage, onProgress);
  const pages: OcrPage[] = [];
  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      if (signal?.aborted) throw new DOMException("OCR review cancelled.", "AbortError");
      activePage = pageNumber;
      onProgress?.({
        stage: "rendering",
        page: pageNumber,
        totalPages: pdf.numPages,
        percent: progressPercent(pageNumber, pdf.numPages),
        message: `Rendering page ${pageNumber} of ${pdf.numPages} locally…`,
      });
      const page = await pdf.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1 });
      const { canvas, scale } = canvasForViewport(baseViewport.width, baseViewport.height);
      const viewport = page.getViewport({ scale });
      const context = canvas.getContext("2d", { alpha: false, willReadFrequently: true });
      if (!context) throw new Error("The browser could not prepare a canvas for OCR.");
      context.fillStyle = "#fff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, canvasContext: context, viewport }).promise;
      const previewDataUrl = canvas.toDataURL("image/jpeg", 0.82);
      const result = await worker.recognize(canvas);
      pages.push({
        page: pageNumber,
        text: cleanOcrText(result.data.text || ""),
        confidence: Number(result.data.confidence || 0),
        previewDataUrl,
      });
      page.cleanup();
      releaseCanvas(canvas);
    }
  } finally {
    await worker.terminate();
    await pdf.destroy();
  }
  return pages;
}

async function recognizeImage(
  blob: Blob,
  onProgress?: (progress: OcrProgress) => void,
  signal?: AbortSignal,
) {
  if (signal?.aborted) throw new DOMException("OCR review cancelled.", "AbortError");
  const activePage = 1;
  onProgress?.({
    stage: "loading",
    page: 1,
    totalPages: 1,
    percent: 0,
    message: "Loading the private OCR engine…",
  });
  const worker = await createOcrWorker(1, () => activePage, onProgress);
  try {
    const result = await worker.recognize(blob);
    return [{
      page: 1,
      text: cleanOcrText(result.data.text || ""),
      confidence: Number(result.data.confidence || 0),
    }];
  } finally {
    await worker.terminate();
  }
}

export async function recognizeProtectedDocument(
  blob: Blob,
  mediaType: string,
  onProgress?: (progress: OcrProgress) => void,
  signal?: AbortSignal,
): Promise<OcrResult> {
  const pages = mediaType === "application/pdf"
    ? await recognizePdf(blob, onProgress, signal)
    : mediaType.startsWith("image/")
      ? await recognizeImage(blob, onProgress, signal)
      : [];
  if (!pages.length) throw new Error("OCR review is available for PDF, JPG, and PNG evidence.");
  const weightedCharacters = pages.reduce((sum, page) => sum + page.text.length, 0);
  const confidence = weightedCharacters
    ? pages.reduce((sum, page) => sum + page.confidence * page.text.length, 0) / weightedCharacters
    : 0;
  const text = pages
    .map((page) => `--- Page ${page.page} ---\n${page.text || "[No readable text detected]"}`)
    .join("\n\n");
  onProgress?.({
    stage: "complete",
    page: pages.length,
    totalPages: pages.length,
    percent: 100,
    message: "OCR draft ready for citizen review.",
  });
  return {
    text,
    confidence: Math.round(confidence * 10) / 10,
    pageCount: pages.length,
    pages,
  };
}
