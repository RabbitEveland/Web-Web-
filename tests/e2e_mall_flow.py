"""橙心商城端到端自动化测试。

覆盖并截图记录以下完整业务闭环：
1. 用户认证与商品浏览；2. 购物车与订单；3. 模拟信用卡支付；
4. 后台模拟发货及用户确认收货。

默认测试账号：Nijien official / password。
注意：为了在同一次测试内完成“后台发货”，该账号必须在数据库中拥有 admin
角色。脚本只使用浏览器界面操作，不会直接写入数据库。
"""

from __future__ import annotations

import argparse
import os
import re
import shutil
import sys
import tempfile
import time
import unittest
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Iterable
from urllib.parse import urlparse

from selenium import webdriver
from selenium.common.exceptions import TimeoutException, WebDriverException
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


DEFAULT_BASE_URL = "http://127.0.0.1:5173"
DEFAULT_USERNAME = "Nijien official"
DEFAULT_PASSWORD = "password"
SCRIPT_VERSION = "2026.09.16-shipping-filter-fix-v6"
ROOT = Path(__file__).resolve().parents[1]
PROJECT_CHROMEDRIVER = ROOT / "tests" / "tools" / "chromedriver-win64" / "chromedriver.exe"


@dataclass(frozen=True)
class TestConfig:
    base_url: str
    username: str
    password: str
    screenshot_dir: Path
    headless: bool
    timeout: int
    admin_only: bool


CONFIG: TestConfig


def xpath_literal(value: str) -> str:
    """Return an XPath string literal, including names containing quotation marks."""
    if "'" not in value:
        return f"'{value}'"
    if '"' not in value:
        return f'"{value}"'
    pieces = value.split("'")
    return "concat(" + ", \"'\", ".join(f"'{piece}'" for piece in pieces) + ")"


