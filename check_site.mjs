import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

console.log('Navigating to site...');
await page.goto('https://filtreai.vercel.app/', { waitUntil: 'networkidle', timeout: 90000 });

// Wait a moment for React to render
await page.waitForTimeout(3000);

const title = await page.title();
console.log('Page title:', title);

const bodyText = await page.evaluate(() => document.body.innerText);
console.log('\n--- FULL PAGE TEXT ---');
console.log(bodyText.substring(0, 3000));

// Check for login form
const hasPasswordInput = await page.$('input[type="password"]');
console.log('\nHas password input:', !!hasPasswordInput);

const hasLoginForm = await page.$('form');
console.log('Has form:', !!hasLoginForm);

// Check for specific Turkish text
const hasBulkNotif = bodyText.includes('Toplu Bildirim');
console.log('Has "Toplu Bildirim" text:', hasBulkNotif);

const hasLogin = bodyText.toLowerCase().includes('giriş') || bodyText.toLowerCase().includes('login') || bodyText.toLowerCase().includes('şifre') || bodyText.toLowerCase().includes('password');
console.log('Has login-related text:', hasLogin);

// Take screenshot
await page.screenshot({ path: 'check_site_screenshot.png', fullPage: true });
console.log('\nScreenshot saved to check_site_screenshot.png');

await browser.close();
