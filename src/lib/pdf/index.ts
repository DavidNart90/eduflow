// Main PDF generation library exports
export * from './generator';
export * from './teacher-statement';
export * from './association-summary';
export * from './service';

// Re-export commonly used types and utilities
export type {
  PDFConfig,
  PDFTheme,
  TeacherStatementData,
  AssociationSummaryData,
  StatementTemplate,
  AssociationTemplate,
  GenerateReportRequest,
  ReportGenerationResult,
  BulkReportResult,
} from './service';

// Re-export utility functions
export {
  formatCurrency,
  formatDate,
  formatNumber,
  createDefaultTeacherTemplate,
  createDefaultAssociationTemplate,
  createPDFService,
  validateReportRequest,
} from './service';

// Re-export main classes
export {
  PDFGenerator,
  TeacherStatementPDF,
  AssociationSummaryPDF,
  PDFReportService,
} from './service';
