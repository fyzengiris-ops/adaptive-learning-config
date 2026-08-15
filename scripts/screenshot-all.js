const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:5000';
const VIEWPORT = { width: 1920, height: 1080 };
const OUTPUT_BASE = path.join(__dirname, '../产品文档/6-html');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 关闭所有弹窗
async function closeAllModals(page) {
  // 尝试按ESC关闭弹窗
  await page.keyboard.press('Escape');
  await wait(300);
  // 点击遮罩层关闭弹窗
  try {
    const overlay = await page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await overlay.isVisible({ timeout: 500 }).catch(() => false)) {
      await overlay.click({ position: { x: 10, y: 10 } });
      await wait(300);
    }
  } catch (e) {}
  // 再按一次ESC
  await page.keyboard.press('Escape');
  await wait(300);
}

async function takeScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();

  const results = { success: [], failed: [] };

  try {
    // ========================================
    // 1-通用知识树
    // ========================================
    console.log('\n📁 1-通用知识树');
    const dir1 = path.join(OUTPUT_BASE, '1-通用知识树');
    ensureDir(dir1);

    console.log('  访问页面: /knowledge-system');
    await page.goto(`${BASE_URL}/knowledge-system`, { waitUntil: 'networkidle' });
    await wait(2000);

    // 1.3 首页-有数据
    console.log('  📸 1.3首页-有数据.png');
    await page.screenshot({ path: path.join(dir1, '1.3首页-有数据.png') });
    results.success.push('1-通用知识树/1.3首页-有数据.png');

    // 1.2 首页-新增学科弹窗
    console.log('  📸 1.2首页-新增学科弹窗.png');
    const addBtn = await page.locator('button:has-text("新增学科")').first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await wait(500);
      await page.screenshot({ path: path.join(dir1, '1.2首页-新增学科弹窗.png') });
      results.success.push('1-通用知识树/1.2首页-新增学科弹窗.png');
      await closeAllModals(page);
    }

    // 1.4 首页-查看历史发布记录弹窗
    console.log('  📸 1.4首页-查看历史发布记录弹窗.png');
    const historyBtn = await page.locator('button:has-text("查看历史发布记录")').first();
    if (await historyBtn.isVisible()) {
      await historyBtn.click();
      await wait(1000);
      await page.screenshot({ path: path.join(dir1, '1.4首页-查看历史发布记录弹窗.png') });
      results.success.push('1-通用知识树/1.4首页-查看历史发布记录弹窗.png');
      await closeAllModals(page);
    }

    // 进入详情页
    console.log('  进入详情页...');
    const enterBtn = await page.locator('button:has-text("进入管理")').first();
    if (await enterBtn.isVisible()) {
      await enterBtn.click();
      await wait(2000);

      // 2.01 详情页-非编辑态
      console.log('  📸 2.01详情页-非编辑态.png');
      await page.screenshot({ path: path.join(dir1, '2.01详情页-非编辑态.png') });
      results.success.push('1-通用知识树/2.01详情页-非编辑态.png');

      // 进入编辑态
      console.log('  进入编辑态...');
      const editBtn = await page.locator('button:has-text("编辑知识树")').first();
      if (await editBtn.isVisible()) {
        await editBtn.click();
        await wait(2000);

        // 2.03 详情页-编辑态-左侧知识树目录
        console.log('  📸 2.03详情页-编辑态-左侧知识树目录.png');
        await page.screenshot({ path: path.join(dir1, '2.03详情页-编辑态-左侧知识树目录.png') });
        results.success.push('1-通用知识树/2.03详情页-编辑态-左侧知识树目录.png');

        // 2.04 详情页-编辑态-右侧知识点信息
        console.log('  📸 2.04详情页-编辑态-右侧知识点信息.png');
        await page.screenshot({ path: path.join(dir1, '2.04详情页-编辑态-右侧知识点信息.png') });
        results.success.push('1-通用知识树/2.04详情页-编辑态-右侧知识点信息.png');

        // 切换Tab - 知识点结构
        const structureTab = await page.locator('button:has-text("知识点结构")').first();
        if (await structureTab.isVisible({ timeout: 1000 }).catch(() => false)) {
          await structureTab.click();
          await wait(500);
          console.log('  📸 2.05详情页-编辑态-右侧知识点结构.png');
          await page.screenshot({ path: path.join(dir1, '2.05详情页-编辑态-右侧知识点结构.png') });
          results.success.push('1-通用知识树/2.05详情页-编辑态-右侧知识点结构.png');
        }

        // 切换Tab - 学习资源
        const resourceTab = await page.locator('button:has-text("学习资源")').first();
        if (await resourceTab.isVisible({ timeout: 1000 }).catch(() => false)) {
          await resourceTab.click();
          await wait(500);
          console.log('  📸 2.07详情页-编辑态-学习资源.png');
          await page.screenshot({ path: path.join(dir1, '2.07详情页-编辑态-学习资源.png') });
          results.success.push('1-通用知识树/2.07详情页-编辑态-学习资源.png');
        }

        // 3.0 发布确认弹窗
        const publishBtn = await page.locator('button:has-text("发布")').first();
        if (await publishBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await publishBtn.click();
          await wait(1000);
          console.log('  📸 3.0发布确认弹窗.png');
          await page.screenshot({ path: path.join(dir1, '3.0发布确认弹窗.png') });
          results.success.push('1-通用知识树/3.0发布确认弹窗.png');
          await closeAllModals(page);
        }
      }
    }

    // ========================================
    // 2-教材体系知识树
    // ========================================
    console.log('\n📁 2-教材体系知识树');
    const dir2 = path.join(OUTPUT_BASE, '2-教材体系知识树');
    ensureDir(dir2);

    await page.goto(`${BASE_URL}/knowledge-system`, { waitUntil: 'networkidle' });
    await wait(1000);

    const textbookTab = await page.locator('button:has-text("教材体系知识树")').first();
    if (await textbookTab.isVisible()) {
      await textbookTab.click();
      await wait(2000);

      console.log('  📸 1.3首页-有数据.png');
      await page.screenshot({ path: path.join(dir2, '1.3首页-有数据.png') });
      results.success.push('2-教材体系知识树/1.3首页-有数据.png');

      // 进入详情页
      const enterTextbook = await page.locator('button:has-text("进入管理")').first();
      if (await enterTextbook.isVisible({ timeout: 2000 }).catch(() => false)) {
        await enterTextbook.click();
        await wait(2000);

        console.log('  📸 2.00详情页-非编辑态.png');
        await page.screenshot({ path: path.join(dir2, '2.00详情页-非编辑态.png') });
        results.success.push('2-教材体系知识树/2.00详情页-非编辑态.png');
      }
    }

    // ========================================
    // 3-策略广场
    // ========================================
    console.log('\n📁 3-策略广场');
    const dir3 = path.join(OUTPUT_BASE, '3-策略广场');
    ensureDir(dir3);

    await page.goto(`${BASE_URL}/adaptive-strategy`, { waitUntil: 'networkidle' });
    await wait(2000);

    console.log('  📸 1.0策略广场首页.png');
    await page.screenshot({ path: path.join(dir3, '1.0策略广场首页.png') });
    results.success.push('3-策略广场/1.0策略广场首页.png');

    // ========================================
    // 4-学情诊断
    // ========================================
    console.log('\n📁 4-学情诊断');
    const dir4 = path.join(OUTPUT_BASE, '4-学情诊断');
    ensureDir(dir4);

    await page.goto(`${BASE_URL}/adaptive-strategy/strategy/diagnosis`, { waitUntil: 'networkidle' });
    await wait(2000);

    console.log('  📸 1.0首页.png');
    await page.screenshot({ path: path.join(dir4, '1.0首页.png') });
    results.success.push('4-学情诊断/1.0首页.png');

    // 点击新增策略
    const addStrategyBtn = await page.locator('button:has-text("新增策略")').first();
    if (await addStrategyBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addStrategyBtn.click();
      await wait(1000);
      console.log('  📸 1.2首页-新增策略.png');
      await page.screenshot({ path: path.join(dir4, '1.2首页-新增策略.png') });
      results.success.push('4-学情诊断/1.2首页-新增策略.png');
      await closeAllModals(page);
    }

    // ========================================
    // 5-掌握程度划分
    // ========================================
    console.log('\n📁 5-掌握程度划分');
    const dir5 = path.join(OUTPUT_BASE, '5-掌握程度划分');
    ensureDir(dir5);

    await page.goto(`${BASE_URL}/adaptive-strategy/strategy/mastery`, { waitUntil: 'networkidle' });
    await wait(2000);

    console.log('  📸 1.2详情页-非编辑态.png');
    await page.screenshot({ path: path.join(dir5, '1.2详情页-非编辑态.png') });
    results.success.push('5-掌握程度划分/1.2详情页-非编辑态.png');

    // 进入编辑态
    const masteryEditBtn = await page.locator('button:has-text("编辑")').first();
    if (await masteryEditBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await masteryEditBtn.click();
      await wait(1500);
      console.log('  📸 1.5详情页-编辑态.png');
      await page.screenshot({ path: path.join(dir5, '1.5详情页-编辑态.png') });
      results.success.push('5-掌握程度划分/1.5详情页-编辑态.png');
    }

  } catch (error) {
    console.error('\n❌ 截图过程中出错:', error.message);
  } finally {
    await browser.close();
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 截图完成统计');
  console.log('='.repeat(50));
  console.log(`✅ 成功: ${results.success.length} 张`);
  results.success.forEach(f => console.log(`   - ${f}`));
}

takeScreenshots();
