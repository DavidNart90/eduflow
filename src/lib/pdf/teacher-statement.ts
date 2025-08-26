import { PDFGenerator, formatCurrency, formatDate } from './generator';

// Teacher data interfaces
export interface TeacherData {
  id: string;
  full_name: string;
  employee_id: string;
  email: string;
  management_unit: string;
  phone_number?: string;
  created_at: string;
}

export interface TransactionData {
  id: string;
  transaction_type: 'momo' | 'controller' | 'interest' | 'deposit';
  amount: number;
  description: string;
  transaction_date: string;
  status: 'completed' | 'pending' | 'failed';
  payment_method?: string;
  reference_id?: string;
  running_balance: number;
}

export interface BalanceData {
  current_balance: number;
  total_contributions: number;
  total_interest: number;
  last_transaction_date?: string;
}

export interface InterestData {
  total_interest_earned: number;
  quarterly_payments: {
    quarter: string;
    year: number;
    amount: number;
    payment_date: string;
  }[];
  current_rate: number;
}

export interface TeacherStatementData {
  teacher: TeacherData;
  balance: BalanceData;
  transactions: TransactionData[];
  interest: InterestData;
  statement_period: {
    start_date: string;
    end_date: string;
  };
  generated_date: string;
  generated_by: string;
}

export interface StatementTemplate {
  theme: string;
  header: {
    title: string;
    logo?: boolean;
    contact_info?: boolean;
    show_period?: boolean;
  };
  sections: {
    personal_info: boolean;
    account_summary: boolean;
    transaction_history: boolean;
    interest_breakdown: boolean;
    payment_methods: boolean;
    charts?: boolean;
  };
  styling: {
    primary_color: string;
    secondary_color: string;
    font_family: string;
    show_charts?: boolean;
  };
}

export class TeacherStatementPDF {
  private generator: PDFGenerator;
  private data: TeacherStatementData;
  private template: StatementTemplate;

  constructor(
    data: TeacherStatementData,
    template: StatementTemplate,
    themeName: string = 'classic_blue'
  ) {
    this.data = data;
    this.template = template;
    this.generator = new PDFGenerator({}, themeName);
  }

  public generatePDF(): Blob {
    // Add header
    this.addHeader();

    // Add personal information
    if (this.template.sections.personal_info) {
      this.addPersonalInformation();
    }

    // Add account summary
    if (this.template.sections.account_summary) {
      this.addAccountSummary();
    }

    // Add transaction history
    if (this.template.sections.transaction_history) {
      this.addTransactionHistory();
    }

    // Add interest breakdown
    if (this.template.sections.interest_breakdown) {
      this.addInterestBreakdown();
    }

    // Add payment methods summary
    if (this.template.sections.payment_methods) {
      this.addPaymentMethodsSummary();
    }

    // Add footer
    this.addFooter();

    return this.generator.getBlob();
  }

  private addHeader(): void {
    const subtitle = this.template.header.show_period
      ? `Statement Period: ${formatDate(this.data.statement_period.start_date)} - ${formatDate(this.data.statement_period.end_date)}`
      : undefined;

    this.generator.addHeader(this.template.header.title, subtitle);

    // Add contact info if enabled
    if (this.template.header.contact_info) {
      this.generator.addText(
        "New Juaben Teachers' Savings Association | contact@eduflow.com | +233 XXX XXX XXX",
        { fontSize: 8, color: '#64748b', align: 'center', marginBottom: 8 }
      );
    }
  }

  private addPersonalInformation(): void {
    this.generator.addTitle('Personal Information', 2);

    const personalInfo = [
      ['Full Name:', this.data.teacher.full_name],
      ['Employee ID:', this.data.teacher.employee_id],
      ['Management Unit:', this.data.teacher.management_unit],
      ['Email:', this.data.teacher.email],
      ['Phone:', this.data.teacher.phone_number || 'Not provided'],
      ['Member Since:', formatDate(this.data.teacher.created_at, 'MMMM yyyy')],
    ];

    // Create a simple info layout
    personalInfo.forEach(([label, value]) => {
      this.generator.addText(`${label} ${value}`, {
        fontSize: 10,
        marginBottom: 3,
      });
    });

    this.generator.addSpacer(8);
  }

