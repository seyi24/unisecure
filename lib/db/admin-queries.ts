import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  isNotNull,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  GUEST_LIFETIME_MESSAGE_LIMIT,
  getEntitlements,
  resolveActivePlan,
} from "@/lib/ai/entitlements";
import { ChatbotError } from "@/lib/errors";
import { getDatabaseUrl, getPostgresClientOptions } from "./database-url";
import { formatDbQueryError } from "./format-db-error";
import {
  chat,
  message,
  payment,
  type Payment,
  type PaymentStatus,
  type User,
  user,
  type UserPlan,
  userPlans,
} from "./schema";

const connectionString = getDatabaseUrl() ?? "";
const client = postgres(connectionString, getPostgresClientOptions(connectionString));
const db = drizzle(client);

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

const activePaidPlanCondition = and(
  eq(user.isAnonymous, false),
  ne(user.plan, "free"),
  or(
    sql`${user.planExpiresAt} IS NULL`,
    sql`${user.planExpiresAt} > NOW()`
  )
);

export type AdminOverviewStats = {
  registeredUsers: number;
  newUsers7d: number;
  guestUsers: number;
  activeSubscribers: number;
  revenue30dFcfa: number;
  messagesToday: number;
  failedPayments7d: number;
  successfulPayments30d: number;
};

export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  try {
    const since7d = daysAgo(7);
    const since30d = daysAgo(30);
    const today = startOfToday();

    const [
      [registeredRow],
      [newUsersRow],
      [guestRow],
      [activeSubRow],
      [revenueRow],
      [messagesRow],
      [failedRow],
      [successCountRow],
    ] = await Promise.all([
      db
        .select({ count: count() })
        .from(user)
        .where(eq(user.isAnonymous, false)),
      db
        .select({ count: count() })
        .from(user)
        .where(
          and(eq(user.isAnonymous, false), gte(user.createdAt, since7d))
        ),
      db.select({ count: count() }).from(user).where(eq(user.isAnonymous, true)),
      db.select({ count: count() }).from(user).where(activePaidPlanCondition),
      db
        .select({
          total: sql<number>`COALESCE(SUM(${payment.amount}), 0)::int`,
        })
        .from(payment)
        .where(
          and(
            eq(payment.status, "success"),
            gte(payment.createdAt, since30d)
          )
        ),
      db
        .select({ count: count(message.id) })
        .from(message)
        .innerJoin(chat, eq(message.chatId, chat.id))
        .where(
          and(gte(message.createdAt, today), eq(message.role, "user"))
        ),
      db
        .select({ count: count() })
        .from(payment)
        .where(
          and(eq(payment.status, "failed"), gte(payment.createdAt, since7d))
        ),
      db
        .select({ count: count() })
        .from(payment)
        .where(
          and(
            eq(payment.status, "success"),
            gte(payment.createdAt, since30d)
          )
        ),
    ]);

    return {
      registeredUsers: registeredRow?.count ?? 0,
      newUsers7d: newUsersRow?.count ?? 0,
      guestUsers: guestRow?.count ?? 0,
      activeSubscribers: activeSubRow?.count ?? 0,
      revenue30dFcfa: revenueRow?.total ?? 0,
      messagesToday: messagesRow?.count ?? 0,
      failedPayments7d: failedRow?.count ?? 0,
      successfulPayments30d: successCountRow?.count ?? 0,
    };
  } catch (error) {
    throw new ChatbotError(
      "bad_request:database",
      `Failed to load admin overview stats: ${formatDbQueryError(error)}`
    );
  }
}

export type DailyCountRow = { date: string; count: number };

