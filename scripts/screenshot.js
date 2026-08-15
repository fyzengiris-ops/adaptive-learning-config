const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function takeScreenshot() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // 创建输出目录
  const outputDir = path.join(__dirname, '产品文档/6-html/1-通用知识树');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    // 访问通用知识树页面
    console.log('正在访问页面: http://localhost:5000/knowledge-system');
    await page.goto('http://localhost:5000/knowledge-system', { waitUntil: 'networkidle' });
    
    // 等待页面加载
    await page.waitForTimeout(2000);
    
    // 截图1: 首页-有数据（默认状态）
    console.log('正在截图: 1.3首页-有数据.png');
    await page.screenshot({ 
      path: path.join(outputDir, '1.3首页-有数据.png'),
      fullPage: false 
    });
    console.log('✓ 截图完成: 1.3首页-有数据.png');

    // 点击新增学科按钮，打开弹窗
    console.log('正在打开新增学科弹窗...');
    const addButton = await page.locator('button:has-text("新增学科")').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(500);
      
      // 截图2: 新增学科弹窗
      console.log('正在截图: 1.2首页-新增学科弹窗.png');
      await page.screenshot({ 
        path: path.join(outputDir, '1.2首页-新增学科弹窗.png'),
        fullPage: false 
      });
      console.log('✓ 截图完成: 1.2首页-新增学科弹窗.png');
    }

    console.log('\n所有截图完成！');
    console.log(`输出目录: ${outputDir}`);
    
  } catch (error) {
    console.error('截图失败:', error.message);
  } finally {
    await browser.close();
  }
}

takeScreenshot();