  private addAccountSummary(): void {
    this.generator.addTitle('Account Summary', 2);

    // Summary cards data
    const summaryData = [
      ['Current Balance', formatCurrency(this.data.balance.current_balance)],
      [
        'Total Contributions',
        formatCurrency(this.data.balance.total_contributions),
      ],
      [
        'Total Interest Earned',
        formatCurrency(this.data.balance.total_interest),
      ],
      [
        'Last Transaction',
        this.data.balance.last_transaction_date
          ? formatDate(this.data.balance.last_transaction_date, 'PPP')
          : 'No transactions',
      ],
    ];

    this.generator.addTable({
      headers: ['Description', 'Amount/Date'],
      rows: summaryData,
      columnWidths: [100, 80],
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

  private addTransactionHistory(): void {
    this.generator.addTitle('Transaction History', 2);

    if (this.data.transactions.length === 0) {
      this.generator.addText('No transactions found for the selected period.', {
        fontSize: 10,
        color: '#64748b',
        marginBottom: 8,
      });
      return;
    }

    // Prepare transaction data for table
    const transactionRows = this.data.transactions.map(transaction => [
      formatDate(transaction.transaction_date, 'MMM dd, yyyy'),
      TeacherStatementPDF.formatTransactionType(transaction.transaction_type),
      transaction.description,
      formatCurrency(transaction.amount),
      TeacherStatementPDF.formatStatus(transaction.status),
      formatCurrency(transaction.running_balance),
    ]);

    this.generator.addTable({
      headers: ['Date', 'Type', 'Description', 'Amount', 'Status', 'Balance'],
      rows: transactionRows,
      columnWidths: [25, 25, 45, 25, 20, 30],
      headerStyle: {
        backgroundColor: this.template.styling.primary_color,
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

  private addInterestBreakdown(): void {
    this.generator.addTitle('Interest Breakdown', 2);

    // Interest summary
    this.generator.addText(
      `Current Interest Rate: ${(this.data.interest.current_rate * 100).toFixed(2)}% (Quarterly)`,
      { fontSize: 10, fontStyle: 'bold', marginBottom: 4 }
    );

    this.generator.addText(
      `Total Interest Earned: ${formatCurrency(this.data.interest.total_interest_earned)}`,
      { fontSize: 10, marginBottom: 6 }
    );

    if (this.data.interest.quarterly_payments.length > 0) {
      this.generator.addText('Quarterly Interest Payments:', {
        fontSize: 10,
        fontStyle: 'bold',
        marginBottom: 4,
      });

      const interestRows = this.data.interest.quarterly_payments.map(
        payment => [
          `${payment.quarter} ${payment.year}`,
          formatDate(payment.payment_date, 'MMM dd, yyyy'),
          formatCurrency(payment.amount),
        ]
      );

      this.generator.addTable({
        headers: ['Period', 'Payment Date', 'Amount'],
        rows: interestRows,
        columnWidths: [50, 50, 50],
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
    } else {
      this.generator.addText(
        'No interest payments found for the selected period.',
        { fontSize: 9, color: '#64748b', marginBottom: 4 }
      );
    }

    this.generator.addSpacer(8);
  }

  private addPaymentMethodsSummary(): void {
    this.generator.addTitle('Payment Methods Summary', 2);

    // Group transactions by payment method
    const paymentMethods = this.data.transactions.reduce(
      (acc, transaction) => {
        if (transaction.status === 'completed') {
          const method = TeacherStatementPDF.getPaymentMethodLabel(
            transaction.transaction_type,
            transaction.payment_method
          );
          acc[method] = (acc[method] || 0) + transaction.amount;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    if (Object.keys(paymentMethods).length === 0) {
      this.generator.addText(
        'No completed transactions found for the selected period.',
        { fontSize: 10, color: '#64748b', marginBottom: 8 }
      );
      return;
    }

    const paymentRows = Object.entries(paymentMethods).map(
      ([method, amount]) => [
        method,
        formatCurrency(amount),
        `${((amount / this.data.balance.total_contributions) * 100).toFixed(1)}%`,
      ]
    );

    this.generator.addTable({
      headers: ['Payment Method', 'Total Amount', 'Percentage'],
      rows: paymentRows,
      columnWidths: [70, 40, 40],
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

  private addFooter(): void {
    const footerText = `Generated on ${formatDate(this.data.generated_date)} by ${this.data.generated_by} | EduFlow - Teachers' Savings Association`;
    this.generator.addFooter(footerText);
  }

  // Utility methods
  private static formatTransactionType(type: string): string {
    const types = {
      momo: 'Mobile Money',
      controller: 'Controller',
      interest: 'Interest',
      deposit: 'Deposit',
    };
    return types[type as keyof typeof types] || type.toUpperCase();
  }

  private static formatStatus(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  private static getPaymentMethodLabel(type: string, method?: string): string {
    if (type === 'interest') return 'Interest Payment';
    if (type === 'controller') return 'Controller Transfer';
    if (method === 'momo') return 'Mobile Money';
    if (method === 'deposit' || type === 'deposit') return 'Bank Transfer';
    return 'Other';
  }

  // Static method to generate PDF from data
  public static generate(
    data: TeacherStatementData,
    template: StatementTemplate,
    themeName?: string
  ): Blob {
    const generator = new TeacherStatementPDF(data, template, themeName);
    return generator.generatePDF();
  }
}

// Helper function to calculate running balances
export const calculateRunningBalances = (
  transactions: Omit<TransactionData, 'running_balance'>[]
): TransactionData[] => {
  let runningBalance = 0;

  return transactions
    .sort(
      (a, b) =>
        new Date(a.transaction_date).getTime() -
        new Date(b.transaction_date).getTime()
    )
    .map(transaction => {
      if (transaction.status === 'completed') {
        runningBalance += transaction.amount;
      }

      return {
        ...transaction,
        running_balance: runningBalance,
      };
    });
};

// Helper function to create default template
export const createDefaultTeacherTemplate = (
  overrides: Partial<StatementTemplate> = {}
): StatementTemplate => {
  return {
    theme: 'classic_blue',
    header: {
      title: 'EduFlow - Teachers Savings Statement',
      logo: true,
      contact_info: true,
      show_period: true,
    },
    sections: {
      personal_info: true,
      account_summary: true,
      transaction_history: true,
      interest_breakdown: true,
      payment_methods: true,
      charts: false,
    },
    styling: {
      primary_color: '#2563eb',
      secondary_color: '#64748b',
      font_family: 'Inter',
      show_charts: false,
    },
    ...overrides,
  };
};