export async function getDailyRegisteredUsers(
  days = 30
): Promise<DailyCountRow[]> {
  try {
    const since = daysAgo(days);
    const rows = await db
      .select({
        date: sql<string>`TO_CHAR(DATE(${user.createdAt}), 'YYYY-MM-DD')`,
        count: count(),
      })
      .from(user)
      .where(and(eq(user.isAnonymous, false), gte(user.createdAt, since)))
      .groupBy(sql`DATE(${user.createdAt})`)
      .orderBy(asc(sql`DATE(${user.createdAt})`));

    return rows.map((r) => ({ date: r.date, count: r.count }));
  } catch (error) {
    throw new ChatbotError(
      "bad_request:database",
      `Failed to load signup series: ${formatDbQueryError(error)}`
    );
  }
}

export async function getDailyRevenue(days = 30): Promise<DailyCountRow[]> {
  try {
    const since = daysAgo(days);
    const rows = await db
      .select({
        date: sql<string>`TO_CHAR(DATE(${payment.createdAt}), 'YYYY-MM-DD')`,
        count: sql<number>`COALESCE(SUM(${payment.amount}), 0)::int`,
      })
      .from(payment)
      .where(
        and(eq(payment.status, "success"), gte(payment.createdAt, since))
      )
      .groupBy(sql`DATE(${payment.createdAt})`)
      .orderBy(asc(sql`DATE(${payment.createdAt})`));

    return rows.map((r) => ({ date: r.date, count: r.count }));
  } catch (error) {
    throw new ChatbotError(
      "bad_request:database",
      `Failed to load revenue series: ${formatDbQueryError(error)}`
    );
  }
}

export async function getDailyMessages(days = 30): Promise<DailyCountRow[]> {
  try {
    const since = daysAgo(days);
    const rows = await db
      .select({
        date: sql<string>`TO_CHAR(DATE(${message.createdAt}), 'YYYY-MM-DD')`,
        count: count(message.id),
      })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(and(gte(message.createdAt, since), eq(message.role, "user")))
      .groupBy(sql`DATE(${message.createdAt})`)
      .orderBy(asc(sql`DATE(${message.createdAt})`));

    return rows.map((r) => ({ date: r.date, count: r.count }));
  } catch (error) {
    throw new ChatbotError(
      "bad_request:database",
      `Failed to load message series: ${formatDbQueryError(error)}`
    );
  }
}

export type PlanCountRow = { plan: UserPlan; count: number };

export async function getPlanDistribution(): Promise<PlanCountRow[]> {
  try {
    const rows = await db
      .select({
        plan: user.plan,
        count: count(),
      })
      .from(user)
      .where(eq(user.isAnonymous, false))
      .groupBy(user.plan);

    const byPlan = new Map<UserPlan, number>();
    for (const p of userPlans) {
      byPlan.set(p, 0);
    }
    for (const row of rows) {
      byPlan.set(row.plan, row.count);
    }

    return userPlans.map((plan) => ({
      plan,
      count: byPlan.get(plan) ?? 0,
    }));
  } catch (error) {
    throw new ChatbotError(
      "bad_request:database",
      `Failed to load plan distribution: ${formatDbQueryError(error)}`
    );
  }
}

export type RecentPaymentRow = Payment & {
  userEmail: string | null;
};

export async function getRecentPayments(
  limit = 10
): Promise<RecentPaymentRow[]> {
  try {
    return await db
      .select({
        id: payment.id,
        userId: payment.userId,
        plan: payment.plan,
        amount: payment.amount,
        currency: payment.currency,
        channel: payment.channel,
        referenceNumber: payment.referenceNumber,
        status: payment.status,
        providerTransactionId: payment.providerTransactionId,
        customerFirstName: payment.customerFirstName,
        customerLastName: payment.customerLastName,
        customerPhoneNumber: payment.customerPhoneNumber,
        customerEmail: payment.customerEmail,
        notificationPayload: payment.notificationPayload,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        userEmail: user.email,
      })
      .from(payment)
      .leftJoin(user, eq(payment.userId, user.id))
      .orderBy(desc(payment.createdAt))
      .limit(limit);
  } catch (error) {
    throw new ChatbotError(
      "bad_request:database",
      `Failed to load recent payments: ${formatDbQueryError(error)}`
    );
  }
}

