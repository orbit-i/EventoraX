/**
 * Eventrye Real-Time Live Notification Engine
 * Tracks all platform mutations, tenant creations, attendee registrations,
 * security alerts, and system changes for the Superadmin Console.
 */

import { query, memoryStore } from '../db/db.js';

// In-memory buffer of notifications with instant fallback
export const liveNotifications = [
  {
    id: 1,
    title: 'Platform Launched v1.0.0',
    message: 'Eventrye production kernel initialized. Real-time sentinel & monitoring online.',
    category: 'system',
    severity: 'info',
    read: false,
    created_at: new Date().toISOString(),
    metadata: { version: '1.0.0', author: 'ORBIT-I Private Limited' }
  }
];

let nextNotificationId = 2;

/**
 * Dispatch a live notification across the system
 */
export async function dispatchNotification({
  title,
  message,
  category = 'system', // 'tenant', 'event', 'attendee', 'security', 'billing', 'cms', 'system'
  severity = 'info',   // 'info', 'success', 'warning', 'critical'
  metadata = {},
  tenantId = null,
  userId = null
}) {
  const notif = {
    id: nextNotificationId++,
    title,
    message,
    category,
    severity,
    read: false,
    created_at: new Date().toISOString(),
    metadata,
    tenant_id: tenantId,
    user_id: userId
  };

  // Push to in-memory array (keep latest 250)
  liveNotifications.unshift(notif);
  if (liveNotifications.length > 250) {
    liveNotifications.pop();
  }

  // Also sync to memoryStore if active
  if (memoryStore) {
    if (!memoryStore.notifications) memoryStore.notifications = [];
    memoryStore.notifications.unshift(notif);
  }

  // Attempt to persist to database if table exists
  try {
    await query(
      `INSERT INTO \`notifications\` (\`title\`, \`message\`, \`category\`, \`severity\`, \`metadata\`, \`is_read\`, \`created_at\`)
       VALUES (?, ?, ?, ?, ?, 0, NOW())`,
      [title, message, category, severity, JSON.stringify(metadata)]
    );
  } catch (err) {
    // Non-blocking fallback to in-memory store
  }

  return notif;
}

/**
 * Get all notifications with count
 */
export function getNotifications({ limit = 50, unreadOnly = false } = {}) {
  let list = [...liveNotifications];
  if (unreadOnly) {
    list = list.filter(n => !n.read);
  }
  const unreadCount = liveNotifications.filter(n => !n.read).length;
  return {
    notifications: list.slice(0, limit),
    totalCount: liveNotifications.length,
    unreadCount
  };
}

/**
 * Mark a single notification as read
 */
export function markNotificationAsRead(id) {
  const notif = liveNotifications.find(n => n.id === Number(id));
  if (notif) {
    notif.read = true;
    return true;
  }
  return false;
}

/**
 * Mark all notifications as read
 */
export function markAllNotificationsAsRead() {
  liveNotifications.forEach(n => { n.read = true; });
  if (memoryStore?.notifications) {
    memoryStore.notifications.forEach(n => { n.read = true; });
  }
  return true;
}

/**
 * Clear all notifications
 */
export function clearNotifications() {
  liveNotifications.length = 0;
  if (memoryStore?.notifications) {
    memoryStore.notifications.length = 0;
  }
  return true;
}
