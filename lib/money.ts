export function formatMoney(fen: number) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: fen % 100 === 0 ? 0 : 1,
  }).format(fen / 100);
}

export function makeOrderNo(prefix = "FT") {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const random = crypto.randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase();
  return `${prefix}${date}${random}`;
}