export type RecentUserRow = Pick<
  User,
  "id" | "email" | "name" | "plan" | "isAnonymous" | "createdAt" | "planExpiresAt"
>;

export async function getRecentRegisteredUsers(
  limit = 10
): Promise<RecentUserRow[]> {
  try {
    return await db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        isAnonymous: user.isAnonymous,
        createdAt: user.createdAt,
        planExpiresAt: user.planExpiresAt,
      })
      .from(user)
      .where(eq(user.isAnonymous, false))
      .orderBy(desc(user.createdAt))
      .limit(limit);
  } catch (error) {
    throw new ChatbotError(
      "bad_request:database",
      `Failed to load recent users: ${formatDbQueryError(error)}`
    );
  }
}

export type AdminUserListItem = Pick<
  User,
  | "id"
  | "email"
  | "name"
  | "plan"
  | "isAnonymous"
  | "isAdmin"
  | "emailVerified"
  | "createdAt"
  | "planExpiresAt"
  | "image"
> & {
  activePlan: UserPlan;
};

export type ListAdminUsersParams = {
  search?: string;
  plan?: UserPlan | "all";
  accountType?: "all" | "registered" | "guest";
  page?: number;
  pageSize?: number;
};

export async function listAdminUsers({
  search,
  plan = "all",
  accountType = "all",
  page = 1,
  pageSize = 20,
}: ListAdminUsersParams): Promise<{ users: AdminUserListItem[]; total: number }> {
  try {
    const conditions = [];

    if (accountType === "registered") {
      conditions.push(eq(user.isAnonymous, false));
    } else if (accountType === "guest") {
      conditions.push(eq(user.isAnonymous, true));
    }

    if (plan !== "all") {
      conditions.push(eq(user.plan, plan));
    }

    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      conditions.push(or(ilike(user.email, term), ilike(user.name, term)));
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const [totalRow] = await db
      .select({ count: count() })
      .from(user)
      .where(whereClause);

    const offset = (page - 1) * pageSize;
    const rows = await db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        isAnonymous: user.isAnonymous,
        isAdmin: user.isAdmin,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        planExpiresAt: user.planExpiresAt,
        image: user.image,
      })
      .from(user)
      .where(whereClause)
      .orderBy(desc(user.createdAt))
      .limit(pageSize)
      .offset(offset);

    const users = rows.map((row) => ({
      ...row,
      activePlan: resolveActivePlan({
        plan: row.plan,
        planExpiresAt: row.planExpiresAt,
      }),
    }));

    return { users, total: totalRow?.count ?? 0 };
  } catch (error) {
    throw new ChatbotError(
      "bad_request:database",
      `Failed to list users: ${formatDbQueryError(error)}`
    );
  }
}

export type AdminUserDetail = {
  user: User;
  activePlan: UserPlan;
  messagesToday: number;
  lifetimeMessages: number;
  chatCount: number;
  payments: Payment[];
};

export async function getAdminUserDetail(
  userId: string
): Promise<AdminUserDetail | null> {
  try {
    const [row] = await db.select().from(user).where(eq(user.id, userId)).limit(1);
    if (!row) {
      return null;
    }

    const today = startOfToday();

    const [[messagesTodayRow], [lifetimeRow], [chatCountRow], paymentsList] =
      await Promise.all([
        db
          .select({ count: count(message.id) })
          .from(message)
          .innerJoin(chat, eq(message.chatId, chat.id))
          .where(
            and(
              eq(chat.userId, userId),
              gte(message.createdAt, today),
              eq(message.role, "user")
            )
          ),
        db
          .select({ count: count(message.id) })
          .from(message)
          .innerJoin(chat, eq(message.chatId, chat.id))
          .where(
            and(eq(chat.userId, userId), eq(message.role, "user"))
          ),
        db
          .select({ count: count() })
          .from(chat)
          .where(eq(chat.userId, userId)),
        db
          .select()
          .from(payment)
          .where(eq(payment.userId, userId))
          .orderBy(desc(payment.createdAt))
          .limit(20),
      ]);

    return {
      user: row,
      activePlan: resolveActivePlan({
        plan: row.plan,
        planExpiresAt: row.planExpiresAt,
      }),
      messagesToday: messagesTodayRow?.count ?? 0,
      lifetimeMessages: lifetimeRow?.count ?? 0,
      chatCount: chatCountRow?.count ?? 0,
      payments: paymentsList,
    };
  } catch (error) {
    throw new ChatbotError(
      "bad_request:database",
      `Failed to load user detail: ${formatDbQueryError(error)}`
    );
  }
}

