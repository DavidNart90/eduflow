import jsPDF from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';

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
  private margin = 15;
  private y = this.margin;

  // Neutral palette
  private colors = {
    ink: [59, 130, 246],
    sub: [90, 98, 108],
    light: [130, 138, 149],
    rule: [224, 229, 236],
    surface: [248, 249, 251],
    white: [255, 255, 255],
    chip: [243, 244, 246],
    success: [16, 185, 129],
    warning: [245, 158, 11],
    danger: [239, 68, 68],
  } as const;

  // Type scale (times)
  private type = {
    h1: 20,
    h2: 15,
    h3: 12,
    h4: 13,
    body: 12,
    small: 11,
  };

  private ghFormatter = new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    currencyDisplay: 'code',
    minimumFractionDigits: 2,
  });
  private amt = (n: number) =>
    this.ghFormatter.format(n).replace('GHS', 'GHS').trim();
  private dmy = (iso: string) => {
    const d = new Date(iso);
    const dd = `${d.getDate()}`.padStart(2, '0');
    const mm = `${d.getMonth() + 1}`.padStart(2, '0');
    const yy = d.getFullYear();
    return `${dd}/${mm}/${yy}`;
  };

  constructor() {
    this.doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();

    this.doc.setFont('times', 'normal');
    this.doc.setTextColor(...this.colors.ink);
  }

  // Public API
  generateReport(data: TeacherFinancialReportData) {
    this.headerRow(data);
    this.teacherBlock(data);
    this.summaryTiles(data);
    this.breakdownTable(data);
    this.interestSection(data);
    this.transactionsTable(data);
    this.statementGrid(data);
    this.footerPageNumbers();
    return this.doc;
  }
  downloadReport(data: TeacherFinancialReportData, filename?: string) {
    const pdf = this.generateReport(data);
    const safe = data.teacher.full_name.replace(/\s+/g, '_');
    const d = (data.current_date || '').replace(/-/g, '');
    pdf.save(filename || `${safe}_Financial_Statement_${d}.pdf`);
  }
  getReportBlob(data: TeacherFinancialReportData) {
    const pdf = this.generateReport(data);
    return new Blob([pdf.output('arraybuffer')], { type: 'application/pdf' });
  }
  getReportBuffer(data: TeacherFinancialReportData) {
    return this.generateReport(data).output('arraybuffer');
  }

  // ——— Sections ———
  private headerRow(data: TeacherFinancialReportData) {
    // Logo circle (neutral)
    const circleR = 7.5;
    const cx = this.margin + 3.5;
    const cy = this.y + circleR;

    this.doc.setFillColor(...this.colors.ink);
    this.doc.circle(cx, cy, circleR, 'F');

    this.doc.setFont('times', 'bold');
    this.doc.setTextColor(...this.colors.white);
    this.doc.setFontSize(15);
    this.doc.text('EF', cx, cy + 2, { align: 'center' });

    // Title block aligned with logo
    const titleX = this.margin + circleR * 2 + 6;
    this.doc.setTextColor(...this.colors.ink);
    this.doc.setFont('times', 'bold');
    this.doc.setFontSize(this.type.h1);
    this.doc.text('Teacher Financial Statement', titleX, cy);

    this.doc.setFont('times', 'normal');
    this.doc.setFontSize(this.type.h3);
    this.doc.setTextColor(...this.colors.sub);
    this.doc.text('EduFlow Teachers’ Savings Association', titleX, cy + 7);

    // Meta (right-aligned)
    const metaY = cy - 3.5;
    this.doc.setFontSize(this.type.body);
    this.doc.setTextColor(...this.colors.light);
    this.doc.text(
      `Generated: ${this.dmy(data.current_date)}`,
      this.pageWidth - this.margin,
      metaY + 4,
      { align: 'right' }
    );
    this.doc.text(
      `Period: ${data.report_period}`,
      this.pageWidth - this.margin,
      metaY + 10,
      { align: 'right' }
    );

    this.y = cy + circleR + 8;
    this.rule();
    this.y += 8;
  }

  private teacherBlock(data: TeacherFinancialReportData) {
    // Subtle surface card
    const h = 40;
    const x = this.margin;
    const w = this.pageWidth - 2 * this.margin;

    this.doc.setFillColor(...this.colors.surface);
    this.doc.setDrawColor(...this.colors.rule);
    this.doc.roundedRect(x, this.y, w, h, 2.5, 2.5, 'FD');

    const pad = 7;
    const colW = w / 2;
    const L = [
      ['Full Name', data.teacher.full_name],
      ['Employee ID', data.teacher.employee_id],
      ['Email', data.teacher.email],
    ];
    const R = [
      ['Management Unit', data.teacher.management_unit],
      ['Phone', data.teacher.phone_number || 'Not provided'],
      ['Member Since', this.dmy(data.teacher.created_at)],
    ];

    this.doc.setFontSize(this.type.body);
    const draw = (label: string, value: string, ox: number, oy: number) => {
      this.doc.setTextColor(...this.colors.light);
      this.doc.setFont('times', 'bold');
      this.doc.text(label.toUpperCase(), ox, oy + 2);
      this.doc.setTextColor(...this.colors.ink);
      this.doc.setFont('times', 'normal');
      this.doc.text(value, ox, oy + 7);
    };

    L.forEach((r, i) => draw(r[0], r[1], x + pad, this.y + pad + i * 10));
    R.forEach((r, i) =>
      draw(r[0], r[1], x + pad + colW, this.y + pad + i * 10)
    );

    this.y += h + 12;
  }

  private summaryTiles(data: TeacherFinancialReportData) {
    this.sectionTitle('Financial Summary');

    // Flat tiles (no colors), even spacing
    const items = [
      ['Total Balance', this.amt(data.financial_summary.total_balance)],
      [
        'Total Contributions',
        this.amt(data.financial_summary.total_contributions),
      ],
      ['Interest Earned', this.amt(data.financial_summary.total_interest)],
      ['Total Withdrawals', this.amt(data.financial_summary.total_withdrawals)],
    ];

    const gap = 6;
    const tileW = (this.pageWidth - 2 * this.margin - 3 * gap) / 4;
    const tileH = 20;

    items.forEach((it, i) => {
      const x = this.margin + i * (tileW + gap);
      this.doc.setDrawColor(...this.colors.rule);
      this.doc.setFillColor(...this.colors.white);
      this.doc.roundedRect(x, this.y, tileW, tileH, 2, 2, 'FD');

      this.doc.setFontSize(this.type.body);
      this.doc.setTextColor(...this.colors.light);
      this.doc.text(it[0], x + 4, this.y + 7);

      this.doc.setFont('times', 'bold');
      this.doc.setFontSize(this.type.h4);
      this.doc.setTextColor(...this.colors.success);
      this.doc.text(it[1], x + 4, this.y + 14.5);

      this.doc.setFont('times', 'normal');
    });

    this.y += tileH + 12;
  }

  private breakdownTable(data: TeacherFinancialReportData) {
    this.sectionTitle('Transaction Breakdown');

    const body: RowInput[] = [
      [
        'Mobile Money (MoMo)',
        this.amt(data.breakdown.momo_total),
        `${data.breakdown.momo_count} transactions`,
      ],
      [
        'Controller Reports',
        this.amt(data.breakdown.controller_total),
        `${data.breakdown.controller_count} transactions`,
      ],
      [
        'Interest Payments',
        this.amt(data.breakdown.interest_total),
        `${data.breakdown.interest_count} transactions`,
      ],
    ];

    autoTable(this.doc, {
      startY: this.y,
      head: [['Type', 'Amount', 'Count']],
      body,
      theme: 'plain',
      styles: {
        font: 'times',
        fontSize: this.type.body,
        cellPadding: 3,
        textColor: [
          this.colors.light[0],
          this.colors.light[1],
          this.colors.light[2],
        ],
      },
      headStyles: {
        fontStyle: 'bold',
        textColor: this.colors.sub as any,
        fillColor: this.colors.white as any,
        halign: 'center',
      },
      bodyStyles: {},
      // minimalist grid
      tableLineColor: this.colors.rule as any,
      tableLineWidth: 0.2,
      columnStyles: {
        0: { cellWidth: 60, halign: 'left' },
        1: { halign: 'center', fontStyle: 'bold' },
        2: { halign: 'center' },
      },
      margin: { left: this.margin, right: this.margin },
      didDrawPage: hook => {
        this.y = (hook.cursor?.y || this.y) + 8;
      },
    });
  }

  private interestSection(data: TeacherFinancialReportData) {
    this.sectionTitle('Interest Earned Breakdown');

    if (data.interest_breakdown.quarterly?.length) {
      const body: RowInput[] = data.interest_breakdown.quarterly.map(q => [
        `Q${q.quarter} ${q.year}`,
        this.amt(q.amount),
        this.dmy(q.date_paid),
      ]);

      autoTable(this.doc, {
        startY: this.y,
        head: [['Quarter', 'Amount', 'Date Paid']],
        body,
        theme: 'plain',
        styles: {
          font: 'times',
          fontSize: this.type.small,
          cellPadding: 3,
          textColor: [
            this.colors.ink[0],
            this.colors.ink[1],
            this.colors.ink[2],
          ],
        },
        headStyles: { fontStyle: 'bold', textColor: this.colors.sub as any },
        tableLineColor: this.colors.rule as any,
        tableLineWidth: 0.2,
        columnStyles: {
          0: { cellWidth: 50 },
          1: { halign: 'right' },
          2: { halign: 'center' },
        },
        margin: { left: this.margin, right: this.margin },
        didDrawPage: hook => {
          this.y = (hook.cursor?.y || this.y) + 6;
        },
      });
    }

    // Summary strip (no color, just border)
    const h = 16;
    const w = this.pageWidth - 2 * this.margin;
    this.doc.setDrawColor(...this.colors.rule);
    this.doc.roundedRect(this.margin, this.y, w, h, 2, 2);

    this.doc.setFontSize(this.type.body);
    this.doc.setTextColor(...this.colors.ink);
    this.doc.setFont('times', 'bold');
    this.doc.text(
      `Total Interest Earned: ${this.amt(data.interest_breakdown.summary.total_earned)}`,
      this.margin + 5,
      this.y + 6
    );

    this.doc.setFont('times', 'normal');
    this.doc.setTextColor(...this.colors.sub);
    this.doc.text(
      `Payments: ${data.interest_breakdown.summary.payment_count}`,
      this.margin + 5,
      this.y + 11
    );

    if (data.interest_breakdown.summary.last_payment_date) {
      this.doc.text(
        `Last Payment: ${this.dmy(data.interest_breakdown.summary.last_payment_date)}`,
        this.pageWidth - this.margin - 5,
        this.y + 11,
        { align: 'right' }
      );
    }

    this.y += h + 10;
  }

  private toSentenceCase(str: string): string {
    if (!str) return '';
    const lower = str.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }

  private transactionsTable(data: TeacherFinancialReportData) {
    this.sectionTitle('Recent Transactions');

    const tx = (data.recent_transactions || []).slice(0, 12);
    if (!tx.length) {
      this.doc.setTextColor(...this.colors.sub);
      this.doc.text('No recent transactions.', this.margin, this.y);
      this.y += 8;
      return;
    }

    const body: RowInput[] = tx.map(t => [
      this.dmy(t.date),
      this.toSentenceCase(t.type) || '',
      t.description || '',
      this.amt(t.amount),
      this.amt(t.running_balance),
      this.toSentenceCase(t.status) || '',
    ]);

    autoTable(this.doc, {
      startY: this.y,
      head: [['Date', 'Type', 'Description', 'Amount', 'Balance', 'Status']],
      body,
      theme: 'plain',
      styles: {
        font: 'times',
        fontSize: this.type.small,
        cellPadding: 3,
        overflow: 'linebreak',
      },
      headStyles: { fontStyle: 'bold', textColor: this.colors.sub as any },
      tableLineColor: this.colors.rule as any,
      tableLineWidth: 0.2,
      bodyStyles: { textColor: this.colors.ink as any },
      columnStyles: {
        0: { cellWidth: 22, halign: 'center' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 50 },
        3: { cellWidth: 26, halign: 'right' },
        4: { cellWidth: 28, halign: 'right' },
        5: { cellWidth: 22, halign: 'center' },
      },
      didParseCell: hook => {
        // Very subtle status chip: light gray fill on body cells (no color semantics)
        if (hook.section === 'body' && hook.column.index === 5) {
          hook.cell.styles.fillColor = this.colors.chip as any;
          hook.cell.styles.textColor = this.colors.sub as any;
        }
      },
      margin: { left: this.margin, right: this.margin },
      didDrawPage: hook => {
        this.y = (hook.cursor?.y || this.y) + 8;
      },
    });
  }

  private statementGrid(data: TeacherFinancialReportData) {
    this.sectionTitle('Account Statement Summary');

    // Simple two-column KV grid, equal widths, no color blocks
    const pairs: [string, string][] = [
      ['Opening Balance', this.amt(data.statement.opening_balance)],
      ['Total Credits', this.amt(data.statement.total_credits)],
      ['Total Debits', this.amt(data.statement.total_debits)],
      ['Closing Balance', this.amt(data.statement.closing_balance)],
    ];

    const x = this.margin;
    const w = this.pageWidth - 2 * this.margin;
    const colW = w / 2;
    const rowH = 12;

    // Outer border
    this.doc.setDrawColor(...this.colors.rule);
    this.doc.roundedRect(x, this.y, w, rowH * 2 + 2, 2, 2);

    // Internal vertical divider
    this.doc.line(x + colW, this.y, x + colW, this.y + rowH * 2 + 2);

    // Horizontal divider
    this.doc.line(x, this.y + rowH + 1, x + w, this.y + rowH + 1);

    const drawKV = (
      label: string,
      value: string,
      ox: number,
      oy: number,
      accent = false
    ) => {
      this.doc.setFontSize(this.type.small);
      this.doc.setTextColor(...this.colors.light);
      this.doc.setFont('times', 'bold');
      this.doc.text(label.toUpperCase(), ox + 5, oy + 4.5);

      this.doc.setFont('times', accent ? 'bold' : 'normal');
      this.doc.setFontSize(this.type.h3);
      this.doc.setTextColor(...this.colors.ink);
      this.doc.text(value, ox + 5, oy + 9);
    };

    // Top row
    drawKV(pairs[0][0], pairs[0][1], x, this.y + 1);
    drawKV(pairs[2][0], pairs[2][1], x + colW, this.y + 1);

    // Bottom row (accent only by weight, not color)
    drawKV(pairs[1][0], pairs[1][1], x, this.y + 1 + rowH, false);
    drawKV(pairs[3][0], pairs[3][1], x + colW, this.y + 1 + rowH, true);

    this.y += rowH * 2 + 10;
  }

  private footerPageNumbers() {
    const pages = this.doc.getNumberOfPages();
    for (let p = 1; p <= pages; p++) {
      this.doc.setPage(p);
      const y = this.pageHeight - 12;
      this.doc.setDrawColor(...this.colors.rule);
      this.doc.line(this.margin, y, this.pageWidth - this.margin, y);

      this.doc.setFontSize(this.type.small);
      this.doc.setTextColor(...this.colors.sub);
      this.doc.text('Generated by EduFlow System', this.margin, y + 6);
      const label = `Page ${p} of ${pages}`;
      this.doc.text(label, this.pageWidth - this.margin, y + 6, {
        align: 'right',
      });
    }
  }

  // Helpers
  private sectionTitle(t: string) {
    if (this.y > this.pageHeight - 70) {
      this.doc.addPage();
      this.y = this.margin + 6;
    }
    this.doc.setFont('times', 'bold');
    this.doc.setFontSize(this.type.h2);
    this.doc.setTextColor(...this.colors.ink);
    this.doc.text(t, this.margin, this.y);
    this.y += 5;
    this.rule();
    this.y += 6;
  }
  private rule() {
    this.doc.setDrawColor(...this.colors.rule);
    this.doc.setLineWidth(0.2);
    this.doc.line(this.margin, this.y, this.pageWidth - this.margin, this.y);
  }
}
