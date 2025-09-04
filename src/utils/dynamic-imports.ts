// Dynamic imports for heavy libraries to reduce bundle size and memory usage

export const loadPuppeteer = async () => {
  return (await import('puppeteer')).default;
};

export const loadJsPDF = async () => {
  const { jsPDF } = await import('jspdf');
  return jsPDF;
};

export const loadXLSX = () => {
  return import('xlsx');
};

export const loadHtml2Canvas = async () => {
  return (await import('html2canvas')).default;
};

export const loadReactPDF = () => {
  return import('react-pdf');
};

// Cache for loaded modules to prevent re-imports
const moduleCache = new Map();

export const loadModuleOnce = async <T>(
  moduleKey: string,
  loader: () => Promise<T>
): Promise<T> => {
  if (moduleCache.has(moduleKey)) {
    return moduleCache.get(moduleKey);
  }

  const loadedModule = await loader();
  moduleCache.set(moduleKey, loadedModule);
  return loadedModule;
};
