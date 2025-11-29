/**
 * TabBar 图标生成脚本
 * 使用 Node.js 和 canvas 库生成图标
 * 
 * 安装依赖：
 * npm install canvas
 * 
 * 运行：
 * node create-icons.js
 */

const fs = require('fs');
const path = require('path');

// 检查是否安装了canvas库
let Canvas;
try {
  Canvas = require('canvas');
} catch (e) {
  console.log('未安装canvas库，请运行: npm install canvas');
  console.log('或者使用 generate-icons.html 在浏览器中生成图标');
  process.exit(1);
}

// 图标配置
const icons = [
  { name: 'home', type: 'home', color: '#999999' },
  { name: 'home-active', type: 'home', color: '#FF7A45' },
  { name: 'record', type: 'record', color: '#999999' },
  { name: 'record-active', type: 'record', color: '#FF7A45' },
  { name: 'statistics', type: 'statistics', color: '#999999' },
  { name: 'statistics-active', type: 'statistics', color: '#FF7A45' },
  { name: 'user', type: 'user', color: '#999999' },
  { name: 'user-active', type: 'user', color: '#FF7A45' }
];

// 创建画布并绘制图标
function createIcon(iconConfig) {
  const { name, type, color } = iconConfig;
  const size = 81;
  const canvas = Canvas.createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // 设置透明背景
  ctx.clearRect(0, 0, size, size);
  
  // 设置样式
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  const centerX = size / 2;
  const centerY = size / 2;
  
  // 根据类型绘制图标
  switch(type) {
    case 'home':
      // 房子图标
      ctx.beginPath();
      // 屋顶
      ctx.moveTo(centerX, 15);
      ctx.lineTo(25, 30);
      ctx.lineTo(56, 30);
      ctx.closePath();
      ctx.stroke();
      // 房子主体
      ctx.strokeRect(28, 30, 25, 25);
      // 门
      ctx.fillRect(38, 45, 8, 10);
      break;
      
    case 'record':
      // 列表图标
      ctx.beginPath();
      // 列表项
      ctx.moveTo(20, 25);
      ctx.lineTo(61, 25);
      ctx.moveTo(20, 40.5);
      ctx.lineTo(61, 40.5);
      ctx.moveTo(20, 56);
      ctx.lineTo(61, 56);
      // 圆点
      ctx.arc(28, 25, 3, 0, Math.PI * 2);
      ctx.arc(28, 40.5, 3, 0, Math.PI * 2);
      ctx.arc(28, 56, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
      
    case 'statistics':
      // 图表图标
      ctx.beginPath();
      // 坐标轴
      ctx.moveTo(20, 60);
      ctx.lineTo(20, 20);
      ctx.lineTo(61, 20);
      ctx.stroke();
      // 柱状图
      ctx.fillRect(25, 50, 8, 10);
      ctx.fillRect(36, 40, 8, 20);
      ctx.fillRect(47, 30, 8, 30);
      ctx.fillRect(58, 35, 8, 25);
      break;
      
    case 'user':
      // 用户图标
      ctx.beginPath();
      // 头部
      ctx.arc(centerX, 28, 10, 0, Math.PI * 2);
      ctx.stroke();
      // 身体
      ctx.arc(centerX, 28, 18, 0, Math.PI, true);
      ctx.stroke();
      break;
  }
  
  // 保存为PNG
  const buffer = canvas.toBuffer('image/png');
  const filePath = path.join(__dirname, `${name}.png`);
  fs.writeFileSync(filePath, buffer);
  console.log(`✓ 已创建: ${name}.png`);
}

// 生成所有图标
console.log('开始生成TabBar图标...\n');
icons.forEach(createIcon);
console.log('\n所有图标已生成完成！');
console.log('图标文件保存在: miniprogram/images/tabbar/');

