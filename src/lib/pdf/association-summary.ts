import {
  PDFGenerator,
  formatCurrency,
  formatDate,
  formatNumber,
} from './generator';

// Association summary data interfaces
export interface AssociationSummaryData {
  summary: {
    total_teachers: number;
    active_teachers: number;
    total_system_balance: number;
    total_contributions: number;
    total_interest_paid: number;
    average_balance_per_teacher: number;
  };
  period: {
    start_date: string;
    end_date: string;
    quarter?: number;
    year: number;
  };
  transactions: {
    total_transactions: number;
    completed_transactions: number;
    pending_transactions: number;
    failed_transactions: number;
    transaction_volume: number;
    by_type: {
      mobile_money: { count: number; amount: number };
      controller: { count: number; amount: number };
      interest: { count: number; amount: number };
    };
  };
  management_units: {
    unit_name: string;
    teacher_count: number;
    total_balance: number;
    average_balance: number;
    contribution_percentage: number;
  }[];
  interest_payments: {
    total_paid: number;
    payment_periods: {
      period: string;
      amount: number;
      teacher_count: number;
      payment_date: string;
    }[];
    current_rate: number;
  };
  top_contributors: {
    teacher_name: string;
    employee_id: string;
    balance: number;
    contributions: number;
  }[];
  growth_metrics: {
    new_teachers_this_period: number;
    balance_growth_percentage: number;
    transaction_growth_percentage: number;
    previous_period_balance: number;
  };
  generated_date: string;
  generated_by: string;
}

export interface AssociationTemplate {
  theme: string;
  header: {
    title: string;
    logo?: boolean;
    contact_info?: boolean;
    period_info?: boolean;
  };
  sections: {
    executive_summary: boolean;
    financial_overview: boolean;
    teacher_statistics: boolean;
    transaction_analysis: boolean;
    interest_payments: boolean;
    management_units: boolean;
    top_contributors?: boolean;
    growth_metrics?: boolean;
  };
  styling: {
    primary_color: string;
    secondary_color: string;
    font_family: string;
    show_charts?: boolean;
    show_graphs?: boolean;
  };
}

export class AssociationSummaryPDF {
  private generator: PDFGenerator;
  private data: AssociationSummaryData;
  private template: AssociationTemplate;

  constructor(
    data: AssociationSummaryData,
    template: AssociationTemplate,
    themeName: string = 'modern_green'
  ) {
    this.data = data;
    this.template = template;
    this.generator = new PDFGenerator({}, themeName);
  }

  public generatePDF(): Blob {
    // Add header
    this.addHeader();

    // Add executive summary
    if (this.template.sections.executive_summary) {
      this.addExecutiveSummary();
    }

    // Add financial overview
    if (this.template.sections.financial_overview) {
      this.addFinancialOverview();
    }

    // Add teacher statistics
    if (this.template.sections.teacher_statistics) {
      this.addTeacherStatistics();
    }

    // Add transaction analysis
    if (this.template.sections.transaction_analysis) {
      this.addTransactionAnalysis();
    }

    // Add interest payments
    if (this.template.sections.interest_payments) {
      this.addInterestPayments();
    }

    // Add management units breakdown
    if (this.template.sections.management_units) {
      this.addManagementUnitsBreakdown();
    }

    // Add top contributors
    if (this.template.sections.top_contributors) {
      this.addTopContributors();
    }

    // Add growth metrics
    if (this.template.sections.growth_metrics) {
      this.addGrowthMetrics();
    }

    // Add footer
    this.addFooter();

    return this.generator.getBlob();
  }

  private addHeader(): void {
    let subtitle = '';
    if (this.template.header.period_info) {
      if (this.data.period.quarter) {
        subtitle = `Q${this.data.period.quarter} ${this.data.period.year} Quarterly Report`;
      } else {
        subtitle = `Period: ${formatDate(this.data.period.start_date)} - ${formatDate(this.data.period.end_date)}`;
      }
    }

    this.generator.addHeader(this.template.header.title, subtitle);

    // Add contact info if enabled
    if (this.template.header.contact_info) {
      this.generator.addText(
        "New Juaben Teachers' Savings Association | P.O. Box XXX, Koforidua | contact@eduflow.com",
        { fontSize: 8, color: '#64748b', align: 'center', marginBottom: 8 }
      );
    }
  }

  private addExecutiveSummary(): void {
    this.generator.addTitle('Executive Summary', 1);

    // Key highlights
    const highlights = [
      `Total of ${formatNumber(this.data.summary.total_teachers)} registered teachers with ${formatNumber(this.data.summary.active_teachers)} active members`,
      `System-wide savings balance of ${formatCurrency(this.data.summary.total_system_balance)}`,
      `Average balance per teacher: ${formatCurrency(this.data.summary.average_balance_per_teacher)}`,
      `Total interest paid to members: ${formatCurrency(this.data.summary.total_interest_paid)}`,
      `${formatNumber(this.data.transactions.total_transactions)} transactions processed with ${formatCurrency(this.data.transactions.transaction_volume)} in volume`,
    ];

    highlights.forEach(highlight => {
      this.generator.addText(`• ${highlight}`, {
        fontSize: 10,
        marginBottom: 4,
      });
    });

    this.generator.addSpacer(8);
  }