export async function getUserChatsForAdmin(userId: string, limit = 10) {
  try {
    return await db
      .select({
        id: chat.id,
        title: chat.title,
        createdAt: chat.createdAt,
        visibility: chat.visibility,
      })
      .from(chat)
      .where(eq(chat.userId, userId))
      .orderBy(desc(chat.createdAt))
      .limit(limit);
  } catch (error) {
    throw new ChatbotError(
      "bad_request:database",
      `Failed to load user chats: ${formatDbQueryError(error)}`
    );
  }
}

export type PaymentStats = {
  totalCount: number;
  successCount: number;
  pendingCount: number;
  failedCount: number;
  cancelledCount: number;
  successRevenueFcfa: number;
  successRatePercent: number;
};

export async function getPaymentStats(): Promise<PaymentStats> {
  try {
    const [rows, [revenueRow]] = await Promise.all([
      db
        .select({
          status: payment.status,
          count: count(),
        })
        .from(payment)
        .groupBy(payment.status),
      db
        .select({
          total: sql<number>`COALESCE(SUM(${payment.amount}), 0)::int`,
        })
        .from(payment)
        .where(eq(payment.status, "success")),
    ]);

    let totalCount = 0;
    let successCount = 0;
    let pendingCount = 0;
    let failedCount = 0;
    let cancelledCount = 0;
    const successRevenueFcfa = revenueRow?.total ?? 0;

    for (const row of rows) {
      totalCount += row.count;
      if (row.status === "success") {
        successCount = row.count;
      } else if (row.status === "pending") {
        pendingCount = row.count;
      } else if (row.status === "failed") {
        failedCount = row.count;
      } else if (row.status === "cancelled") {
        cancelledCount = row.count;
      }
    }

    const successRatePercent =
      totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0;

    return {
      totalCount,
      successCount,
      pendingCount,
      failedCount,
      cancelledCount,
      successRevenueFcfa,
      successRatePercent,
    };
  } catch (error) {
    throw new ChatbotError(
      "bad_request:database",
      `Failed to load payment stats: ${formatDbQueryError(error)}`
    );
  }
}

export type AdminPaymentRow = RecentPaymentRow;

export type ListAdminPaymentsParams = {
  search?: string;
  status?: PaymentStatus | "all";
  plan?: UserPlan | "all";
  channel?: string | "all";
  page?: number;
  pageSize?: number;
};

