# 橙心商城（Web Mall）

一个可运行、可演示、适合课程设计答辩的综合商品商城系统。项目采用前后端分离架构：Vue 3 前端通过 Axios 调用 Express RESTful API，业务数据持久化到 MySQL，登录使用 JWT 与 bcrypt 密码哈希。

## 功能清单

- 用户注册、登录、退出和本地登录状态持久化
- 首页 Banner、分类入口、热门推荐商品
- 商品分类筛选、关键词检索、价格/销量排序和分页
- 商品详情、库存校验、收藏、加入购物车和立即购买
- 购物车多选、全选、数量修改、删除、实时总价和创建订单
- 收货地址增删改查、默认地址和订单收货信息
- 订单创建、库存扣减、价格快照、订单列表、详情、取消订单与库存回滚
- 完整模拟交易闭环：用户模拟支付 → 管理员模拟发货 → 用户确认收货 → 订单完成
- 模拟信用卡收银台：卡号分组、Luhn 校验、有效期/CVV 校验、Visa 与 Mastercard 自动识别
- 个人资料、收藏列表、个人中心嵌套路由
- 管理员商品新增、编辑、删除及上下架
- Vue Router 路由守卫、Axios 请求/响应拦截器、普通用户后台拦截
- 基于 `postcss-pxtorem` 和 CSS Media Query 的 320px 至 1080px 响应式适配

## 技术栈

| 范围 | 技术 |
| --- | --- |
| 前端 | Vue 3、Vite、Composition API、`<script setup>`、Vue Router 4、Pinia、Axios、Element Plus |
| 后端 | Node.js、Express、mysql2、JWT、bcrypt、cors、dotenv |
| 数据库 | MySQL 8.0+ |

## 项目结构

```text
web-mall/
├── client/                         # Vue 3 前端
│   ├── src/
│   │   ├── api/                    # 按业务划分的请求模块
│   │   ├── assets/                 # 全局样式
│   │   ├── components/             # 顶部导航、商品卡片
│   │   ├── router/                 # 路由与登录守卫
│   │   ├── stores/                 # user、goods、cart、order Pinia Store
│   │   ├── utils/request.js        # Axios 实例与双拦截器
│   │   └── views/                  # 商城、用户中心、后台页面
│   ├── postcss.config.js
│   └── vite.config.js
├── server/                         # Express 后端
│   ├── config/db.js                # MySQL 连接池
│   ├── controllers/                # 业务控制器
│   ├── middleware/                 # 认证、管理员、异常中间件
│   ├── routes/                     # RESTful 路由
│   ├── services/                   # 预留业务服务层
│   ├── sql/init.sql                # 表结构及 24 条商品初始数据
│   ├── .env.example
│   └── app.js
└── README.md
```

## 环境要求

- Node.js 18 或更高版本（建议 Node.js 20 LTS）
- pnpm 8+ 或 npm 9+
- MySQL 8.0+（MySQL 5.7 通常也可运行）

## 1. 初始化数据库

确保 MySQL 服务已经启动，然后在项目根目录执行：

```bash
mysql -u root -p < server/sql/init.sql
```

也可以在 Navicat、DataGrip 或 MySQL Workbench 中打开并执行 `server/sql/init.sql`。脚本会创建 `web_mall` 数据库、8 张业务表、6 个分类、24 件商品及两个演示账号。脚本包含重建表语句，重复执行会清除该数据库内原有商城数据。

> 当前电脑已额外配置一个独立的 MySQL 8.4 实例，数据库已完成初始化。它的启动脚本为 `mysql-runtime/start-mysql.ps1`；如重启电脑后数据库未运行，请在项目根目录执行 `powershell -ExecutionPolicy Bypass -File .\mysql-runtime\start-mysql.ps1`。

如果你是在本次支付模块更新前已经初始化过数据库，请额外执行一次迁移脚本：

```bash
mysql -u root -p < server/sql/upgrade-payment.sql
```

它只为 `orders` 表增加支付方式、卡组织、末四位和支付时间字段，不保存完整卡号、有效期或 CVV。

