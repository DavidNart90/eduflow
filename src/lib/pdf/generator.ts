import jsPDF from 'jspdf';
import { format } from 'date-fns';

// PDF Configuration Types
export interface PDFConfig {
  orientation: 'portrait' | 'landscape';
  unit: 'mm' | 'pt' | 'in';
  format: 'a4' | 'a3' | 'letter';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface PDFTheme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
    border: string;
  };
  fonts: {
    primary: string;
    secondary: string;
    mono: string;
  };
  spacing: {
    small: number;
    medium: number;
    large: number;
  };
}

// Default PDF configuration
export const DEFAULT_PDF_CONFIG: PDFConfig = {
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4',
  margins: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20,
  },
};

// Predefined themes
export const PDF_THEMES: Record<string, PDFTheme> = {
  classic_blue: {
    name: 'Classic Blue',
    colors: {
      primary: '#2563eb',
      secondary: '#64748b',
      accent: '#3b82f6',
      text: '#1e293b',
      background: '#ffffff',
      border: '#e2e8f0',
    },
    fonts: {
      primary: 'Inter',
      secondary: 'Inter',
      mono: 'Courier',
    },
    spacing: {
      small: 4,
      medium: 8,
      large: 16,
    },
  },
  modern_green: {
    name: 'Modern Green',
    colors: {
      primary: '#059669',
      secondary: '#64748b',
      accent: '#10b981',
      text: '#1e293b',
      background: '#ffffff',
      border: '#e2e8f0',
    },
    fonts: {
      primary: 'Inter',
      secondary: 'Inter',
      mono: 'Courier',
    },
    spacing: {
      small: 4,
      medium: 8,
      large: 16,
    },
  },
  executive: {
    name: 'Executive',
    colors: {
      primary: '#1f2937',
      secondary: '#6b7280',
      accent: '#374151',
      text: '#111827',
      background: '#ffffff',
      border: '#d1d5db',
    },
    fonts: {
      primary: 'Times',
      secondary: 'Helvetica',
      mono: 'Courier',
    },
    spacing: {
      small: 3,
      medium: 6,
      large: 12,
    },
  },
};

// Base PDF Generator Class
export class PDFGenerator {
  private doc: jsPDF;
  private config: PDFConfig;
  private theme: PDFTheme;
  private pageHeight: number;
  private pageWidth: number;
  private currentY: number;
  private lineHeight: number;

  constructor(
    config: Partial<PDFConfig> = {},
    themeName: string = 'classic_blue'
  ) {
    this.config = { ...DEFAULT_PDF_CONFIG, ...config };
    this.theme = PDF_THEMES[themeName] || PDF_THEMES.classic_blue;

    this.doc = new jsPDF({
      orientation: this.config.orientation,
      unit: this.config.unit,
      format: this.config.format,
    });

    // Calculate page dimensions
    const pageSize = this.doc.internal.pageSize;
    this.pageHeight = pageSize.getHeight();
    this.pageWidth = pageSize.getWidth();
    this.currentY = this.config.margins.top;
    this.lineHeight = 6;

    this.setupFonts();
  }

  private setupFonts(): void {
    // Set default font
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    this.doc.setTextColor(this.theme.colors.text);
  }

  // Header methods
  public addHeader(title: string, subtitle?: string, logoUrl?: string): void {
    // Logo (if provided)
    if (logoUrl) {
      // NOTE: Logo loading and placement to be implemented
      // For now, we'll reserve space
      this.currentY += 15;
    }

    // Title
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(this.theme.colors.primary);
    this.doc.text(title, this.config.margins.left, this.currentY);
    this.currentY += 8;

    // Subtitle
    if (subtitle) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(this.theme.colors.secondary);
      this.doc.text(subtitle, this.config.margins.left, this.currentY);
      this.currentY += 6;
    }

