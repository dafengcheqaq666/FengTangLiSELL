import Link from "next/link";
import { OrderStatus, PaymentProvider, PaymentStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import {
  adminOrderStatusLabel,
  adminOrderStatusOptions,
  getAdminOrderDashboard,
} from "@/lib/admin-orders";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { canRefund, canShip } from "@/lib/order-policy";
import { refundOrder, shipOrder, updateProduct, updateVariant, updateZone } from "./actions";

const paymentProviderLabel: Record<PaymentProvider, string> = {
  MOCK: "模拟支付",
  WECHAT: "微信支付",
  ALIPAY: "支付宝",
};

const paymentStatusLabel: Record<PaymentStatus, string> = {
  CREATED: "已创建",
  PENDING: "待支付",
  SUCCEEDED: "已成功",
  FAILED: "已失败",
  CLOSED: "已关闭",
  REFUNDING: "退款中",
  REFUNDED: "已退款",
};

type AdminPageProps = {
  searchParams?: Promise<{
    q?: string | string[];
    status?: string | string[];
  }>;
};

export const dynamic = "force-dynamic";

function formatDateTime(date: Date) {
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusHref(q: string, status?: OrderStatus) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status) params.set("status", status);
  const query = params.toString();
  return query ? `/admin?${query}` : "/admin";
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const admin = await requireAdmin();
  const rawFilters = searchParams ? await searchParams : {};
  const [variants, orderDashboard, zones] = await Promise.all([
    prisma.productVariant.findMany({ include: { product: true }, orderBy: { sortOrder: "asc" } }),
    getAdminOrderDashboard(rawFilters),
    prisma.shippingZone.findMany({ orderBy: { province: "asc" } }),
  ]);
  const product = variants[0]?.product;

  return (
    <div className="admin-shell">
      <header className="admin-bar">
        <div className="container">
          <strong>山野蜜境 · 管理后台</strong>
          <div>
            {admin.email}　
            <form action="/api/admin/logout" method="post" style={{ display: "inline" }}>
              <button className="small-button">退出</button>
            </form>
          </div>
        </div>
      </header>

      <main className="page-shell">
        <div className="container">
          {product && (
            <section className="card" style={{ marginBottom: 20 }}>
              <h2>商品信息</h2>
              <form action={updateProduct} className="form-grid">
                <input type="hidden" name="id" value={product.id} />
                <div className="field">
                  <label>商品名称</label>
                  <input name="name" defaultValue={product.name} />
                </div>
                <div className="field">
                  <label>副标题</label>
                  <input name="subtitle" defaultValue={product.subtitle ?? ""} />
                </div>
                <label>
                  <input type="checkbox" name="active" defaultChecked={product.active} /> 前台在售
                </label>
                <button className="small-button">保存商品</button>
              </form>
            </section>
          )}

          <div className="admin-grid">
            <section className="card">
              <h2>商品与库存</h2>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>规格</th>
                      <th>价格</th>
                      <th>库存</th>
                      <th>预占</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((variant) => (
                      <tr key={variant.id}>
                        <td>
                          {variant.product.name}
                          <br />
                          {variant.name}
                        </td>
                        <td colSpan={4}>
                          <form action={updateVariant} className="inline-form">
                            <input type="hidden" name="id" value={variant.id} />
                            <input
                              name="price"
                              type="number"
                              min="0.01"
                              step="0.01"
                              defaultValue={(variant.priceFen / 100).toFixed(2)}
                              style={{ width: 90 }}
                            />
                            <input
                              name="stock"
                              type="number"
                              min="0"
                              defaultValue={variant.stockOnHand}
                              style={{ width: 75 }}
                            />
                            <span>预占 {variant.stockReserved}</span>
                            <button className="small-button">保存</button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="card">
              <h2>配送区域</h2>
              <div className="table-wrap" style={{ maxHeight: 360 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>省份</th>
                      <th>启用 / 运费</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zones.map((zone) => (
                      <tr key={zone.id}>
                        <td>{zone.province}</td>
                        <td>
                          <form action={updateZone} className="inline-form">
                            <input type="hidden" name="id" value={zone.id} />
                            <input type="checkbox" name="enabled" defaultChecked={zone.enabled} />
                            <input
                              type="number"
                              name="fee"
                              min="0"
                              step="0.01"
                              defaultValue={(zone.feeFen / 100).toFixed(2)}
                              style={{ width: 75 }}
                            />
                            <button className="small-button">保存</button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <section className="card admin-orders-card" style={{ marginTop: 20 }}>
            <div className="admin-section-head">
              <div>
                <h2>订单管理</h2>
                <p className="muted">
                  当前显示 {orderDashboard.orders.length} / {orderDashboard.filteredCount} 笔订单
                </p>
              </div>
              <form className="admin-filter-form" method="get">
                <select name="status" defaultValue={orderDashboard.filters.status ?? ""}>
                  <option value="">全部状态</option>
                  {adminOrderStatusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                <input
                  type="search"
                  name="q"
                  placeholder="订单号 / 手机号 / 收货人"
                  defaultValue={orderDashboard.filters.q}
                />
                <button className="small-button">筛选</button>
                <Link className="small-button" href="/admin">
                  重置
                </Link>
              </form>
            </div>

            <div className="admin-metrics" aria-label="订单概览">
              <Link
                className={`admin-metric${orderDashboard.filters.status ? "" : " active"}`}
                href={statusHref(orderDashboard.filters.q)}
              >
                <span>全部</span>
                <strong>{orderDashboard.totalCount}</strong>
              </Link>
              {adminOrderStatusOptions.map((status) => (
                <Link
                  className={`admin-metric${orderDashboard.filters.status === status.value ? " active" : ""}`}
                  href={statusHref(orderDashboard.filters.q, status.value)}
                  key={status.value}
                >
                  <span>{status.label}</span>
                  <strong>{orderDashboard.statusCounts[status.value]}</strong>
                </Link>
              ))}
            </div>

            <div className="table-wrap">
              <table className="data-table admin-order-table">
                <thead>
                  <tr>
                    <th>订单</th>
                    <th>收货与配送</th>
                    <th>商品</th>
                    <th>金额</th>
                    <th>支付 / 售后</th>
                    <th>状态 / 操作</th>
                  </tr>
                </thead>
                <tbody>
                  {orderDashboard.orders.length ? (
                    orderDashboard.orders.map((order) => {
                      const payment = order.payments[0];
                      return (
                        <tr key={order.id}>
                          <td>
                            <strong>{order.orderNo}</strong>
                            <br />
                            <span className="muted">{formatDateTime(order.createdAt)}</span>
                            {order.customerNote && (
                              <div className="admin-note">备注：{order.customerNote}</div>
                            )}
                          </td>
                          <td>
                            <strong>{order.recipientName}</strong>
                            <br />
                            <span>{order.phone}</span>
                            <br />
                            <span className="muted">
                              {order.province}
                              {order.city}
                              {order.district}
                              {order.address}
                            </span>
                            {order.shipment && (
                              <div className="admin-note">
                                {order.shipment.carrier} · {order.shipment.trackingNo}
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="admin-order-lines">
                              {order.items.map((item) => (
                                <div className="admin-order-line" key={item.id}>
                                  <span>
                                    {item.productName}
                                    <br />
                                    <span className="muted">
                                      {item.variantName} × {item.quantity}
                                    </span>
                                  </span>
                                  <strong>{formatMoney(item.unitPriceFen * item.quantity)}</strong>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td>
                            <div className="admin-money-lines">
                              <span>商品 {formatMoney(order.subtotalFen)}</span>
                              <span>配送 {formatMoney(order.shippingFen)}</span>
                              <strong>合计 {formatMoney(order.totalFen)}</strong>
                            </div>
                          </td>
                          <td>
                            {payment ? (
                              <>
                                <strong>{paymentProviderLabel[payment.provider]}</strong>
                                <br />
                                <span className="muted">
                                  {paymentStatusLabel[payment.status]} · {payment.merchantTradeNo}
                                </span>
                              </>
                            ) : (
                              <span className="muted">未发起支付</span>
                            )}
                            {order.refund && (
                              <div className="admin-note">
                                {paymentStatusLabel[order.refund.status]} · {order.refund.refundNo}
                              </div>
                            )}
                          </td>
                          <td>
                            <span className="status-pill">{adminOrderStatusLabel[order.status]}</span>
                            {(canShip(order.status) || canRefund(order.status)) && (
                              <div className="admin-actions">
                                {canShip(order.status) && (
                                  <form action={shipOrder} className="inline-form">
                                    <input type="hidden" name="orderId" value={order.id} />
                                    <input name="carrier" placeholder="承运商" size={7} />
                                    <input name="trackingNo" placeholder="运单号" size={14} />
                                    <button className="small-button">发货</button>
                                  </form>
                                )}
                                {canRefund(order.status) && (
                                  <form action={refundOrder} className="inline-form">
                                    <input type="hidden" name="orderId" value={order.id} />
                                    <input name="reason" defaultValue="管理员整单退款" />
                                    <button className="small-button danger-button">退款</button>
                                  </form>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6}>暂无符合条件的订单。</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
