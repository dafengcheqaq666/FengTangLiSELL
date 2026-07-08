import { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const adminOrderStatusOptions = [
  { value: OrderStatus.PENDING_PAYMENT, label: "待支付" },
  { value: OrderStatus.PAID, label: "已支付" },
  { value: OrderStatus.FULFILLING, label: "待发货" },
  { value: OrderStatus.SHIPPED, label: "已发货" },
  { value: OrderStatus.COMPLETED, label: "已完成" },
  { value: OrderStatus.CANCELED, label: "已取消" },
  { value: OrderStatus.REFUNDING, label: "退款中" },
  { value: OrderStatus.REFUNDED, label: "已退款" },
] as const;

export const adminOrderStatusLabel: Record<OrderStatus, string> = Object.fromEntries(
  adminOrderStatusOptions.map((status) => [status.value, status.label]),
) as Record<OrderStatus, string>;

const ORDER_PAGE_SIZE = 50;
const statusValues = new Set<string>(adminOrderStatusOptions.map((status) => status.value));

export type AdminOrderFilters = {
  q: string;
  status?: OrderStatus;
};

type RawAdminOrderFilters = {
  q?: string | string[];
  status?: string | string[];
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function normalizeAdminOrderFilters(input: RawAdminOrderFilters = {}): AdminOrderFilters {
  const q = firstParam(input.q)?.trim().slice(0, 60) ?? "";
  const rawStatus = firstParam(input.status);
  return {
    q,
    status: rawStatus && statusValues.has(rawStatus) ? (rawStatus as OrderStatus) : undefined,
  };
}

function buildAdminOrderWhere(filters: AdminOrderFilters): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {};

  if (filters.status) where.status = filters.status;
  if (filters.q) {
    where.OR = [
      { orderNo: { contains: filters.q, mode: Prisma.QueryMode.insensitive } },
      { recipientName: { contains: filters.q, mode: Prisma.QueryMode.insensitive } },
      { phone: { contains: filters.q } },
      { province: { contains: filters.q } },
      { city: { contains: filters.q } },
      { district: { contains: filters.q } },
    ];
  }

  return where;
}

export async function getAdminOrderDashboard(rawFilters: RawAdminOrderFilters = {}) {
  const filters = normalizeAdminOrderFilters(rawFilters);
  const where = buildAdminOrderWhere(filters);

  const [orders, filteredCount, statusRows] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: { orderBy: { id: "asc" } },
        payments: { orderBy: { createdAt: "desc" }, take: 1 },
        refund: true,
        shipment: true,
      },
      orderBy: { createdAt: "desc" },
      take: ORDER_PAGE_SIZE,
    }),
    prisma.order.count({ where }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const statusCounts = Object.fromEntries(
    adminOrderStatusOptions.map((status) => [status.value, 0]),
  ) as Record<OrderStatus, number>;
  for (const row of statusRows) statusCounts[row.status] = row._count._all;

  return {
    filters,
    filteredCount,
    orders,
    pageSize: ORDER_PAGE_SIZE,
    statusCounts,
    totalCount: statusRows.reduce((sum, row) => sum + row._count._all, 0),
  };
}
