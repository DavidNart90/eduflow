import jsPDF from 'jspdf';

// Simple PDF generation without autoTable plugin for server compatibility

interface TeacherFinancialReportData {
  teacher: {
    full_name: string;
    employee_id: string;
    email: string;
    management_unit: string;
    phone_number?: string;
    created_at: string;
  };
  financial_summary: {
    total_balance: number;
    total_contributions: number;
    total_interest: number;
    total_withdrawals: number;
  };
  breakdown: {
    momo_total: number;
    momo_count: number;
    controller_total: number;
    controller_count: number;
    interest_total: number;
    interest_count: number;
  };
  interest_breakdown: {
    quarterly: Array<{
      quarter: number;
      year: number;
      amount: number;
      date_paid: string;
    }>;
    summary: {
      total_earned: number;
      payment_count: number;
      last_payment_date: string;
    };
  };
  recent_transactions: Array<{
    date: string;
    type: string;
    description: string;
    amount: number;
    running_balance: number;
    status: string;
  }>;
  statement: {
    opening_balance: number;
    total_credits: number;
    total_debits: number;
    closing_balance: number;
    period: string;
  };
  current_date: string;
  report_period: string;
}

export class TeacherFinancialReportPDF {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private currentY: number;

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 20;
    this.currentY = this.margin;
  }

  // Helper method to draw a simple table manually
  private drawTable(
    headers: string[],
    rows: string[][],
    startY: number
  ): number {
    const pageWidth = this.doc.internal.pageSize.width;
    const margins = 20;
    const tableWidth = pageWidth - margins * 2;
    const colWidth = tableWidth / headers.length;
    const rowHeight = 8;

    let currentY = startY;

    // Draw headers
    this.doc.setFillColor(240, 240, 240);
    this.doc.rect(margins, currentY, tableWidth, rowHeight, 'F');

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(10);
    headers.forEach((header, i) => {
      this.doc.text(header, margins + i * colWidth + 2, currentY + 5);
    });

    currentY += rowHeight;

    // Draw rows
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);

    rows.forEach((row, rowIndex) => {
      // Alternate row colors
      if (rowIndex % 2 === 0) {
        this.doc.setFillColor(250, 250, 250);
        this.doc.rect(margins, currentY, tableWidth, rowHeight, 'F');
      }

      row.forEach((cell, i) => {
        const text = cell || '';
        this.doc.text(
          text.toString(),
          margins + i * colWidth + 2,
          currentY + 5
        );
      });

      currentY += rowHeight;
    });

    // Draw table border
    this.doc.setDrawColor(200, 200, 200);
    this.doc.rect(margins, startY, tableWidth, currentY - startY);

    // Draw column lines
    for (let i = 1; i < headers.length; i++) {
      this.doc.line(
        margins + i * colWidth,
        startY,
        margins + i * colWidth,
        currentY
      );
    }

    return currentY + 10;
  }

  // Helper method to format currency
  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
    }).format(amount);
  }

  private static formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-GB');
  }

  private addLogo(): void {
    // Add EduFlow logo
    this.doc.setFillColor(59, 130, 246); // Blue gradient start
    this.doc.circle(this.pageWidth / 2, this.currentY + 10, 8, 'F');

    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('EF', this.pageWidth / 2, this.currentY + 12, {
      align: 'center',
    });

    this.currentY += 25;
  }

  private addHeader(data: TeacherFinancialReportData): void {
    // Title
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(
      'Teacher Financial Statement',
      this.pageWidth / 2,
      this.currentY,
      { align: 'center' }
    );
    this.currentY += 8;

    // Subtitle
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(
      "EduFlow Teachers' Savings Association",
      this.pageWidth / 2,
      this.currentY,
      { align: 'center' }
    );
    this.currentY += 8;

    // Generated date and period
    this.doc.setFontSize(10);
    this.doc.setTextColor(100, 100, 100);
    this.doc.text(
      `Generated on: ${TeacherFinancialReportPDF.formatDate(data.current_date)}`,
      this.pageWidth / 2,
      this.currentY,
      { align: 'center' }
    );
    this.currentY += 5;
    this.doc.text(
      `Report Period: ${data.report_period}`,
      this.pageWidth / 2,
      this.currentY,
      { align: 'center' }
    );
    this.currentY += 15;
  }

  private addTeacherBioData(data: TeacherFinancialReportData): void {
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Teacher Bio Data', this.margin, this.currentY);
    this.currentY += 8;

    // Bio data in a box
    this.doc.setDrawColor(226, 232, 240);
    this.doc.setFillColor(248, 250, 252);
    this.doc.rect(
      this.margin,
      this.currentY,
      this.pageWidth - 2 * this.margin,
      35,
      'FD'
    );

    const bioData = [
      ['Full Name:', data.teacher.full_name],
      ['Employee ID:', data.teacher.employee_id],
      ['Email:', data.teacher.email],
      ['Management Unit:', data.teacher.management_unit],
      ['Phone:', data.teacher.phone_number || 'Not provided'],
      [
        'Member Since:',
        TeacherFinancialReportPDF.formatDate(data.teacher.created_at),
      ],
    ];

    this.doc.setFontSize(10);
    const bioY = this.currentY + 8;
    bioData.forEach((item, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = this.margin + 5 + col * 85;
      const y = bioY + row * 8;

      this.doc.setFont('helvetica', 'bold');
      this.doc.text(item[0], x, y);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(item[1], x + 25, y);
    });

    this.currentY += 45;
  }

  private addFinancialSummary(data: TeacherFinancialReportData): void {
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Financial Summary', this.margin, this.currentY);
    this.currentY += 10;

    const cardWidth = (this.pageWidth - 2 * this.margin - 15) / 4;
    const cards = [
      {
        label: 'Total Balance',
        value: data.financial_summary.total_balance,
        color: [16, 185, 129],
      },
      {
        label: 'Total Contributions',
        value: data.financial_summary.total_contributions,
        color: [59, 130, 246],
      },
      {
        label: 'Interest Earned',
        value: data.financial_summary.total_interest,
        color: [245, 158, 11],
      },
      {
        label: 'Total Withdrawals',
        value: data.financial_summary.total_withdrawals,
        color: [239, 68, 68],
      },
    ];

    cards.forEach((card, index) => {
      const x = this.margin + index * (cardWidth + 5);

      // Card background
      this.doc.setFillColor(card.color[0], card.color[1], card.color[2]);
      this.doc.rect(x, this.currentY, cardWidth, 20, 'F');

      // Text
      this.doc.setTextColor(255, 255, 255);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(card.label, x + cardWidth / 2, this.currentY + 6, {
        align: 'center',
      });

      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(
        TeacherFinancialReportPDF.formatCurrency(card.value),
        x + cardWidth / 2,
        this.currentY + 15,
        { align: 'center' }
      );
    });

    this.currentY += 30;
  }

  private addTransactionBreakdown(data: TeacherFinancialReportData): void {
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Transaction Breakdown', this.margin, this.currentY);
    this.currentY += 10;

    const breakdownData = [
      [
        'Mobile Money (MoMo)',
        TeacherFinancialReportPDF.formatCurrency(data.breakdown.momo_total),
        `${data.breakdown.momo_count} transactions`,
      ],
      [
        'Controller Reports',
        TeacherFinancialReportPDF.formatCurrency(
          data.breakdown.controller_total
        ),
        `${data.breakdown.controller_count} transactions`,
      ],
      [
        'Interest Payments',
        TeacherFinancialReportPDF.formatCurrency(data.breakdown.interest_total),
        `${data.breakdown.interest_count} transactions`,
      ],
    ];

    this.currentY = this.drawTable(
      ['Type', 'Amount', 'Count'],
      breakdownData,
      this.currentY
    );
  }

  private addInterestBreakdown(data: TeacherFinancialReportData): void {
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Interest Earned Breakdown', this.margin, this.currentY);
    this.currentY += 10;

    if (
      data.interest_breakdown.quarterly &&
      data.interest_breakdown.quarterly.length > 0
    ) {
      const interestData = data.interest_breakdown.quarterly.map(item => [
        `Q${item.quarter} ${item.year}`,
        TeacherFinancialReportPDF.formatCurrency(item.amount),
        TeacherFinancialReportPDF.formatDate(item.date_paid),
      ]);

      this.currentY = this.drawTable(
        ['Quarter', 'Amount', 'Date Paid'],
        interestData,
        this.currentY
      );
    }

    // Interest summary
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(
      `Total Interest Earned: ${TeacherFinancialReportPDF.formatCurrency(data.interest_breakdown.summary.total_earned)}`,
      this.margin,
      this.currentY
    );
    this.currentY += 6;
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(
      `Number of Payments: ${data.interest_breakdown.summary.payment_count}`,
      this.margin,
      this.currentY
    );
    this.currentY += 6;
    if (data.interest_breakdown.summary.last_payment_date) {
      this.doc.text(
        `Last Payment: ${TeacherFinancialReportPDF.formatDate(data.interest_breakdown.summary.last_payment_date)}`,
        this.margin,
        this.currentY
      );
      this.currentY += 15;
    }
  }

  private addRecentTransactions(data: TeacherFinancialReportData): void {
    if (this.currentY > this.pageHeight - 80) {
      this.doc.addPage();
      this.currentY = this.margin;
    }

    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Recent Transactions', this.margin, this.currentY);
    this.currentY += 10;

    if (data.recent_transactions && data.recent_transactions.length > 0) {
      const transactionData = data.recent_transactions.map(tx => [
        TeacherFinancialReportPDF.formatDate(tx.date),
        tx.type.toUpperCase(),
        tx.description,
        TeacherFinancialReportPDF.formatCurrency(tx.amount),
        TeacherFinancialReportPDF.formatCurrency(tx.running_balance),
      ]);

      this.currentY = this.drawTable(
        ['Date', 'Type', 'Description', 'Amount', 'Balance'],
        transactionData,
        this.currentY
      );
    }
  }

  private addStatementSummary(data: TeacherFinancialReportData): void {
    if (this.currentY > this.pageHeight - 50) {
      this.doc.addPage();
      this.currentY = this.margin;
    }

    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Account Statement Summary', this.margin, this.currentY);
    this.currentY += 10;

    // Statement summary box
    this.doc.setDrawColor(226, 232, 240);
    this.doc.setFillColor(248, 250, 252);
    this.doc.rect(
      this.margin,
      this.currentY,
      this.pageWidth - 2 * this.margin,
      35,
      'FD'
    );

    const summaryData = [
      [
        'Opening Balance:',
        TeacherFinancialReportPDF.formatCurrency(
          data.statement.opening_balance
        ),
      ],
      [
        'Total Credits:',
        TeacherFinancialReportPDF.formatCurrency(data.statement.total_credits),
      ],
      [
        'Total Debits:',
        TeacherFinancialReportPDF.formatCurrency(data.statement.total_debits),
      ],
      [
        'Closing Balance:',
        TeacherFinancialReportPDF.formatCurrency(
          data.statement.closing_balance
        ),
      ],
    ];

    this.doc.setFontSize(11);
    const summaryY = this.currentY + 8;
    summaryData.forEach((item, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = this.margin + 10 + col * 85;
      const y = summaryY + row * 10;

      this.doc.setFont('helvetica', 'normal');
      this.doc.text(item[0], x, y);
      this.doc.setFont('helvetica', 'bold');
      if (index === 3) this.doc.setTextColor(5, 150, 105); // Green for closing balance
      this.doc.text(item[1], x + 40, y);
      this.doc.setTextColor(0, 0, 0);
    });

    this.currentY += 45;
  }

  private addFooter(): void {
    const footerY = this.pageHeight - 20;
    this.doc.setFontSize(8);
    this.doc.setTextColor(100, 100, 100);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Generated by EduFlow System', this.pageWidth / 2, footerY, {
      align: 'center',
    });
    this.doc.text(
      'This is an automated financial statement. For discrepancies, contact administration.',
      this.pageWidth / 2,
      footerY + 4,
      { align: 'center' }
    );
  }

  public generateReport(data: TeacherFinancialReportData): jsPDF {
    this.addLogo();
    this.addHeader(data);
    this.addTeacherBioData(data);
    this.addFinancialSummary(data);
    this.addTransactionBreakdown(data);
    this.addInterestBreakdown(data);
    this.addRecentTransactions(data);
    this.addStatementSummary(data);
    this.addFooter();

    return this.doc;
  }

  public downloadReport(
    data: TeacherFinancialReportData,
    filename?: string
  ): void {
    const pdf = this.generateReport(data);
    const defaultFilename = `${data.teacher.full_name.replace(/\s+/g, '_')}_Financial_Statement_${data.current_date.replace(/-/g, '')}.pdf`;
    pdf.save(filename || defaultFilename);
  }

  public getReportBlob(data: TeacherFinancialReportData): Blob {
    const pdf = this.generateReport(data);
    // Use arraybuffer for server-side compatibility, then convert to blob
    const pdfArrayBuffer = pdf.output('arraybuffer');
    return new Blob([pdfArrayBuffer], { type: 'application/pdf' });
  }

  public getReportBuffer(data: TeacherFinancialReportData): ArrayBuffer {
    const pdf = this.generateReport(data);
    return pdf.output('arraybuffer');
  }
}
