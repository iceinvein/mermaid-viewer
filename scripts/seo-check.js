#!/usr/bin/env node

/**
 * Simple SEO validation script to check our improvements
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '..', 'public');
const indexPath = path.join(__dirname, '..', 'index.html');

console.log('🔍 SEO Check for Mermaid Viewer\n');

// Check if index.html exists and has proper meta tags
function checkIndexHTML() {
  console.log('📄 Checking index.html...');
  
  if (!fs.existsSync(indexPath)) {
    console.log('❌ index.html not found');
    return false;
  }

  const content = fs.readFileSync(indexPath, 'utf8');
  
  const checks = [
    { name: 'Title tag', regex: /<title>.*Mermaid.*Diagram.*Editor.*<\/title>/, required: true },
    { name: 'Meta description', regex: /<meta\s+name="description"\s+content=".*Mermaid.*diagram.*"/, required: true },
    { name: 'Meta keywords', regex: /<meta\s+name="keywords"/, required: true },
    { name: 'Open Graph title', regex: /<meta\s+property="og:title"/, required: true },
    { name: 'Open Graph description', regex: /<meta\s+property="og:description"/, required: true },
    { name: 'Open Graph image', regex: /<meta\s+property="og:image"/, required: true },
    { name: 'Twitter Card', regex: /<meta\s+property="twitter:card"/, required: true },
    { name: 'Canonical URL', regex: /<link\s+rel="canonical"/, required: true },
    { name: 'Structured data', regex: /<script\s+type="application\/ld\+json">/, required: true },
    { name: 'Viewport meta', regex: /<meta\s+name="viewport"/, required: true },
    { name: 'Theme color', regex: /<meta\s+name="theme-color"/, required: false },
    { name: 'Web manifest', regex: /<link\s+rel="manifest"/, required: true }
  ];

  let passed = 0;
  let total = checks.filter(c => c.required).length;

  checks.forEach(check => {
    const found = check.regex.test(content);
    const status = found ? '✅' : (check.required ? '❌' : '⚠️');
    console.log(`  ${status} ${check.name}`);
    if (found && check.required) passed++;
  });

  console.log(`\n  Score: ${passed}/${total} required checks passed\n`);
  return passed === total;
}

// Check if required SEO files exist
function checkSEOFiles() {
  console.log('📁 Checking SEO files...');
  
  const files = [
    { name: 'robots.txt', path: path.join(publicDir, 'robots.txt'), required: true },
    { name: 'sitemap.xml', path: path.join(publicDir, 'sitemap.xml'), required: true },
    { name: 'site.webmanifest', path: path.join(publicDir, 'site.webmanifest'), required: true },
    { name: 'og-image.png', path: path.join(publicDir, 'og-image.png'), required: false },
    { name: 'apple-touch-icon.png', path: path.join(publicDir, 'apple-touch-icon.png'), required: false },
    { name: 'favicon-32x32.png', path: path.join(publicDir, 'favicon-32x32.png'), required: false },
    { name: 'favicon-16x16.png', path: path.join(publicDir, 'favicon-16x16.png'), required: false }
  ];

  let passed = 0;
  let total = files.filter(f => f.required).length;

  files.forEach(file => {
    const exists = fs.existsSync(file.path);
    const status = exists ? '✅' : (file.required ? '❌' : '⚠️');
    console.log(`  ${status} ${file.name}`);
    if (exists && file.required) passed++;
  });

  console.log(`\n  Score: ${passed}/${total} required files exist\n`);
  return passed === total;
}

// Check robots.txt content
function checkRobotsTxt() {
  console.log('🤖 Checking robots.txt content...');
  
  const robotsPath = path.join(publicDir, 'robots.txt');
  if (!fs.existsSync(robotsPath)) {
    console.log('  ❌ robots.txt not found');
    return false;
  }

  const content = fs.readFileSync(robotsPath, 'utf8');
  const hasUserAgent = content.includes('User-agent:');
  const hasSitemap = content.includes('Sitemap:');
  const allowsAll = content.includes('Allow: /');

  console.log(`  ${hasUserAgent ? '✅' : '❌'} Has User-agent directive`);
  console.log(`  ${hasSitemap ? '✅' : '❌'} Has Sitemap reference`);
  console.log(`  ${allowsAll ? '✅' : '❌'} Allows crawling`);
  
  return hasUserAgent && hasSitemap && allowsAll;
}

// Main check
function runSEOCheck() {
  const htmlCheck = checkIndexHTML();
  const filesCheck = checkSEOFiles();
  const robotsCheck = checkRobotsTxt();

  console.log('📊 SEO Summary:');
  console.log(`  HTML Meta Tags: ${htmlCheck ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  SEO Files: ${filesCheck ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Robots.txt: ${robotsCheck ? '✅ PASS' : '❌ FAIL'}`);

  if (htmlCheck && filesCheck && robotsCheck) {
    console.log('\n🎉 All core SEO checks passed!');
    console.log('\n📝 Next steps:');
    console.log('  1. Generate proper favicon files');
    console.log('  2. Create og-image.png (1200x630)');
    console.log('  3. Update canonical URL for production domain');
    console.log('  4. Test with Google Search Console');
    console.log('  5. Test social sharing on Twitter/Facebook');
  } else {
    console.log('\n⚠️  Some SEO checks failed. Please review the issues above.');
  }
}

runSEOCheck();