export async function listAdminPayments({
  search,
  status = "all",
  plan = "all",
  channel = "all",
  page = 1,
  pageSize = 25,
}: ListAdminPaymentsParams): Promise<{ payments: AdminPaymentRow[]; total: number }> {
  try {
    const conditions = [];

    if (status !== "all") {
      conditions.push(eq(payment.status, status));
    }
    if (plan !== "all") {
      conditions.push(eq(payment.plan, plan));
    }
    if (channel !== "all" && channel.trim()) {
      conditions.push(eq(payment.channel, channel));
    }
    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(payment.referenceNumber, term),
          ilike(payment.customerEmail, term),
          ilike(user.email, term)
        )
      );
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const [totalRow] = await db
      .select({ count: count() })
      .from(payment)
      .leftJoin(user, eq(payment.userId, user.id))
      .where(whereClause);

    const offset = (page - 1) * pageSize;
    const payments = await db
      .select({
        id: payment.id,
        userId: payment.userId,
        plan: payment.plan,
        amount: payment.amount,
        currency: payment.currency,
        channel: payment.channel,
        referenceNumber: payment.referenceNumber,
        status: payment.status,
        providerTransactionId: payment.providerTransactionId,
        customerFirstName: payment.customerFirstName,
        customerLastName: payment.customerLastName,
        customerPhoneNumber: payment.customerPhoneNumber,
        customerEmail: payment.customerEmail,
        notificationPayload: payment.notificationPayload,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        userEmail: user.email,
      })
      .from(payment)
      .leftJoin(user, eq(payment.userId, user.id))
      .where(whereClause)
      .orderBy(desc(payment.createdAt))
      .limit(pageSize)
      .offset(offset);

    return { payments, total: totalRow?.count ?? 0 };
  } catch (error) {
    throw new ChatbotError(
      "bad_request:database",
      `Failed to list payments: ${formatDbQueryError(error)}`
    );
  }
}

export type SubscriptionPlanSummary = {
  plan: UserPlan;
  activeCount: number;
  storedCount: number;
  expiredCount: number;
};

export type SubscriptionUserRow = {
  id: string;
  email: string;
  name: string | null;
  plan: UserPlan;
  activePlan: UserPlan;
  planExpiresAt: Date | null;
  createdAt: Date;
};

export type SubscriptionOverview = {
  activeSubscribers: number;
  expiringWithin7Days: number;
  expiredPaidAccounts: number;
  byPlan: SubscriptionPlanSummary[];
  expiringSoon: SubscriptionUserRow[];
};

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function getSubscriptionOverview(): Promise<SubscriptionOverview> {
  try {
    const registered = and(eq(user.isAnonymous, false), ne(user.plan, "free"));
    const expiringCutoff = daysFromNow(7);

    const [byPlanRows, [activeSubRow], [expiringCountRow], [expiredRow], expiringSoon] =
      await Promise.all([
        db
          .select({ plan: user.plan, count: count() })
          .from(user)
          .where(registered)
          .groupBy(user.plan),
        db.select({ count: count() }).from(user).where(activePaidPlanCondition),
        db
          .select({ count: count() })
          .from(user)
          .where(
            and(
              registered,
              isNotNull(user.planExpiresAt),
              sql`${user.planExpiresAt} > NOW()`,
              sql`${user.planExpiresAt} <= ${expiringCutoff}`
            )
          ),
        db
          .select({ count: count() })
          .from(user)
          .where(
            and(
              registered,
              isNotNull(user.planExpiresAt),
              sql`${user.planExpiresAt} <= NOW()`
            )
          ),
        db
          .select({
            id: user.id,
            email: user.email,
            name: user.name,
            plan: user.plan,
            planExpiresAt: user.planExpiresAt,
            createdAt: user.createdAt,
          })
          .from(user)
          .where(
            and(
              registered,
              isNotNull(user.planExpiresAt),
              sql`${user.planExpiresAt} > NOW()`,
              sql`${user.planExpiresAt} <= ${expiringCutoff}`
            )
          )
          .orderBy(asc(user.planExpiresAt))
          .limit(20),
      ]);

    const storedByPlan = new Map<UserPlan, number>();
    for (const p of userPlans) {
      storedByPlan.set(p, 0);
    }
    for (const row of byPlanRows) {
      storedByPlan.set(row.plan, row.count);
    }

    const byPlan: SubscriptionPlanSummary[] = await Promise.all(
      userPlans
        .filter((p) => p !== "free")
        .map(async (plan) => {
          const [activeRow] = await db
            .select({ count: count() })
            .from(user)
            .where(and(activePaidPlanCondition, eq(user.plan, plan)));
          const [expiredPlanRow] = await db
            .select({ count: count() })
            .from(user)
            .where(
              and(
                eq(user.isAnonymous, false),
                eq(user.plan, plan),
                isNotNull(user.planExpiresAt),
                sql`${user.planExpiresAt} <= NOW()`
              )
            );
          return {
            plan,
            activeCount: activeRow?.count ?? 0,
            storedCount: storedByPlan.get(plan) ?? 0,
            expiredCount: expiredPlanRow?.count ?? 0,
          };
        })
    );

    const expiringSoonMapped: SubscriptionUserRow[] = expiringSoon.map((row) => ({
      ...row,
      activePlan: resolveActivePlan({
        plan: row.plan,
        planExpiresAt: row.planExpiresAt,
      }),
    }));

    return {
      activeSubscribers: activeSubRow?.count ?? 0,
      expiringWithin7Days: expiringCountRow?.count ?? 0,
      expiredPaidAccounts: expiredRow?.count ?? 0,
      byPlan,
      expiringSoon: expiringSoonMapped,
    };
  } catch (error) {
    throw new ChatbotError(
      "bad_request:database",
      `Failed to load subscription overview: ${formatDbQueryError(error)}`
    );
  }
}

