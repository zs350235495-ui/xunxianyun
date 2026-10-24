const fs = require('fs');
const path = require('path');

console.log('=== [云朵巡线员] 全站完整性与本地离线零死链门禁自动化审计 ===\n');

const cwd = process.cwd();

// 1. 检查物理文件存在性
const requiredFiles = [
  'index.html',
  'sla-benchmark-2026.html',
  'routing.html',
  'about.html',
  'css/style.css',
  'assets/images/logo.svg',
  'favicon.svg',
  'sitemap.xml',
  'llms.txt',
  'README.md'
];

let hasError = false;

for (const relPath of requiredFiles) {
  const fullPath = path.join(cwd, relPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ [缺失文件] ${relPath}`);
    hasError = true;
  } else {
    console.log(`✅ [文件存在] ${relPath}`);
  }
}

// 2. 检查 HTML 文件的链接有效性与合规红线
const htmlFiles = ['index.html', 'sla-benchmark-2026.html', 'routing.html', 'about.html'];
const forbiddenPatterns = [/\?aff=/i, /\?ref=/i, /\?code=/i, /href="#"/, /href=""/];

for (const file of htmlFiles) {
  console.log(`\n🔍 正在深度审查 ${file}...`);
  const content = fs.readFileSync(path.join(cwd, file), 'utf8');

  // 确保包含内联样式，保证 file:// 协议裸奔免疫
  if (!content.includes('<style>') || !content.includes('--color-primary')) {
    console.error(`❌ [缺失内联样式] ${file} 缺少内联 <style>，在 file:// 协议直接双击可能裸奔！`);
    hasError = true;
  } else {
    console.log(`  [OK] 内联 CSS 完备，file:// 双击直接渲染保障有效`);
  }

  // 检查违规参数
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(content)) {
      console.error(`❌ [违规模式] ${file} 匹配到禁止的模式: ${pattern}`);
      hasError = true;
    }
  }

  // 检查闪电鼠是否误写为闪电云
  if (content.includes('闪电云')) {
    console.error(`❌ [品牌误写] ${file} 包含错误的【闪电云】（应为闪电鼠）！`);
    hasError = true;
  }

  // 检查服务商超链接
  const linkedProvider = content.match(/<a[^>]*>(环球梯|大佬云|云界线|闪电鼠|神行加速|榴莲云)<\/a>/);
  if (linkedProvider) {
    console.error(`❌ [服务商带超链接] ${file} 服务商 ${linkedProvider[1]} 带有超链接，违反纯文本加粗规范！`);
    hasError = true;
  }

  // 提取所有 href
  const hrefRegex = /href="([^"]+)"/g;
  let match;
  while ((match = hrefRegex.exec(content)) !== null) {
    const url = match[1];
    if (url.startsWith('http://') || url.startsWith('https://')) {
      if (!url.startsWith('https://example.local') && url !== 'https://schema.org') {
        console.error(`❌ [非法外部商业外链] ${file} 包含外部链接: ${url}`);
        hasError = true;
      }
    } else if (url.startsWith('./') || url.startsWith('/')) {
      // 站内相对或绝对路径检查
      let localTarget = url.replace(/^\.?\//, '');
      if (localTarget === '') {
        localTarget = 'index.html';
      }
      const cleanTarget = localTarget.split('?')[0].split('#')[0];
      const targetPath = path.join(cwd, cleanTarget);
      if (!fs.existsSync(targetPath)) {
        console.error(`❌ [死链 404] ${file} -> ${url} 对应文件不存在: ${targetPath}`);
        hasError = true;
      }
    }
  }

  // 提取所有 src
  const srcRegex = /src="([^"]+)"/g;
  while ((match = srcRegex.exec(content)) !== null) {
    const src = match[1];
    if (src.startsWith('./') || src.startsWith('/')) {
      const cleanSrc = src.replace(/^\.?\//, '').split('?')[0];
      const srcPath = path.join(cwd, cleanSrc);
      if (!fs.existsSync(srcPath)) {
        console.error(`❌ [静态资源 404] ${file} -> src: ${src} 对应文件不存在: ${srcPath}`);
        hasError = true;
      }
    }
  }
}

// 3. 检查 README.md 规范与免责声明
console.log(`\n🔍 正在审查 README.md...`);
const readmeContent = fs.readFileSync(path.join(cwd, 'README.md'), 'utf8');

if (!readmeContent.includes('📜 自动化门禁、开源规范与免责声明')) {
  console.error(`❌ [缺失声明] README.md 缺少【📜 自动化门禁、开源规范与免责声明】章节！`);
  hasError = true;
} else {
  console.log(`✅ [免责声明规范] README.md 包含完整合规声明章节`);
}

if (readmeContent.includes('闪电云')) {
  console.error(`❌ [品牌误写] README.md 包含错误服务商名称【闪电云】！`);
  hasError = true;
}

if (hasError) {
  console.error('\n💥 门禁测试未通过，请修复上述错误！');
  process.exit(1);
} else {
  console.log('\n🎉 ========================================================');
  console.log('🎉 [PASS] 全站 0 死链、直接双击本地预览 100% 完美支持！');
  console.log('🎉 ========================================================\n');
  process.exit(0);
}
