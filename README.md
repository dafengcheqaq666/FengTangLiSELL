# 山野蜜境 · Next.js 鲜果商城

蜂糖李宣传页已经迁移为 Next.js 16 App Router 商城，包含响应式商品页、鲜果篮、游客结算、订单查询、库存预占、微信/支付宝支付适配和单管理员后台。

## 本地启动

要求 Node.js 22、npm 和 PostgreSQL 15+。

```powershell
Copy-Item .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

默认地址为 `http://localhost:3000`，后台为 `/admin`。开发时保持 `PAYMENT_MODE=mock`；提交订单后会经过真实订单与库存流程，只把第三方收银台替换为本地模拟回调。

## Docker 启动

先复制并修改 `.env.example`，尤其是 `SESSION_SECRET`、`CRON_SECRET` 和管理员密码，然后运行：

```powershell
docker compose up --build
```

Compose 会依次启动 PostgreSQL、执行迁移和幂等种子、启动应用，并每分钟关闭超时订单及释放预占库存。数据库保存在 `postgres_data` volume；生产环境应另行配置加密备份和 HTTPS 反向代理。

## 支付配置

接真实支付前把 `PAYMENT_MODE` 改为 `live`，将 `APP_URL` 设置为已备案的 HTTPS 域名，并配置：

- 微信支付：公众号 AppID/Secret、商户号、商户证书序列号、商户私钥、API v3 Key、平台证书。微信内使用 JSAPI，普通手机浏览器使用 H5，桌面使用 Native 二维码。
- 支付宝：应用 ID、应用 RSA2 私钥、支付宝公钥。移动端使用 WAP，桌面使用电脑网站支付。

支付平台需要放行这些公网地址：

- `POST /api/payments/wechat/notify`
- `POST /api/payments/wechat/refund-notify`
- `GET /api/payments/wechat/oauth`
- `POST /api/payments/alipay/notify`

浏览器返回页不被当作支付凭据；系统只接受验签后的异步通知，并再次校验商户、应用和订单金额。微信退款异步完成，支付宝退款按同步响应完成。上线前必须在两家平台的沙箱/验收环境中各完成支付、重复通知、超时关单和退款测试。

## 业务规则

- 价格、配送区域与库存全部以服务端数据库为准，购物车中的价格只用于即时展示。
- 创建订单后预占库存 15 分钟；定时任务先关闭第三方支付单，确认成功后才释放库存。
- 游客通过高熵订单号和收货手机号重新获取查单权限；登录、查单、下单和发起支付均有限流。
- 首版仅支持未发货订单整单原路退款。发货后售后、部分退款、短信、发票和物流轨迹接口不在本版范围。
- 默认种子启用中国大陆 31 个省级区域包邮，港澳台不在可售范围；管理员可在后台逐省禁用或配置运费。

## 管理与运维

后台支持商品名称/副标题/上下架、规格价格、库存、配送区域、订单发货和整单退款。所有管理变更写入 `AuditLog`。

健康检查为 `GET /api/health`。定时任务为 `POST /api/internal/jobs/expire-orders`，调用时必须携带 `Authorization: Bearer <CRON_SECRET>`。

常用检查：

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```