export type ListSubscriptionUsersParams = {
  filter?: "active" | "expired" | "expiring" | "all";
  plan?: UserPlan | "all";
  page?: number;
  pageSize?: number;
};

export async function listSubscriptionUsers({
  filter = "all",
  plan = "all",
  page = 1,
  pageSize = 20,
}: ListSubscriptionUsersParams): Promise<{
  users: SubscriptionUserRow[];
  total: number;
}> {
  try {
    const expiringCutoff = daysFromNow(7);
    const conditions = [eq(user.isAnonymous, false), ne(user.plan, "free")];

    if (plan !== "all") {
      conditions.push(eq(user.plan, plan));
    }

    if (filter === "active") {
      const activeCondition = or(
        sql`${user.planExpiresAt} IS NULL`,
        sql`${user.planExpiresAt} > NOW()`
      );
      if (activeCondition) {
        conditions.push(activeCondition);
      }
    } else if (filter === "expired") {
      const expiredCondition = and(
        isNotNull(user.planExpiresAt),
        sql`${user.planExpiresAt} <= NOW()`
      );
      if (expiredCondition) {
        conditions.push(expiredCondition);
      }
    } else if (filter === "expiring") {
      const expiringCondition = and(
        isNotNull(user.planExpiresAt),
        sql`${user.planExpiresAt} > NOW()`,
        sql`${user.planExpiresAt} <= ${expiringCutoff}`
      );
      if (expiringCondition) {
        conditions.push(expiringCondition);
      }
    }

    const whereClause = and(...conditions);
    const [totalRow] = await db
      .select({ count: count() })
      .from(user)
      .where(whereClause);

    const offset = (page - 1) * pageSize;
    const rows = await db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        planExpiresAt: user.planExpiresAt,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(whereClause)
      .orderBy(desc(user.planExpiresAt))
      .limit(pageSize)
      .offset(offset);

    const users = rows.map((row) => ({
      ...row,
      activePlan: resolveActivePlan({
        plan: row.plan,
        planExpiresAt: row.planExpiresAt,
      }),
    }));

    return { users, total: totalRow?.count ?? 0 };
  } catch (error) {
    throw new ChatbotError(
      "bad_request:database",
      `Failed to list subscription users: ${formatDbQueryError(error)}`
    );
  }
}

export type UsageOverviewStats = {
  messagesToday: number;
  messages7d: number;
  messages30d: number;
  guestMessagesToday: number;
  registeredMessagesToday: number;
  chatsCreatedToday: number;
  usersAtDailyLimitToday: number;
  guestsAtLifetimeLimit: number;
};

