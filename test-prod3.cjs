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
    
    await page.goto('http://localhost:3030', { waitUntil: 'load' });
    
    // Wait for something in the DOM, e.g. the App root
    await page.waitForSelector('.min-h-screen', { timeout: 5000 }).catch(() => {});
    
    const appHtml = await page.evaluate(() => document.getElementById('root').innerHTML);
    console.log('ROOT HTML LENGTH:', appHtml.length);
    console.log('ROOT HTML SAMPLE:', appHtml.substring(0, 300));
    
    await browser.close();
  } catch (err) {
    console.error('Puppeteer error:', err);
  } finally {
    server.close();
    process.exit(0);
  }
});
