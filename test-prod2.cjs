const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');

const app = express();
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist/index.html')));

const server = app.listen(3030, async () => {
  console.log('Server running on 3030');
  
  try {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
    page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
    page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));
    
    await page.goto('http://localhost:3030', { waitUntil: 'networkidle0' });
    
    const content = await page.content();
    console.log(content.substring(0, 1000));
    
    const appHtml = await page.evaluate(() => document.getElementById('root').innerHTML);
    console.log('ROOT HTML LENGTH:', appHtml.length);
    console.log('ROOT HTML CONTENT:', appHtml.substring(0, 1000));
    
    await browser.close();
  } catch (err) {
    console.error('Puppeteer error:', err);
  } finally {
    server.close();
    process.exit(0);
  }
});