export async function getUsageOverviewStats(): Promise<UsageOverviewStats> {
  try {
    const today = startOfToday();
    const since7d = daysAgo(7);
    const since30d = daysAgo(30);

    const [
      [messagesTodayRow],
      [messages7dRow],
      [messages30dRow],
      [guestTodayRow],
      [registeredTodayRow],
      [chatsTodayRow],
      [guestsLimitRow],
      todayUsageRows,
    ] = await Promise.all([
      db
        .select({ count: count(message.id) })
        .from(message)
        .innerJoin(chat, eq(message.chatId, chat.id))
        .where(and(gte(message.createdAt, today), eq(message.role, "user"))),
      db
        .select({ count: count(message.id) })
        .from(message)
        .innerJoin(chat, eq(message.chatId, chat.id))
        .where(and(gte(message.createdAt, since7d), eq(message.role, "user"))),
      db
        .select({ count: count(message.id) })
        .from(message)
        .innerJoin(chat, eq(message.chatId, chat.id))
        .where(and(gte(message.createdAt, since30d), eq(message.role, "user"))),
      db
        .select({ count: count(message.id) })
        .from(message)
        .innerJoin(chat, eq(message.chatId, chat.id))
        .innerJoin(user, eq(chat.userId, user.id))
        .where(
          and(
            gte(message.createdAt, today),
            eq(message.role, "user"),
            eq(user.isAnonymous, true)
          )
        ),
      db
        .select({ count: count(message.id) })
        .from(message)
        .innerJoin(chat, eq(message.chatId, chat.id))
        .innerJoin(user, eq(chat.userId, user.id))
        .where(
          and(
            gte(message.createdAt, today),
            eq(message.role, "user"),
            eq(user.isAnonymous, false)
          )
        ),
      db
        .select({ count: count() })
        .from(chat)
        .where(gte(chat.createdAt, today)),
      db.execute<{ count: number }>(sql`
        SELECT COUNT(*)::int AS count
        FROM "User" u
        WHERE u."isAnonymous" = true
        AND (
          SELECT COUNT(m.id)
          FROM "Message_v2" m
          INNER JOIN "Chat" c ON m."chatId" = c.id
          WHERE c."userId" = u.id AND m.role = 'user'
        ) >= ${GUEST_LIFETIME_MESSAGE_LIMIT}
      `),
      db
        .select({
          userId: chat.userId,
          messageCount: count(message.id),
          plan: user.plan,
          planExpiresAt: user.planExpiresAt,
          isAnonymous: user.isAnonymous,
        })
        .from(message)
        .innerJoin(chat, eq(message.chatId, chat.id))
        .innerJoin(user, eq(chat.userId, user.id))
        .where(
          and(
            gte(message.createdAt, today),
            eq(message.role, "user"),
            eq(user.isAnonymous, false)
          )
        )
        .groupBy(
          chat.userId,
          user.plan,
          user.planExpiresAt,
          user.isAnonymous
        ),
    ]);

    const guestsAtLifetimeLimit =
      (guestsLimitRow as { count: number } | undefined)?.count ?? 0;

    let usersAtDailyLimitToday = 0;
    for (const row of todayUsageRows) {
      const limit = getEntitlements({
        isAnonymous: row.isAnonymous,
        plan: row.plan,
        planExpiresAt: row.planExpiresAt,
      }).maxMessagesPerDay;
      if (row.messageCount >= limit) {
        usersAtDailyLimitToday += 1;
      }
    }

    return {
      messagesToday: messagesTodayRow?.count ?? 0,
      messages7d: messages7dRow?.count ?? 0,
      messages30d: messages30dRow?.count ?? 0,
      guestMessagesToday: guestTodayRow?.count ?? 0,
      registeredMessagesToday: registeredTodayRow?.count ?? 0,
      chatsCreatedToday: chatsTodayRow?.count ?? 0,
      usersAtDailyLimitToday,
      guestsAtLifetimeLimit,
    };
  } catch (error) {
    throw new ChatbotError(
      "bad_request:database",
      `Failed to load usage overview stats: ${formatDbQueryError(error)}`
    );
  }
}