class MallE2ETest(unittest.TestCase):
    """One ordered scenario: it creates one real demonstration order."""

    driver: webdriver.Chrome
    wait: WebDriverWait
    step_number: int
    order_url: str
    order_no: str

    @classmethod
    def setUpClass(cls) -> None:
        CONFIG.screenshot_dir.mkdir(parents=True, exist_ok=True)
        cls.chrome_profile_dir = Path(tempfile.mkdtemp(prefix="mall-e2e-chrome-"))
        options = Options()
        # 首页含有外部演示图片。测试只需 DOM 可交互，不应因为图片资源迟缓而
        # 卡在 driver.get()，因此使用 eager（DOM 就绪）而不是完整 load 等待。
        options.page_load_strategy = "eager"
        if CONFIG.headless:
            options.add_argument("--headless=new")
        options.add_argument("--window-size=1440,1000")
        options.add_argument(f"--user-data-dir={cls.chrome_profile_dir}")
        options.add_argument("--no-first-run")
        options.add_argument("--no-default-browser-check")
        # 这台 Windows 环境中 Chrome 152 的 GPU 子进程可能因权限错误退出；
        # 强制使用 SwiftShader 软件渲染，保证可截图且不依赖显卡驱动。
        options.add_argument("--disable-gpu")
        options.add_argument("--disable-gpu-sandbox")
        options.add_argument("--use-angle=swiftshader")
        options.add_argument("--use-gl=angle")
        options.add_argument("--disable-software-rasterizer")
        options.add_argument("--disable-notifications")
        options.add_argument("--lang=zh-CN")
        options.add_argument("--force-device-scale-factor=1")
        try:
            # tests/tools 内放置与本机 Chrome 匹配的驱动时优先使用，避免
            # Selenium Manager 因网络受限而错误复用旧缓存驱动。
            service = Service(executable_path=str(PROJECT_CHROMEDRIVER)) if PROJECT_CHROMEDRIVER.is_file() else None
            cls.driver = webdriver.Chrome(service=service, options=options) if service else webdriver.Chrome(options=options)
        except WebDriverException as exc:
            raise RuntimeError(
                "无法启动 Chrome。请安装 Google Chrome，并执行 “python -m pip install -r tests/requirements.txt”。"
            "首次运行 Selenium 可能需要联网下载匹配的 ChromeDriver。"
            ) from exc
        cls.driver.set_window_size(1440, 1000)
        cls.driver.set_page_load_timeout(CONFIG.timeout)
        cls.wait = WebDriverWait(cls.driver, CONFIG.timeout)

    @classmethod
    def tearDownClass(cls) -> None:
        if hasattr(cls, "driver"):
            cls.driver.quit()
        if hasattr(cls, "chrome_profile_dir"):
            shutil.rmtree(cls.chrome_profile_dir, ignore_errors=True)

    def setUp(self) -> None:
        self.step_number = 0
        # 清理上一次浏览器会话，保证登录与路由守卫都被实际验证。
        self.go("/")
        self.driver.execute_script("localStorage.clear(); sessionStorage.clear();")
        self.driver.refresh()

    def tearDown(self) -> None:
        # 测试失败时也保留当前页面，便于排查选择器或业务状态。
        if sys.exc_info()[0] is not None:
            self.shot("失败页面")

    # ------------------------------ 基础工具 ------------------------------
    def go(self, path: str) -> None:
        target_url = path if path.startswith("http://") or path.startswith("https://") else f"{CONFIG.base_url.rstrip('/')}{path}"
        target = urlparse(target_url)
        current = urlparse(self.driver.current_url)
        # 首次打开使用浏览器导航；之后是 Vue 单页应用，改用 popstate 触发路由。
        # 这样不会因首页的外部图片或浏览器整页刷新而卡在旧页面。
        if current.netloc == target.netloc and self.driver.find_elements(By.ID, "app"):
            route = target.path or "/"
            if target.query:
                route += f"?{target.query}"
            self.driver.execute_script(
                "if (location.pathname + location.search !== arguments[0]) {"
                "history.pushState({}, '', arguments[0]);"
                "window.dispatchEvent(new PopStateEvent('popstate'));"
                "}",
                route,
            )
            return
        try:
            self.driver.get(target_url)
        except TimeoutException:
            # 图片、统计或第三方网络资源超时不影响本地商城的 DOM 操作。
            self.driver.execute_script("window.stop();")

    def shot(self, name: str) -> Path:
        self.step_number += 1
        safe_name = re.sub(r"[^0-9A-Za-z_\-\u4e00-\u9fff]+", "_", name).strip("_")
        output = CONFIG.screenshot_dir / f"{self.step_number:02d}_{safe_name}.png"
        self.driver.save_screenshot(str(output))
        print(f"[截图] {output}")
        return output

    def wait_for_text(self, text: str) -> None:
        literal = xpath_literal(text)
        self.wait.until(
            lambda driver: any(
                item.is_displayed()
                for item in driver.find_elements(By.XPATH, f"//*[contains(normalize-space(), {literal})]")
            )
        )

    def visible(self, xpath: str):
        def _first_visible(driver):
            for element in driver.find_elements(By.XPATH, xpath):
                if element.is_displayed():
                    return element
            return False

        return self.wait.until(_first_visible)

    def click(self, xpath: str) -> None:
        def _clickable(driver):
            for element in driver.find_elements(By.XPATH, xpath):
                if element.is_displayed() and element.is_enabled():
                    return element
            return False

        element = self.wait.until(_clickable)
        self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", element)
        self.wait.until(lambda _driver: element.is_enabled())
        element.click()

    def click_button(self, label: str) -> None:
        literal = xpath_literal(label)
        self.click(f"//button[normalize-space()={literal} or .//*[normalize-space()={literal}]]")

    def fill(self, css: str, text: str) -> None:
        field = self.wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, css)))
        field.click()
        field.send_keys(Keys.CONTROL, "a")
        field.send_keys(text)

    def fill_xpath(self, xpath: str, text: str) -> None:
        field = self.visible(xpath)
        field.click()
        field.send_keys(Keys.CONTROL, "a")
        field.send_keys(text)

    def click_dialog_button(self, label: str) -> None:
        literal = xpath_literal(label)
        self.click(
            "//div[contains(@class, 'el-overlay') and not(contains(@style, 'display: none'))]"
            f"//button[normalize-space()={literal} or .//*[normalize-space()={literal}]]"
        )

    # ------------------------------ 业务流程 ------------------------------
    def login_and_browse(self) -> None:
        """模块 1：认证、搜索、进入商品详情。"""
        # 直接点击 SPA 内的入口，避免对 /login 做一次完整页面刷新。
        self.wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".login-link")))
        self.click("//a[contains(@class, 'login-link')]")
        self.wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "input[placeholder='用户名或邮箱']")))
        self.shot("01_登录页面")
        self.fill("input[placeholder='用户名或邮箱']", CONFIG.username)
        self.fill("input[placeholder='密码']", CONFIG.password)
        self.click("//button[contains(@class, 'auth-submit')]")
        self.wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".user-trigger")))
        self.wait_for_text(CONFIG.username)
        self.shot("02_登录成功首页")

        search = self.wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "input[placeholder='搜索商品']")))
        search.send_keys("耳机")
        search.send_keys(Keys.ENTER)
        self.wait_for_text("搜索结果")
        self.shot("03_商品搜索结果")

        self.click("//article[contains(@class, 'product-card')]//button[contains(@class, 'product-image')]")
        self.wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".detail-card")))
        self.shot("04_商品详情")

    def ensure_address(self) -> None:
        """下单前保证账户至少有一个可用地址；仅在没有地址时创建。"""
        self.go("/user/address")
        self.wait_for_text("收货地址")
        cards = self.driver.find_elements(By.CSS_SELECTOR, ".address-card")
        if cards:
            self.shot("06_已有收货地址")
            return

        self.click_button("新增地址")
        self.wait_for_text("新增收货地址")
        self.shot("06_新增收货地址表单")
        dialog = "//div[contains(@class, 'el-dialog')]"
        fields: Iterable[tuple[str, str]] = (
            ("收货人", "自动化测试用户"),
            ("手机号", "13800138000"),
            ("省份", "重庆市"),
            ("城市", "重庆市"),
            ("区县", "沙坪坝区"),
        )
        for label, value in fields:
            self.fill_xpath(f"{dialog}//label[normalize-space()={xpath_literal(label)}]/following::input[1]", value)
        self.fill_xpath(f"{dialog}//textarea", "大学城中路 1 号（自动化测试地址）")
        self.click_dialog_button("保存地址")
        self.wait.until(lambda driver: any(card.is_displayed() for card in driver.find_elements(By.CSS_SELECTOR, ".address-card")))
        self.shot("07_收货地址已保存")

    def create_order(self) -> None:
        """模块 2：加入购物车、结算、生成待付款订单。"""
        # 当前页面是商品详情；在此通过 UI 加入购物车。
        self.click_button("加入购物车")
        self.wait_for_text("已加入购物车")
        self.shot("05_已加入购物车")

        self.ensure_address()
        self.go("/cart")
        self.wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".cart-item")))
        self.shot("08_购物车结算前")
        self.click_button("去结算")
        self.wait_for_text("确认收货地址")
        self.shot("09_确认收货地址")
        self.click("//div[contains(@class, 'el-dialog')]//button[contains(normalize-space(), '提交订单')]")
        self.wait.until(lambda driver: "/user/orders/" in driver.current_url)
        self.wait_for_text("订单详情")
        self.order_url = self.driver.current_url
        # 仅匹配订单详情标题区的 p，不能用全局 contains；否则 XPath 会先命中
        # html/body，导致 order_no 误变成整页文本。
        order_text = self.visible(
            "//div[contains(@class, 'detail-top')]//p[starts-with(normalize-space(), '订单号：')]"
        ).text
        self.order_no = order_text.replace("订单号：", "").strip()
        self.assertTrue(self.order_no, "未能从订单详情页读取订单号")
        self.shot("10_订单创建待付款")

    @staticmethod
    def valid_expiry() -> str:
        """返回两年后的有效期，确保长期可用。"""
        today = date.today()
        return f"{today.month:02d}/{(today.year + 2) % 100:02d}"

    def pay_order(self) -> None:
        """模块 3：信用卡品牌识别、校验并支付。"""
        self.click_button("去支付")
        self.wait_for_text("模拟信用卡支付")
        self.shot("11_模拟信用卡支付表单")
        self.fill("input[autocomplete='cc-number']", "4242424242424242")
        self.fill("input[autocomplete='cc-name']", "Nijien official")
        self.fill("input[autocomplete='cc-exp']", self.valid_expiry())
        self.fill("input[autocomplete='cc-csc']", "123")
        self.wait_for_text("已识别：Visa")
        self.shot("12_Visa卡号识别与校验")
        self.click("//div[contains(@class, 'el-dialog')]//button[contains(normalize-space(), '确认模拟支付')]")
        self.wait.until(EC.invisibility_of_element_located((By.XPATH, "//*[contains(normalize-space(), '模拟信用卡支付')]")))
        self.wait_for_text("待发货")
        self.shot("13_支付成功待发货")

    def open_admin_orders(self) -> None:
        """通过可见菜单进入后台订单页，并等待订单筛选器完成挂载。"""
        # 通过顶部菜单进入后台，而不是直接改地址。这样可确保 AdminOrdersView
        # 的 onMounted 请求实际执行并把订单数据写入 Element Plus 表格。
        self.click("//button[contains(@class, 'user-trigger')]")
        self.click("//li[contains(@class, 'el-dropdown-menu__item') and contains(normalize-space(), '后台管理')]")
        self.wait_for_text("商城后台")
        self.click("//li[contains(@class, 'el-menu-item') and contains(normalize-space(), '订单发货')]")
        self.wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".status-filter")))

    def debug_admin_orders(self) -> None:
        """无写入诊断：只打开已付款订单列表并输出、截图表格文本。"""
        self.open_admin_orders()
        self.click("//label[.//span[normalize-space()='待发货']]")
        table = self.wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".orders-table")))
        time.sleep(1)
        print("[后台表格文本]\n" + table.text)
        self.shot("后台待发货列表诊断")

    def ship_and_complete(self) -> None:
        """模块 4：管理员筛选待发货订单、模拟发货、用户确认收货。"""
        self.open_admin_orders()
        try:
            self.wait_for_text("订单发货")
        except TimeoutException as exc:
            self.shot("14_后台权限不足")
            raise AssertionError(
                f"账号“{CONFIG.username}”没有管理员权限，无法测试后台发货。"
                "请在 users 表将该账号的 role 设为 admin 后重新运行。"
            ) from exc

        # 筛选已付款订单，定位本次刚创建的订单。
        self.click("//label[.//span[normalize-space()='待发货']]")
        self.wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".orders-table")))
        # Element Plus 在不同版本/浏览器下的表格行可能是虚拟行或普通 tr，
        # 先直接定位订单号文字，再由浏览器在其所属行内点击操作按钮。
        order_cell = self.visible(
            f"//*[contains(@class, 'orders-table')]//*[normalize-space()={xpath_literal(self.order_no)}]"
        )
        self.shot("14_后台待发货订单")
        clicked = self.driver.execute_script(
            "const row = arguments[0].closest('tr');"
            "const button = row && [...row.querySelectorAll('button')]"
            ".find(item => item.innerText.includes('模拟发货'));"
            "if (button) { button.click(); return true; }"
            "return false;",
            order_cell,
        )
        self.assertTrue(clicked, f"未在订单 {self.order_no} 所在行找到“模拟发货”按钮")
        self.wait_for_text("确认发货")
        self.shot("15_后台确认模拟发货")
        self.click_dialog_button("确认发货")
        # 当前表格筛选条件是“待发货”。发货成功后订单状态会成为“待收货”，
        # 并从该筛选列表自动消失；以订单号消失作为后台状态更新的 UI 断言。
        order_cell_xpath = f"//*[contains(@class, 'orders-table')]//*[normalize-space()={xpath_literal(self.order_no)}]"
        self.wait.until(lambda driver: not any(cell.is_displayed() for cell in driver.find_elements(By.XPATH, order_cell_xpath)))
        self.shot("16_后台发货完成")

        # 用同一浏览器会话回到用户订单页，验证订单的最终状态流转。
        self.go(self.order_url)
        self.wait_for_text("确认收货")
        self.shot("17_用户待收货订单")
        self.click_button("确认收货")
        self.wait_for_text("确认已经收到商品吗")
        self.shot("18_用户确认收货")
        self.click_dialog_button("确认收货")
        self.wait_for_text("已完成")
        self.shot("19_订单闭环已完成")

    def test_01_full_mall_flow(self) -> None:
        self.login_and_browse()
        if CONFIG.admin_only:
            self.debug_admin_orders()
            return
        self.create_order()
        self.pay_order()
        self.ship_and_complete()