  private addFinancialOverview(): void {
    this.generator.addTitle('Financial Overview', 2);

    const financialData = [
      [
        'Total System Balance',
        formatCurrency(this.data.summary.total_system_balance),
      ],
      [
        'Total Contributions',
        formatCurrency(this.data.summary.total_contributions),
      ],
      [
        'Total Interest Paid',
        formatCurrency(this.data.summary.total_interest_paid),
      ],
      [
        'Transaction Volume',
        formatCurrency(this.data.transactions.transaction_volume),
      ],
      [
        'Average Balance/Teacher',
        formatCurrency(this.data.summary.average_balance_per_teacher),
      ],
    ];

    this.generator.addTable({
      headers: ['Metric', 'Amount'],
      rows: financialData,
      columnWidths: [100, 70],
      headerStyle: {
        backgroundColor: this.template.styling.primary_color,
        textColor: '#ffffff',
        fontSize: 11,
      },
      rowStyle: {
        fontSize: 10,
        alternatingRows: true,
      },
    });

    this.generator.addSpacer(8);
  }

  private addTeacherStatistics(): void {
    this.generator.addTitle('Teacher Statistics', 2);

    const participationRate =
      (this.data.summary.active_teachers / this.data.summary.total_teachers) *
      100;

    const teacherStats = [
      [
        'Total Registered Teachers',
        formatNumber(this.data.summary.total_teachers),
      ],
      ['Active Teachers', formatNumber(this.data.summary.active_teachers)],
      ['Participation Rate', `${participationRate.toFixed(1)}%`],
      [
        'New Teachers (This Period)',
        formatNumber(this.data.growth_metrics.new_teachers_this_period),
      ],
    ];

    this.generator.addTable({
      headers: ['Statistic', 'Value'],
      rows: teacherStats,
      columnWidths: [100, 70],
      headerStyle: {
        backgroundColor: this.template.styling.secondary_color,
        textColor: '#ffffff',
        fontSize: 11,
      },
      rowStyle: {
        fontSize: 10,
        alternatingRows: true,
      },
    });

    this.generator.addSpacer(8);
  }

  private addTransactionAnalysis(): void {
    this.generator.addTitle('Transaction Analysis', 2);

    // Transaction summary
    const transactionSummary = [
      [
        'Total Transactions',
        formatNumber(this.data.transactions.total_transactions),
      ],
      [
        'Completed',
        formatNumber(this.data.transactions.completed_transactions),
      ],
      ['Pending', formatNumber(this.data.transactions.pending_transactions)],
      ['Failed', formatNumber(this.data.transactions.failed_transactions)],
    ];

    this.generator.addTable({
      headers: ['Status', 'Count'],
      rows: transactionSummary,
      columnWidths: [85, 55],
      headerStyle: {
        backgroundColor: this.template.styling.primary_color,
        textColor: '#ffffff',
        fontSize: 10,
      },
      rowStyle: {
        fontSize: 9,
        alternatingRows: true,
      },
    });

    this.generator.addSpacer(5);

    // Transaction by type
    this.generator.addText('Transactions by Type:', {
      fontSize: 10,
      fontStyle: 'bold',
      marginBottom: 4,
    });

    const transactionByType = [
      [
        'Mobile Money',
        formatNumber(this.data.transactions.by_type.mobile_money.count),
        formatCurrency(this.data.transactions.by_type.mobile_money.amount),
      ],
      [
        'Controller Transfer',
        formatNumber(this.data.transactions.by_type.controller.count),
        formatCurrency(this.data.transactions.by_type.controller.amount),
      ],
      [
        'Interest Payment',
        formatNumber(this.data.transactions.by_type.interest.count),
        formatCurrency(this.data.transactions.by_type.interest.amount),
      ],
    ];

    this.generator.addTable({
      headers: ['Type', 'Count', 'Amount'],
      rows: transactionByType,
      columnWidths: [70, 35, 45],
      headerStyle: {
        backgroundColor: this.template.styling.secondary_color,
        textColor: '#ffffff',
        fontSize: 10,
      },
      rowStyle: {
        fontSize: 9,
        alternatingRows: true,
      },
    });

    this.generator.addSpacer(8);
  }

  private addInterestPayments(): void {
    this.generator.addTitle('Interest Payments', 2);

    this.generator.addText(
      `Current Interest Rate: ${(this.data.interest_payments.current_rate * 100).toFixed(2)}% (Quarterly)`,
      { fontSize: 10, fontStyle: 'bold', marginBottom: 4 }
    );

    this.generator.addText(
      `Total Interest Paid This Period: ${formatCurrency(this.data.interest_payments.total_paid)}`,
      { fontSize: 10, marginBottom: 6 }
    );

    if (this.data.interest_payments.payment_periods.length > 0) {
      const interestRows = this.data.interest_payments.payment_periods.map(
        payment => [
          payment.period,
          formatDate(payment.payment_date, 'MMM dd, yyyy'),
          formatNumber(payment.teacher_count),
          formatCurrency(payment.amount),
        ]
      );

      this.generator.addTable({
        headers: ['Period', 'Payment Date', 'Teachers', 'Amount'],
        rows: interestRows,
        columnWidths: [40, 40, 30, 40],
        headerStyle: {
          backgroundColor: this.template.styling.primary_color,
          textColor: '#ffffff',
          fontSize: 10,
        },
        rowStyle: {
          fontSize: 9,
          alternatingRows: true,
        },
      });
    }

    this.generator.addSpacer(8);
  }

