import { createServerSupabaseClient } from './supabase';

export interface NotificationData {
  user_id: string;
  type:
    | 'momo_transaction'
    | 'admin_report'
    | 'controller_report'
    | 'app_update'
    | 'system'
    | 'interest_payment';
  title: string;
  message: string;
  metadata?: Record<string, string | number | boolean | null>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  expires_at?: string;
  created_by?: string;
}

export interface NotificationFromTemplate {
  user_id: string;
  type:
    | 'momo_transaction'
    | 'admin_report'
    | 'controller_report'
    | 'app_update'
    | 'system'
    | 'interest_payment';
  template_name: string;
  variables: Record<string, string | number | boolean | null>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  expires_at?: string;
  created_by?: string;
}

/**
 * Create a notification directly
 */
export async function createNotification(
  notificationData: NotificationData
): Promise<string | null> {
  try {
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: notificationData.user_id,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        metadata: notificationData.metadata || {},
        priority: notificationData.priority || 'normal',
        expires_at: notificationData.expires_at,
        created_by: notificationData.created_by,
      })
      .select('id')
      .single();

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating notification:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error in createNotification:', error);
    return null;
  }
}

/**
 * Create a notification from a template
 */
export async function createNotificationFromTemplate(
  templateData: NotificationFromTemplate
): Promise<string | null> {
  try {
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase.rpc(
      'create_notification_from_template',
      {
        p_user_id: templateData.user_id,
        p_type: templateData.type,
        p_template_name: templateData.template_name,
        p_variables: templateData.variables,
        p_priority: templateData.priority || 'normal',
        p_created_by: templateData.created_by,
        p_expires_at: templateData.expires_at,
      }
    );

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating notification from template:', error);
      return null;
    }

    return data;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error in createNotificationFromTemplate:', error);
    return null;
  }
}

/**
 * Create notification for MoMo transaction
 */
export function createMoMoTransactionNotification(
  userId: string,
  transactionData: {
    amount: number;
    status: 'completed' | 'failed';
    transaction_id: string;
    reference_id?: string;
  },
  createdBy?: string
): Promise<string | null> {
  const templateName =
    transactionData.status === 'completed'
      ? 'payment_received'
      : 'payment_failed';
  const priority = transactionData.status === 'failed' ? 'high' : 'normal';

  return createNotificationFromTemplate({
    user_id: userId,
    type: 'momo_transaction',
    template_name: templateName,
    variables: {
      amount: transactionData.amount.toFixed(2),
      transaction_id: transactionData.transaction_id,
      reference_id: transactionData.reference_id || '',
    },
    priority,
    created_by: createdBy,
  });
}

/**
 * Create notification for admin-generated report (for teachers)
 */
export function createAdminReportNotification(
  userId: string,
  reportData: {
    report_type: string;
    report_period: string;
    report_id?: string;
  },
  createdBy?: string
): Promise<string | null> {
  return createNotificationFromTemplate({
    user_id: userId,
    type: 'admin_report',
    template_name: 'report_ready_teacher',
    variables: {
      report_type: reportData.report_type,
      report_period: reportData.report_period,
      report_id: reportData.report_id || '',
    },
    priority: 'normal',
    created_by: createdBy,
  });
}

/**
 * Create notification for admin about successful report generation
 */
export function createAdminReportGenerationNotification(
  userId: string,
  reportData: {
    report_period: string;
    teachers_count: number;
    report_id?: string;
  },
  createdBy?: string
): Promise<string | null> {
  return createNotificationFromTemplate({
    user_id: userId,
    type: 'admin_report',
    template_name: 'report_generation_success',
    variables: {
      report_period: reportData.report_period,
      teachers_count: reportData.teachers_count.toString(),
      report_id: reportData.report_id || '',
    },
    priority: 'normal',
    created_by: createdBy,
  });
}

/**
 * Create notification for controller report processing (for teachers)
 */
export function createControllerReportNotification(
  userId: string,
  reportData: {
    report_period: string;
    report_id?: string;
    deduction_amount?: number;
  },
  createdBy?: string
): Promise<string | null> {
  return createNotificationFromTemplate({
    user_id: userId,
    type: 'controller_report',
    template_name: 'controller_deduction',
    variables: {
      report_period: reportData.report_period,
      report_id: reportData.report_id || '',
      deduction_amount: reportData.deduction_amount?.toFixed(2) || '0.00',
    },
    priority: 'normal',
    created_by: createdBy,
  });
}

/**
 * Create notification for admin about controller report upload
 */
export function createAdminControllerReportNotification(
  userId: string,
  reportData: {
    report_period: string;
    affected_teachers: number;
    report_id?: string;
  },
  createdBy?: string
): Promise<string | null> {
  return createNotificationFromTemplate({
    user_id: userId,
    type: 'controller_report',
    template_name: 'controller_upload_success',
    variables: {
      report_period: reportData.report_period,
      affected_teachers: reportData.affected_teachers.toString(),
      report_id: reportData.report_id || '',
    },
    priority: 'normal',
    created_by: createdBy,
  });
}