export type TopUserByMessages = {
  id: string;
  email: string;
  name: string | null;
  isAnonymous: boolean;
  plan: UserPlan;
  activePlan: UserPlan;
  messageCount: number;
};

export async function getTopUsersByMessages(
  limit = 20,
  days = 7
): Promise<TopUserByMessages[]> {
  try {
    const since = daysAgo(days);
    const rows = await db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        isAnonymous: user.isAnonymous,
        plan: user.plan,
        planExpiresAt: user.planExpiresAt,
        messageCount: count(message.id),
      })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .innerJoin(user, eq(chat.userId, user.id))
      .where(and(gte(message.createdAt, since), eq(message.role, "user")))
      .groupBy(
        user.id,
        user.email,
        user.name,
        user.isAnonymous,
        user.plan,
        user.planExpiresAt
      )
      .orderBy(desc(count(message.id)))
      .limit(limit);

    return rows.map((row) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      isAnonymous: row.isAnonymous,
      plan: row.plan,
      activePlan: resolveActivePlan({
        plan: row.plan,
        planExpiresAt: row.planExpiresAt,
      }),
      messageCount: row.messageCount,
    }));
  } catch (error) {
    throw new ChatbotError(
      "bad_request:database",
      `Failed to load top users by messages: ${formatDbQueryError(error)}`
    );
  }
}

export type MessagesByPlanRow = { plan: UserPlan; messageCount: number };

export async function getMessagesByPlan(days = 1): Promise<MessagesByPlanRow[]> {
  try {
    const since = daysAgo(days);
    const rows = await db
      .select({
        plan: user.plan,
        planExpiresAt: user.planExpiresAt,
        isAnonymous: user.isAnonymous,
        messageCount: count(message.id),
      })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .innerJoin(user, eq(chat.userId, user.id))
      .where(
        and(
          gte(message.createdAt, since),
          eq(message.role, "user"),
          eq(user.isAnonymous, false)
        )
      )
      .groupBy(user.plan, user.planExpiresAt, user.isAnonymous);

    const byActivePlan = new Map<UserPlan, number>();
    for (const p of userPlans) {
      byActivePlan.set(p, 0);
    }

    for (const row of rows) {
      const activePlan = resolveActivePlan({
        plan: row.plan,
        planExpiresAt: row.planExpiresAt,
      });
      byActivePlan.set(
        activePlan,
        (byActivePlan.get(activePlan) ?? 0) + row.messageCount
      );
    }

    return userPlans.map((plan) => ({
      plan,
      messageCount: byActivePlan.get(plan) ?? 0,
    }));
  } catch (error) {
    throw new ChatbotError(
      "bad_request:database",
      `Failed to load messages by plan: ${formatDbQueryError(error)}`
    );
  }
}

export type GuestAtLifetimeLimitRow = {
  id: string;
  email: string;
  createdAt: Date;
  lifetimeMessages: number;
};

export async function getGuestsAtLifetimeLimit(
  limit = 50
): Promise<GuestAtLifetimeLimitRow[]> {
  try {
    const rows = await db
      .select({
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        lifetimeMessages: count(message.id),
      })
      .from(user)
      .innerJoin(chat, eq(chat.userId, user.id))
      .innerJoin(message, eq(message.chatId, chat.id))
      .where(and(eq(user.isAnonymous, true), eq(message.role, "user")))
      .groupBy(user.id, user.email, user.createdAt)
      .having(sql`count(${message.id}) >= ${GUEST_LIFETIME_MESSAGE_LIMIT}`)
      .orderBy(desc(count(message.id)))
      .limit(limit);

    return rows;
  } catch (error) {
    throw new ChatbotError(
      "bad_request:database",
      `Failed to load guests at lifetime limit: ${formatDbQueryError(error)}`
    );
  }
}

