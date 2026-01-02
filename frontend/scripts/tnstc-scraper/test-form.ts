import { chromium } from 'playwright';

async function testFormFields() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    const TNSTC_URL = 'https://www.tnstc.in/OTRSOnline/';
    
    console.log('🚀 Opening TNSTC website...');
    await page.goto(TNSTC_URL);
    await page.waitForTimeout(2000);

    console.log('\n🔒 Closing popup...');
    // Close popups via multiple methods
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await page.evaluate(() => {
      const popups = document.querySelectorAll('[role="dialog"], [class*="modal"]');
      popups.forEach((p: any) => {
        p.style.display = 'none !important';
      });
    }).catch(() => {});
    await page.waitForTimeout(2000);

    console.log('\n🔍 Checking for form fields...');
    const fromField = page.locator('input[placeholder="From Place"]');
    const toField = page.locator('input[placeholder="To Place"]');
    
    console.log(`  From field visible: ${await fromField.isVisible().catch(() => false)}`);
    console.log(`  To field visible: ${await toField.isVisible().catch(() => false)}`);

    const inputCount = await page.locator('input').count();
    console.log(`  Total input fields: ${inputCount}`);

    // List all input placeholders
    const inputs = await page.locator('input').all();
    console.log('\n📝 All input fields:');
    for (let i = 0; i < Math.min(5, inputs.length); i++) {
      const placeholder = await inputs[i].getAttribute('placeholder');
      const type = await inputs[i].getAttribute('type');
      console.log(`  ${i + 1}. [${type}] ${placeholder || '(no placeholder)'}`);
    }

    console.log('\n⌨️  Testing form input...');
    if (await fromField.count() > 0) {
      console.log('  Clicking from field...');
      await fromField.focus();
      await page.waitForTimeout(500);
      
      console.log('  Typing "CHENNAI"...');
      await fromField.type('CHENNAI', { delay: 100 });
      await page.waitForTimeout(1000);

      const value = await fromField.inputValue();
      console.log(`  Field value: "${value}"`);

      console.log('\n📋 Checking for dropdown...');
      const options = await page.locator('li, [role="option"]').count();
      console.log(`  Found ${options} potential dropdown items`);
    } else {
      console.log('  ❌ From field not found!');
    }

    console.log('\n✅ Test complete');
  } catch (e) {
    console.error('❌ Error:', e);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testFormFields().catch(console.error);