    // Header line
    const borderRgb = PDFGenerator.hexToRgb(this.theme.colors.border);
    this.doc.setDrawColor(borderRgb.r, borderRgb.g, borderRgb.b);
    this.doc.setLineWidth(0.5);
    this.doc.line(
      this.config.margins.left,
      this.currentY + 2,
      this.pageWidth - this.config.margins.right,
      this.currentY + 2
    );
    this.currentY += 8;
  } // Text methods
  public addTitle(text: string, level: 1 | 2 | 3 = 1): void {
    const sizes = { 1: 16, 2: 14, 3: 12 };
    const margins = { 1: 8, 2: 6, 3: 4 };

    this.checkPageBreak(margins[level]);

    this.doc.setFontSize(sizes[level]);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(this.theme.colors.primary);
    this.doc.text(text, this.config.margins.left, this.currentY);
    this.currentY += margins[level];
  }

  public addText(
    text: string,
    options: {
      fontSize?: number;
      fontStyle?: 'normal' | 'bold' | 'italic';
      color?: string;
      marginBottom?: number;
      align?: 'left' | 'center' | 'right';
    } = {}
  ): void {
    const {
      fontSize = 10,
      fontStyle = 'normal',
      color = this.theme.colors.text,
      marginBottom = 4,
      align = 'left',
    } = options;

    this.checkPageBreak(fontSize / 2);

    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', fontStyle);
    this.doc.setTextColor(color);

    const textWidth =
      this.pageWidth - this.config.margins.left - this.config.margins.right;
    const lines = this.doc.splitTextToSize(text, textWidth);

    let x = this.config.margins.left;
    if (align === 'center') {
      x = this.pageWidth / 2;
    } else if (align === 'right') {
      x = this.pageWidth - this.config.margins.right;
    }

    this.doc.text(lines, x, this.currentY, { align });
    this.currentY += lines.length * this.lineHeight + marginBottom;
  }

  // Table methods
  public addTable(data: {
    headers: string[];
    rows: (string | number)[][];
    columnWidths?: number[];
    headerStyle?: {
      backgroundColor?: string;
      textColor?: string;
      fontSize?: number;
    };
    rowStyle?: {
      fontSize?: number;
      textColor?: string;
      alternatingRows?: boolean;
    };
  }): void {
    const {
      headers,
      rows,
      columnWidths,
      headerStyle = {},
      rowStyle = {},
    } = data;

    const tableWidth =
      this.pageWidth - this.config.margins.left - this.config.margins.right;
    const colWidths =
      columnWidths || headers.map(() => tableWidth / headers.length);
    const rowHeight = 8;

    // Check if table fits on current page
    const tableHeight =
      (headers.length > 0 ? rowHeight : 0) + rows.length * rowHeight;
    this.checkPageBreak(tableHeight);

    let currentX = this.config.margins.left;
    let currentTableY = this.currentY;

    // Draw headers
    if (headers.length > 0) {
      // Convert hex color to RGB for setFillColor
      const headerBgColor =
        headerStyle.backgroundColor || this.theme.colors.primary;
      const rgb = PDFGenerator.hexToRgb(headerBgColor);
      this.doc.setFillColor(rgb.r, rgb.g, rgb.b);

      const headerTextColor = headerStyle.textColor || '#ffffff';
      this.doc.setTextColor(headerTextColor);
      this.doc.setFontSize(headerStyle.fontSize || 10);
      this.doc.setFont('helvetica', 'bold');

      // Header background
      this.doc.rect(
        this.config.margins.left,
        currentTableY - rowHeight + 2,
        tableWidth,
        rowHeight,
        'F'
      );

      // Header text
      headers.forEach((header, index) => {
        this.doc.text(header, currentX + colWidths[index] / 2, currentTableY, {
          align: 'center',
        });
        currentX += colWidths[index];
      });

      currentTableY += rowHeight;
    }

    // Draw rows
    this.doc.setTextColor(rowStyle.textColor || this.theme.colors.text);
    this.doc.setFontSize(rowStyle.fontSize || 9);
    this.doc.setFont('helvetica', 'normal');

    rows.forEach((row, rowIndex) => {
      currentX = this.config.margins.left;

      // Alternating row background
      if (rowStyle.alternatingRows && rowIndex % 2 === 1) {
        this.doc.setFillColor(248, 250, 252); // #f8fafc in RGB
        this.doc.rect(
          this.config.margins.left,
          currentTableY - rowHeight + 2,
          tableWidth,
          rowHeight,
          'F'
        );
      }

      // Row data
      row.forEach((cell, cellIndex) => {
        const cellText = cell.toString();
        this.doc.text(cellText, currentX + 2, currentTableY, { align: 'left' });
        currentX += colWidths[cellIndex];
      });

      currentTableY += rowHeight;
    });

    // Table border
    const borderRgb = PDFGenerator.hexToRgb(this.theme.colors.border);
    this.doc.setDrawColor(borderRgb.r, borderRgb.g, borderRgb.b);
    this.doc.setLineWidth(0.5);
    this.doc.rect(
      this.config.margins.left,
      this.currentY - (headers.length > 0 ? rowHeight : 0),
      tableWidth,
      (headers.length > 0 ? rowHeight : 0) + rows.length * rowHeight
    );

    // Column separators
    currentX = this.config.margins.left;
    colWidths.forEach((width, index) => {
      if (index > 0) {
        this.doc.line(
          currentX,
          this.currentY - (headers.length > 0 ? rowHeight : 0),
          currentX,
          currentTableY
        );
      }
      currentX += width;
    });

    this.currentY = currentTableY + 4;
  }

  // Utility methods
  public addSpacer(height: number = 5): void {
    this.currentY += height;
  }

  public addPageBreak(): void {
    this.doc.addPage();
    this.currentY = this.config.margins.top;
  }

  private checkPageBreak(requiredHeight: number): void {
    if (
      this.currentY + requiredHeight >
      this.pageHeight - this.config.margins.bottom
    ) {
      this.addPageBreak();
    }
  }

  private static hexToRgb(hex: string): { r: number; g: number; b: number } {
    // Remove # if present
    const cleanHex = hex.replace('#', '');

    // Convert to RGB
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);

    return { r, g, b };
  }

  public addFooter(text: string): void {
    const pageCount = this.doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(this.theme.colors.secondary);

      // Footer text
      this.doc.text(
        text,
        this.config.margins.left,
        this.pageHeight - this.config.margins.bottom + 5
      );

      // Page number
      this.doc.text(
        `Page ${i} of ${pageCount}`,
        this.pageWidth - this.config.margins.right,
        this.pageHeight - this.config.margins.bottom + 5,
        { align: 'right' }
      );

      // Footer line
      const borderRgb = PDFGenerator.hexToRgb(this.theme.colors.border);
      this.doc.setDrawColor(borderRgb.r, borderRgb.g, borderRgb.b);
      this.doc.setLineWidth(0.5);
      this.doc.line(
        this.config.margins.left,
        this.pageHeight - this.config.margins.bottom,
        this.pageWidth - this.config.margins.right,
        this.pageHeight - this.config.margins.bottom
      );
    }
  }

  // Export methods
  public save(filename: string): void {
    this.doc.save(filename);
  }

  public output(
    type: 'blob' | 'arraybuffer' | 'datauristring' = 'blob'
  ): string | Blob | ArrayBuffer {
    if (type === 'blob') {
      return this.doc.output('blob');
    }
    if (type === 'arraybuffer') {
      return this.doc.output('arraybuffer');
    }
    return this.doc.output('datauristring');
  }

  public getBlob(): Blob {
    return this.doc.output('blob');
  }

  public getBase64(): string {
    return this.doc.output('datauristring');
  }
}

// Utility functions
export const formatCurrency = (
  amount: number,
  currency: string = 'GHS'
): string => {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (
  date: Date | string,
  formatString: string = 'PPP'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatString);
};

export const formatNumber = (
  number: number,
  options: Intl.NumberFormatOptions = {}
): string => {
  return new Intl.NumberFormat('en-GH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(number);
};

// PDF Size utilities
export const PDF_SIZES = {
  a4: { width: 210, height: 297 },
  a3: { width: 297, height: 420 },
  letter: { width: 216, height: 279 },
} as const;

export const convertToMM = (pixels: number, dpi: number = 96): number => {
  return (pixels * 25.4) / dpi;
};

export const convertToPX = (mm: number, dpi: number = 96): number => {
  return (mm * dpi) / 25.4;
};