def parse_config() -> TestConfig:
    parser = argparse.ArgumentParser(description="橙心商城全流程 Selenium 自动化测试")
    parser.add_argument("--base-url", default=os.getenv("MALL_BASE_URL", DEFAULT_BASE_URL), help="前端地址，默认 http://127.0.0.1:5173")
    parser.add_argument("--username", default=os.getenv("MALL_USERNAME", DEFAULT_USERNAME), help="测试账号")
    parser.add_argument("--password", default=os.getenv("MALL_PASSWORD", DEFAULT_PASSWORD), help="测试密码")
    parser.add_argument("--headed", action="store_true", help="显示 Chrome 浏览器窗口（默认无头运行）")
    parser.add_argument("--timeout", type=int, default=15, help="单个页面操作超时秒数")
    parser.add_argument("--admin-only", action="store_true", help="仅检查后台待发货表格并截图；不创建订单、不支付、不发货")
    parser.add_argument("--screenshot-dir", default=None, help="截图输出目录")
    args, remaining = parser.parse_known_args()
    # 交还 unittest 参数，便于支持 -v、-k 等标准用法。
    sys.argv = [sys.argv[0], *remaining]
    timestamp = time.strftime("%Y%m%d-%H%M%S")
    output = Path(args.screenshot_dir) if args.screenshot_dir else ROOT / "tests" / "artifacts" / f"mall-e2e-{timestamp}"
    return TestConfig(
        base_url=args.base_url,
        username=args.username,
        password=args.password,
        screenshot_dir=output,
        headless=not args.headed,
        timeout=args.timeout,
        admin_only=args.admin_only,
    )


if __name__ == "__main__":
    CONFIG = parse_config()
    print(f"测试脚本版本：{SCRIPT_VERSION}")
    print(f"商城地址：{CONFIG.base_url}")
    print(f"截图目录：{CONFIG.screenshot_dir}")
    print(f"测试账号：{CONFIG.username}")
    unittest.main(verbosity=2)