/**
 * Create notification for app update
 */
export function createAppUpdateNotification(
  userId: string,
  updateData: {
    version?: string;
    features?: string;
  },
  createdBy?: string
): Promise<string | null> {
  return createNotificationFromTemplate({
    user_id: userId,
    type: 'app_update',
    template_name: 'new_version',
    variables: {
      version: updateData.version || '',
      features: updateData.features || '',
    },
    priority: 'normal',
    created_by: createdBy,
  });
}

/**
 * Create notification for interest payment (for teachers)
 */
export function createInterestPaymentNotification(
  userId: string,
  interestData: {
    amount: number;
    payment_period: string;
    new_balance: number;
  },
  createdBy?: string
): Promise<string | null> {
  return createNotificationFromTemplate({
    user_id: userId,
    type: 'interest_payment',
    template_name: 'quarterly_interest_teacher',
    variables: {
      amount: interestData.amount.toFixed(2),
      payment_period: interestData.payment_period,
      new_balance: interestData.new_balance.toFixed(2),
    },
    priority: 'normal',
    created_by: createdBy,
  });
}

/**
 * Create notification for admin about interest payment completion
 */
export function createAdminInterestPaymentNotification(
  userId: string,
  interestData: {
    payment_period: string;
    total_amount: number;
    teachers_count: number;
  },
  createdBy?: string
): Promise<string | null> {
  return createNotificationFromTemplate({
    user_id: userId,
    type: 'interest_payment',
    template_name: 'quarterly_interest_admin',
    variables: {
      payment_period: interestData.payment_period,
      total_amount: interestData.total_amount.toFixed(2),
      teachers_count: interestData.teachers_count.toString(),
    },
    priority: 'normal',
    created_by: createdBy,
  });
}

/**
 * Create notifications for multiple users at once
 */
export async function createBulkNotifications(
  notifications: NotificationData[]
): Promise<{ successful: number; failed: number }> {
  let successful = 0;
  let failed = 0;

  try {
    const supabase = createServerSupabaseClient();

    const { error } = await supabase.from('notifications').insert(
      notifications.map(notification => ({
        user_id: notification.user_id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        metadata: notification.metadata || {},
        priority: notification.priority || 'normal',
        expires_at: notification.expires_at,
        created_by: notification.created_by,
      }))
    );

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating bulk notifications:', error);
      failed = notifications.length;
    } else {
      successful = notifications.length;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error in createBulkNotifications:', error);
    failed = notifications.length;
  }

  return { successful, failed };
}

/**
 * Create notifications for all users of a specific role
 */
export async function createNotificationForAllUsers(
  notificationData: Omit<NotificationData, 'user_id'>,
  targetRole?: 'teacher' | 'admin'
): Promise<{ successful: number; failed: number }> {
  try {
    const supabase = createServerSupabaseClient();

    // Get all users of the specified role
    let query = supabase.from('users').select('id');

    if (targetRole) {
      query = query.eq('role', targetRole);
    }

    const { data: users, error: usersError } = await query;

    if (usersError || !users) {
      // eslint-disable-next-line no-console
      console.error('Error fetching users:', usersError);
      return { successful: 0, failed: 0 };
    }

    // Create notifications for all users
    const notifications: NotificationData[] = users.map(
      (user: { id: string }) => ({
        ...notificationData,
        user_id: user.id,
      })
    );

    return createBulkNotifications(notifications);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error in createNotificationForAllUsers:', error);
    return { successful: 0, failed: 0 };
  }
}

/**
 * Check if user has notification settings enabled for a specific type
 */
export async function isNotificationEnabled(
  userId: string,
  notificationType:
    | 'momo_transaction'
    | 'admin_report'
    | 'controller_report'
    | 'app_update'
    | 'system'
    | 'interest_payment'
): Promise<boolean> {
  try {
    const supabase = createServerSupabaseClient();

    const { data: settings, error } = await supabase
      .from('notification_settings')
      .select(`${notificationType}_enabled`)
      .eq('user_id', userId)
      .single();

    if (error || !settings) {
      // Default to enabled if settings not found
      return true;
    }

    return settings[`${notificationType}_enabled`] || false;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error checking notification settings:', error);
    // Default to enabled on error
    return true;
  }
}

/**
 * Create notification only if user has enabled that type
 */
export async function createNotificationIfEnabled(
  notificationData: NotificationData
): Promise<string | null> {
  const isEnabled = await isNotificationEnabled(
    notificationData.user_id,
    notificationData.type
  );

  if (!isEnabled) {
    return null;
  }

  return createNotification(notificationData);
}

/**
 * Get admin user IDs for creating admin notifications
 */
export async function getAdminUserIds(): Promise<string[]> {
  try {
    const supabase = createServerSupabaseClient();

    const { data: admins, error } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin');

    if (error || !admins) {
      // eslint-disable-next-line no-console
      console.error('Error fetching admin users:', error);
      return [];
    }

    return admins.map((admin: { id: string }) => admin.id);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error in getAdminUserIds:', error);
    return [];
  }
}