## 2. 配置后端

进入 `server`，复制 `.env.example` 为 `.env`，并填写你的 MySQL 用户名和密码：

```bash
cd server
copy .env.example .env
```

macOS/Linux 可使用：

```bash
cp .env.example .env
```

示例 `.env`：

```env
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=web_mall
DB_USER=root
DB_PASSWORD=你的MySQL密码
JWT_SECRET=请替换成一个随机长字符串
JWT_EXPIRES_IN=7d
```

安装并启动后端：

```bash
pnpm install
pnpm dev
```

服务默认运行在 `http://localhost:3000`。可通过访问 `http://localhost:3000/api/health` 检查服务状态。

## 3. 启动前端

在新的终端中执行：

```bash
cd client
pnpm install
pnpm dev
```

浏览器访问终端输出的地址，默认是 `http://localhost:5173`。Vite 已配置 `/api` 代理到 `http://localhost:3000`，通常不需要单独配置前端 API 地址。

构建生产版本：

```bash
cd client
pnpm build
```

## 演示账号

初始化 SQL 中的两种账号密码均为 `password`：

| 类型 | 用户名 | 邮箱 | 密码 |
| --- | --- | --- | --- |
| 普通用户 | `demo_user` | `user@mall.test` | `password` |
| 管理员 | `admin` | `admin@mall.test` | `password` |

管理员登录后，可从右上角用户菜单进入“后台管理”。

## 核心接口概览

| 模块 | 接口示例 |
| --- | --- |
| 认证 | `POST /api/auth/register`、`POST /api/auth/login` |
| 用户 | `GET/PUT /api/user/profile` |
| 商品 | `GET /api/goods`、`GET /api/goods/:id`、`GET /api/goods/categories` |
| 购物车 | `GET/POST /api/cart`、`PUT/DELETE /api/cart/:id` |
| 收藏与地址 | `/api/favorites`、`/api/addresses` |
| 订单 | `POST /api/orders`、`GET /api/orders`、`GET /api/orders/:id`、`PUT /api/orders/:id/pay`、`PUT /api/orders/:id/complete`、`PUT /api/orders/:id/cancel` |
| 管理后台 | `GET/POST /api/admin/goods`、`PUT/DELETE /api/admin/goods/:id`、`GET /api/admin/orders`、`PUT /api/admin/orders/:id/ship` |

受保护接口需要在请求头携带：`Authorization: Bearer <token>`。前端的 `src/utils/request.js` 会自动添加该请求头，并在 401 时清除本地登录状态、跳转回登录页。

## 课程答辩可讲解的设计点

1. 密码只保存 bcrypt 哈希，登录后由 JWT 维护身份；`authMiddleware` 解析用户，`adminMiddleware` 验证角色。
2. 下单通过 MySQL 事务完成：锁定商品、检查库存、写入订单和商品快照、扣减库存、删除已购买购物车项；任一步出错均回滚。
3. `order_items` 保存商品名称、图片、单价和小计快照，因此之后修改商品不会影响历史订单。
4. 前端状态按用户、商品、购物车、订单拆分至独立 Pinia Store，组件不直接硬编码 API 地址。
5. `router.beforeEach` 管理登录/管理员页面访问；用户中心和后台均使用嵌套路由和 `<router-view>`。
6. 订单状态严格按 `待付款 → 待发货 → 待收货 → 已完成` 流转；管理员只能发货已付款订单，用户只能确认已发货订单。模拟支付不对接第三方网关，也不会发生真实扣款。
7. 收银台在浏览器内校验测试信用卡号、有效期和 CVV，仅向后端提交卡组织与末四位；数据库从设计上不接收完整卡号、有效期或 CVV。

## 已知限制

- 项目未接入真实第三方支付、物流和图片上传服务；支付与发货为课程演示的状态流转，不会发生真实扣款或物流派单。
- 初始商品图使用外部 Unsplash 图片 URL。若用于离线展示，请将图片下载到本地或替换为学校服务器图片地址。
- 管理端聚焦课程要求的商品管理，未实现用户管理、运营报表与订单审核。