  private addManagementUnitsBreakdown(): void {
    this.generator.addTitle('Management Units Breakdown', 2);

    if (this.data.management_units.length === 0) {
      this.generator.addText('No management unit data available.', {
        fontSize: 10,
        color: '#64748b',
        marginBottom: 8,
      });
      return;
    }

    const unitRows = this.data.management_units.map(unit => [
      unit.unit_name,
      formatNumber(unit.teacher_count),
      formatCurrency(unit.total_balance),
      formatCurrency(unit.average_balance),
      `${unit.contribution_percentage.toFixed(1)}%`,
    ]);

    this.generator.addTable({
      headers: [
        'Management Unit',
        'Teachers',
        'Total Balance',
        'Avg Balance',
        '% of Total',
      ],
      rows: unitRows,
      columnWidths: [50, 25, 35, 35, 25],
      headerStyle: {
        backgroundColor: this.template.styling.secondary_color,
        textColor: '#ffffff',
        fontSize: 9,
      },
      rowStyle: {
        fontSize: 8,
        alternatingRows: true,
      },
    });

    this.generator.addSpacer(8);
  }

  private addTopContributors(): void {
    this.generator.addTitle('Top Contributors', 2);

    if (this.data.top_contributors.length === 0) {
      this.generator.addText('No contributor data available.', {
        fontSize: 10,
        color: '#64748b',
        marginBottom: 8,
      });
      return;
    }

    const contributorRows = this.data.top_contributors.map(
      (contributor, index) => [
        `${index + 1}`,
        contributor.teacher_name,
        contributor.employee_id,
        formatCurrency(contributor.balance),
        formatCurrency(contributor.contributions),
      ]
    );

    this.generator.addTable({
      headers: [
        'Rank',
        'Teacher Name',
        'Employee ID',
        'Balance',
        'Contributions',
      ],
      rows: contributorRows,
      columnWidths: [15, 50, 30, 35, 35],
      headerStyle: {
        backgroundColor: this.template.styling.primary_color,
        textColor: '#ffffff',
        fontSize: 10,
      },
      rowStyle: {
        fontSize: 9,
        alternatingRows: true,
      },
    });

    this.generator.addSpacer(8);
  }

  private addGrowthMetrics(): void {
    this.generator.addTitle('Growth Metrics', 2);

    const growthData = [
      [
        'New Teachers This Period',
        formatNumber(this.data.growth_metrics.new_teachers_this_period),
      ],
      [
        'Balance Growth',
        `${this.data.growth_metrics.balance_growth_percentage.toFixed(1)}%`,
      ],
      [
        'Transaction Growth',
        `${this.data.growth_metrics.transaction_growth_percentage.toFixed(1)}%`,
      ],
      [
        'Previous Period Balance',
        formatCurrency(this.data.growth_metrics.previous_period_balance),
      ],
      [
        'Current Period Balance',
        formatCurrency(this.data.summary.total_system_balance),
      ],
    ];

    this.generator.addTable({
      headers: ['Metric', 'Value'],
      rows: growthData,
      columnWidths: [100, 70],
      headerStyle: {
        backgroundColor: this.template.styling.secondary_color,
        textColor: '#ffffff',
        fontSize: 11,
      },
      rowStyle: {
        fontSize: 10,
        alternatingRows: true,
      },
    });

    this.generator.addSpacer(8);
  }

  private addFooter(): void {
    const footerText = `Generated on ${formatDate(this.data.generated_date)} by ${this.data.generated_by} | EduFlow - Teachers' Savings Association Management System`;
    this.generator.addFooter(footerText);
  }

  // Static method to generate PDF from data
  public static generate(
    data: AssociationSummaryData,
    template: AssociationTemplate,
    themeName?: string
  ): Blob {
    const generator = new AssociationSummaryPDF(data, template, themeName);
    return generator.generatePDF();
  }
}

// Helper function to create default association template
export const createDefaultAssociationTemplate = (
  overrides: Partial<AssociationTemplate> = {}
): AssociationTemplate => {
  return {
    theme: 'modern_green',
    header: {
      title: 'EduFlow - Quarterly Association Summary',
      logo: true,
      contact_info: true,
      period_info: true,
    },
    sections: {
      executive_summary: true,
      financial_overview: true,
      teacher_statistics: true,
      transaction_analysis: true,
      interest_payments: true,
      management_units: true,
      top_contributors: true,
      growth_metrics: true,
    },
    styling: {
      primary_color: '#059669',
      secondary_color: '#64748b',
      font_family: 'Inter',
      show_charts: true,
      show_graphs: true,
    },
    ...overrides,
  };
};
