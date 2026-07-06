import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { MockPayment } from "@/components/mock-payment";
import { canAccessOrder } from "@/lib/order-access";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { WechatPayment } from "@/components/wechat-payment";
import { OrderStatusPoller } from "@/components/order-status-poller";

const labels: Record<string, string> = { PENDING_PAYMENT: "待支付", PAID: "已支付", FULFILLING: "待发货", SHIPPED: "已发货", COMPLETED: "已完成", CANCELED: "已取消", REFUNDING: "退款中", REFUNDED: "已退款" };

export default async function OrderPage({ params, searchParams }: { params: Promise<{ orderNo: string }>; searchParams: Promise<{ mockPayment?: string; qr?: string; resumeWechat?: string }> }) {
  const { orderNo } = await params;
  if (!(await canAccessOrder(orderNo))) redirect("/orders/lookup");
  const order = await prisma.order.findUnique({ where: { orderNo }, include: { items: true, shipment: true } });
  if (!order) redirect("/orders/lookup");
  const query = await searchParams;
  return <><SiteHeader solid /><main className="page-shell"><div className="container"><h1>订单详情</h1><div className="checkout-layout"><article className="card"><div className="summary-row"><strong>订单号</strong><span>{order.orderNo}</span></div><div className="summary-row"><strong>状态</strong><span className="status-pill">{labels[order.status]}</span></div>{query.mockPayment && <MockPayment merchantTradeNo={query.mockPayment} />}{query.resumeWechat && order.status === "PENDING_PAYMENT" && <WechatPayment orderNo={order.orderNo} />}{query.qr && order.status === "PENDING_PAYMENT" && <div className="qr-box"><Image src={query.qr} alt="微信支付二维码" width={280} height={280} unoptimized /><p>请使用微信扫一扫完成支付</p></div>}<h3>商品</h3><div className="order-items">{order.items.map((item) => <div className="order-line" key={item.id}><span>{item.productName} · {item.variantName} × {item.quantity}</span><strong>{formatMoney(item.unitPriceFen * item.quantity)}</strong></div>)}</div>{order.shipment && <><h3>物流信息</h3><p>{order.shipment.carrier} · {order.shipment.trackingNo}</p></>}<h3>收货信息</h3><p>{order.recipientName}　{order.phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2")}<br />{order.province}{order.city}{order.district}{order.address}</p></article><aside className="card summary"><h3>金额</h3><div className="summary-row"><span>商品</span><strong>{formatMoney(order.subtotalFen)}</strong></div><div className="summary-row"><span>配送</span><strong>{formatMoney(order.shippingFen)}</strong></div><div className="summary-row summary-total"><span>实付</span><strong>{formatMoney(order.totalFen)}</strong></div><Link className="primary-button full" href="/">继续选购</Link></aside></div>{order.status === "PENDING_PAYMENT" && <OrderStatusPoller orderNo={order.orderNo} />}</div></main></>;
}
