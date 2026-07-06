import { OrderStatus } from "@prisma/client";

export function canShip(status: OrderStatus) {
  return status === OrderStatus.PAID || status === OrderStatus.FULFILLING;
}

export function canRefund(status: OrderStatus) {
  return status === OrderStatus.PAID || status === OrderStatus.FULFILLING;
}
