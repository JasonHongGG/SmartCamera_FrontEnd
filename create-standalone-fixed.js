const fs = require('fs');
const path = require('path');

function createStandaloneHTML() {
  console.log('🚀 Creating standalone HTML file...');
  
  try {
    // 檢查 build 資料夾
    const buildPath = path.join(__dirname, 'build');
    if (!fs.existsSync(buildPath)) {
      console.error('❌ Build folder not found. Please run "npm run build" first.');
      return;
    }
    
    // 讀取原始 HTML
    const htmlPath = path.join(buildPath, 'index.html');
    let html = fs.readFileSync(htmlPath, 'utf8');
    console.log('✅ Read HTML file');
    
    // 查找 CSS 文件
    const cssDir = path.join(buildPath, 'static', 'css');
    if (fs.existsSync(cssDir)) {
      const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));
      
      for (const cssFile of cssFiles) {
        const cssPath = path.join(cssDir, cssFile);
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        
        // 更精確的替換，處理壓縮的HTML和相對路徑
        const linkPattern1 = `<link href="/static/css/${cssFile}" rel="stylesheet">`;
        const linkPattern2 = `<link href="./static/css/${cssFile}" rel="stylesheet">`;
        
        if (html.includes(linkPattern1)) {
          const styleTag = `<style type="text/css">\n${cssContent}\n</style>`;
          html = html.replace(linkPattern1, styleTag);
          console.log(`✅ Inlined CSS: ${cssFile}`);
        } else if (html.includes(linkPattern2)) {
          const styleTag = `<style type="text/css">\n${cssContent}\n</style>`;
          html = html.replace(linkPattern2, styleTag);
          console.log(`✅ Inlined CSS: ${cssFile}`);
        }
      }
    }
    
    // 查找 JS 文件
    const jsDir = path.join(buildPath, 'static', 'js');
    if (fs.existsSync(jsDir)) {
      const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js') && !f.endsWith('.map'));
      
      for (const jsFile of jsFiles) {
        const jsPath = path.join(jsDir, jsFile);
        const jsContent = fs.readFileSync(jsPath, 'utf8');
        
        // 更精確的替換，處理defer屬性和相對路徑
        const scriptPattern1 = `<script defer="defer" src="/static/js/${jsFile}"></script>`;
        const scriptPattern2 = `<script defer="defer" src="./static/js/${jsFile}"></script>`;
        
        if (html.includes(scriptPattern1)) {
          const inlineScript = `<script type="text/javascript">\n${jsContent}\n</script>`;
          html = html.replace(scriptPattern1, inlineScript);
          console.log(`✅ Inlined JS: ${jsFile}`);
        } else if (html.includes(scriptPattern2)) {
          const inlineScript = `<script type="text/javascript">\n${jsContent}\n</script>`;
          html = html.replace(scriptPattern2, inlineScript);
          console.log(`✅ Inlined JS: ${jsFile}`);
        }
      }
    }
    
    // 移除所有外部資源引用
    html = html.replace(/<link[^>]*rel="manifest"[^>]*>/g, '<!-- manifest removed -->');
    html = html.replace(/<link[^>]*rel="icon"[^>]*>/g, '<!-- favicon removed -->');
    html = html.replace(/<link[^>]*rel="apple-touch-icon"[^>]*>/g, '<!-- apple-touch-icon removed -->');
    
    // 移除任何剩餘的外部 CSS/JS 引用
    html = html.replace(/<link[^>]*href="[^"]*\.css"[^>]*>/g, '<!-- external CSS removed -->');
    html = html.replace(/<script[^>]*src="[^"]*\.js"[^>]*><\/script>/g, '<!-- external JS removed -->');
    
    // 更新標題
    html = html.replace('<title>React App</title>', '<title>Camera Control Interface</title>');
    
    // 確保正確的 DOCTYPE
    html = html.replace(/<!doctype/i, '<!DOCTYPE');
    
    // 保存檔案
    const outputPath = path.join(__dirname, 'camera-control-standalone.html');
    fs.writeFileSync(outputPath, html, 'utf8');
    
    // 檢查檔案大小
    const stats = fs.statSync(outputPath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    
    console.log('\n🎉 SUCCESS!');
    console.log(`📁 File: camera-control-standalone.html`);
    console.log(`📊 Size: ${sizeKB} KB`);
    
    // 驗證內容
    const generatedHtml = fs.readFileSync(outputPath, 'utf8');
    const hasInlineCSS = generatedHtml.includes('<style type="text/css">');
    const hasInlineJS = generatedHtml.includes('<script type="text/javascript">');
    const hasExternalCSS = generatedHtml.includes('href="') && generatedHtml.includes('.css');
    const hasExternalJS = generatedHtml.includes('src="') && generatedHtml.includes('.js');
    
    console.log('\n🔍 Verification:');
    console.log(`✅ Inline CSS: ${hasInlineCSS ? 'YES' : 'NO'}`);
    console.log(`✅ Inline JS: ${hasInlineJS ? 'YES' : 'NO'}`);
    console.log(`❌ External CSS: ${hasExternalCSS ? 'YES (BAD)' : 'NO (GOOD)'}`);
    console.log(`❌ External JS: ${hasExternalJS ? 'YES (BAD)' : 'NO (GOOD)'}`);
    
    if (hasInlineCSS && hasInlineJS && !hasExternalCSS && !hasExternalJS) {
      console.log('\n🚀 Perfect! The file should work standalone.');
    } else {
      console.log('\n⚠️  There might be issues with the generated file.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

createStandaloneHTML();