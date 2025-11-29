# UI设计系统规范文档

## 1. 设计原则

### 1.1 核心原则
- **一致性（Consistency）**：保持视觉和交互的一致性，降低用户学习成本
- **清晰性（Clarity）**：信息层次分明，视觉引导明确
- **美观性（Aesthetics）**：符合现代审美，提升用户体验
- **可用性（Usability）**：操作简单直观，反馈及时明确
- **响应式（Responsive）**：适配不同屏幕尺寸，保持良好体验

### 1.2 设计理念
- 以用户为中心，关注学习体验
- 平衡功能性与美观性
- 注重细节，追求完美
- 保持品牌调性的一致性

## 2. 色彩系统

### 2.1 主色调（Primary Colors）
```
主色（Primary）: #FF7A45
  - 用途：主要按钮、重要信息、品牌标识
  - RGB: rgb(255, 122, 69)
  - 使用场景：CTA按钮、进度条、强调文本

主色浅色（Primary Light）: #FFEBE5
  - 用途：背景色、卡片背景
  - RGB: rgb(255, 235, 229)
  - 使用场景：卡片背景、标签背景

主色深色（Primary Dark）: #FF5722
  - 用途：按钮悬停状态、强调元素
  - RGB: rgb(255, 87, 34)
  - 使用场景：按钮hover、深色背景
```

### 2.2 功能色彩（Functional Colors）
```
成功色（Success）: #52C41A
  - 用途：成功提示、正确状态
  - RGB: rgb(82, 196, 26)
  - 使用场景：正确选项、成功提示、完成状态

警告色（Warning）: #FAAD14
  - 用途：警告提示、需要注意
  - RGB: rgb(250, 173, 20)
  - 使用场景：警告信息、待处理状态

错误色（Error）: #FF4D4F
  - 用途：错误提示、失败状态
  - RGB: rgb(255, 77, 79)
  - 使用场景：错误选项、错误提示、删除操作

信息色（Info）: #1890FF
  - 用途：信息提示、一般状态
  - RGB: rgb(24, 144, 255)
  - 使用场景：信息提示、链接、一般按钮
```

### 2.3 中性色彩（Neutral Colors）
```
文本主色（Text Primary）: #333333
  - 用途：主要文本内容
  - RGB: rgb(51, 51, 51)

文本次色（Text Secondary）: #666666
  - 用途：次要文本、辅助信息
  - RGB: rgb(102, 102, 102)

文本辅助色（Text Tertiary）: #8C8C8C
  - 用途：提示文本、占位符
  - RGB: rgb(140, 140, 140)

边框色（Border）: #E8E8E8
  - 用途：边框、分割线
  - RGB: rgb(232, 232, 232)

背景色（Background）: #F8F9FA
  - 用途：页面背景
  - RGB: rgb(248, 249, 250)

卡片背景（Card Background）: #FFFFFF
  - 用途：卡片、容器背景
  - RGB: rgb(255, 255, 255)
```

### 2.4 渐变色彩（Gradient Colors）
```
主色渐变: linear-gradient(135deg, #FF7A45 0%, #FF5722 100%)
  - 用途：主要按钮、重要元素

成功渐变: linear-gradient(90deg, #52C41A 0%, #73D13D 100%)
  - 用途：成功状态、进度条

错误渐变: linear-gradient(90deg, #FF4D4F 0%, #FF7875 100%)
  - 用途：错误状态、警告元素

背景渐变: linear-gradient(135deg, #F8F9FA 0%, #FFFAF0 100%)
  - 用途：页面背景
```

## 3. 字体排版系统

### 3.1 字体族（Font Family）
```
主字体: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif
等宽字体: 'Consolas', 'Monaco', 'Courier New', monospace
```

### 3.2 字号系统（Font Size）
```
超大标题（H1）: 48rpx / 24px
  - 用途：页面主标题
  - 字重：Bold (700)
  - 行高：1.2

大标题（H2）: 40rpx / 20px
  - 用途：区块标题
  - 字重：Bold (700)
  - 行高：1.3

中标题（H3）: 34rpx / 17px
  - 用途：卡片标题、章节标题
  - 字重：SemiBold (600)
  - 行高：1.4

小标题（H4）: 32rpx / 16px
  - 用途：列表项标题
  - 字重：SemiBold (600)
  - 行高：1.5

正文（Body）: 28rpx / 14px
  - 用途：正文内容
  - 字重：Regular (400)
  - 行高：1.6-1.8

小字（Small）: 26rpx / 13px
  - 用途：辅助信息、说明文字
  - 字重：Regular (400)
  - 行高：1.6

极小字（Tiny）: 24rpx / 12px
  - 用途：标签、时间戳
  - 字重：Regular (400)
  - 行高：1.5
```

### 3.3 字重系统（Font Weight）
```
Light: 300
Regular: 400
Medium: 500
SemiBold: 600
Bold: 700
```

### 3.4 行高系统（Line Height）
```
紧凑: 1.2-1.4（标题）
标准: 1.6-1.8（正文）
宽松: 2.0（长文本）
```

## 4. 间距系统（Spacing System）

### 4.1 基础间距单位
```
基础单位: 4rpx / 2px
间距倍数: 4rpx, 8rpx, 12rpx, 16rpx, 20rpx, 24rpx, 32rpx, 40rpx, 48rpx, 64rpx, 80rpx
```

### 4.2 间距使用规范
```
XS (4rpx): 元素内部间距
SM (8rpx): 图标与文字间距
MD (16rpx): 相关元素间距
LG (24rpx): 卡片内元素间距
XL (32rpx): 区块间距
XXL (48rpx): 大区块间距
XXXL (64rpx): 页面区块间距
```

### 4.3 内边距规范（Padding）
```
按钮内边距: 24rpx 48rpx
卡片内边距: 32rpx-40rpx
输入框内边距: 24rpx
列表项内边距: 24rpx-32rpx
```

### 4.4 外边距规范（Margin）
```
页面边距: 32rpx-40rpx
卡片间距: 24rpx-32rpx
区块间距: 48rpx-64rpx
```

## 5. 圆角系统（Border Radius）

```
小圆角（Small）: 8rpx
  - 用途：标签、小按钮

中圆角（Medium）: 12rpx-16rpx
  - 用途：输入框、代码块

大圆角（Large）: 20rpx-24rpx
  - 用途：卡片、大按钮

圆形（Circle）: 50%
  - 用途：头像、图标按钮
```

## 6. 阴影系统（Shadow System）

### 6.1 阴影层级
```
Level 1 (轻微): 0 2rpx 8rpx rgba(0, 0, 0, 0.05)
  - 用途：卡片、输入框

Level 2 (标准): 0 4rpx 16rpx rgba(0, 0, 0, 0.08)
  - 用途：主要卡片、按钮

Level 3 (强调): 0 8rpx 32rpx rgba(0, 0, 0, 0.12)
  - 用途：重要卡片、弹窗

Level 4 (强烈): 0 12rpx 40rpx rgba(0, 0, 0, 0.15)
  - 用途：模态框、重要提示
```

### 6.2 彩色阴影
```
主色阴影: 0 4rpx 12rpx rgba(255, 122, 69, 0.3)
成功阴影: 0 2rpx 8rpx rgba(82, 196, 26, 0.3)
错误阴影: 0 2rpx 8rpx rgba(255, 77, 79, 0.3)
```

## 7. 组件库（Component Library）

### 7.1 按钮（Button）

#### 主要按钮（Primary Button）
```
样式：
  - 背景：主色渐变
  - 文字：白色
  - 内边距：28rpx 48rpx
  - 圆角：16rpx-20rpx
  - 字号：32rpx
  - 字重：600
  - 阴影：Level 2

状态：
  - 默认：主色渐变
  - Hover：加深阴影，轻微上移
  - Active：减少阴影，恢复位置
  - Disabled：灰色，无阴影，不可点击
```

#### 次要按钮（Secondary Button）
```
样式：
  - 背景：白色或浅灰
  - 文字：主色或深灰
  - 边框：2rpx solid 主色或边框色
  - 其他同主要按钮
```

### 7.2 输入框（Input）

```
样式：
  - 背景：白色
  - 边框：2rpx solid #E8E8E8
  - 圆角：16rpx
  - 内边距：24rpx
  - 字号：30rpx
  - 行高：1.5

状态：
  - 默认：浅灰边框
  - Focus：主色边框，主色阴影
  - Error：错误色边框
  - Disabled：灰色背景，浅色文字
```

### 7.3 卡片（Card）

```
样式：
  - 背景：白色
  - 圆角：20rpx-28rpx
  - 内边距：32rpx-40rpx
  - 阴影：Level 2
  - 边框：可选，2rpx solid #E8E8E8

变体：
  - 基础卡片：白色背景
  - 渐变卡片：渐变背景
  - 带边框卡片：有边框线
  - 阴影卡片：增强阴影
```

### 7.4 标签（Tag）

```
样式：
  - 背景：主色浅色或功能色浅色
  - 文字：主色或功能色
  - 内边距：12rpx 24rpx
  - 圆角：20rpx
  - 字号：24rpx
  - 字重：500
```

### 7.5 进度条（Progress Bar）

```
样式：
  - 背景：浅灰色 #F0F0F0
  - 进度：主色或功能色
  - 高度：12rpx
  - 圆角：6rpx
  - 动画：平滑过渡
```

### 7.6 徽章（Badge）

```
样式：
  - 背景：主色或功能色
  - 文字：白色
  - 圆角：50%
  - 字号：24rpx
  - 最小尺寸：40rpx
```

## 8. 交互模式（Interaction Patterns）

### 8.1 动画原则
```
- 持续时间：0.2s-0.6s
- 缓动函数：cubic-bezier(0.4, 0, 0.2, 1)
- 遵循自然运动规律
- 避免过度动画
```

### 8.2 常见动画
```
淡入（Fade In）: opacity 0 → 1
上移淡入（Fade In Up）: opacity 0 → 1, translateY(30rpx) → 0
下移淡入（Fade In Down）: opacity 0 → 1, translateY(-30rpx) → 0
缩放淡入（Scale In）: opacity 0 → 1, scale(0.9) → 1
旋转淡入（Rotate In）: opacity 0 → 1, rotate(-180deg) → 0
```

### 8.3 悬停效果（Hover Effects）
```
- 轻微上移：translateY(-4rpx)
- 阴影增强：Level 2 → Level 3
- 颜色加深：主色 → 主色深色
- 缩放：scale(1.05)
```

### 8.4 点击反馈（Click Feedback）
```
- 轻微下压：translateY(2rpx)
- 阴影减少：Level 2 → Level 1
- 涟漪效果：从点击位置扩散
```

## 9. 响应式设计（Responsive Design）

### 9.1 断点系统
```
小屏（Small）: < 375rpx
中屏（Medium）: 375rpx - 414rpx
大屏（Large）: > 414rpx
```

### 9.2 适配策略
```
- 使用相对单位（rpx）
- 弹性布局（Flexbox）
- 网格布局（Grid）
- 媒体查询（Media Queries）
- 字体缩放
- 间距调整
```

## 10. 图标系统（Icon System）

### 10.1 图标风格
```
- 风格：线性图标，2rpx线宽
- 尺寸：24rpx, 32rpx, 40rpx, 48rpx
- 颜色：跟随文字颜色或功能色
- 对齐：与文字基线对齐
```

### 10.2 常用图标
```
- 导航：首页、我的、统计、记录
- 操作：搜索、设置、分享、收藏
- 状态：成功、错误、警告、信息
- 功能：学习、答题、报告、建议
```

## 11. 页面布局规范（Layout Guidelines）

### 11.1 页面结构
```
Header（头部）
  - 高度：88rpx-120rpx
  - 背景：主色或白色
  - 内容：标题、操作按钮

Content（内容区）
  - 内边距：32rpx-40rpx
  - 背景：页面背景色
  - 最大宽度：750rpx（居中）

Footer（底部）
  - Tab Bar：高度 98rpx
  - 操作栏：高度 120rpx-160rpx
```

### 11.2 内容区域
```
- 卡片间距：24rpx-32rpx
- 区块间距：48rpx-64rpx
- 内容宽度：100%（移动端）
- 最大宽度：750rpx（桌面端）
```

## 12. 可访问性（Accessibility）

### 12.1 颜色对比度
```
- 正文与背景：≥ 4.5:1
- 大文本与背景：≥ 3:1
- 交互元素：≥ 3:1
```

### 12.2 交互元素
```
- 最小点击区域：44rpx × 44rpx
- 清晰的焦点状态
- 明确的错误提示
- 友好的加载状态
```

## 13. 性能优化（Performance）

### 13.1 动画性能
```
- 使用 transform 和 opacity
- 避免触发重排和重绘
- 合理使用 will-change
- 控制动画数量
```

### 13.2 图片优化
```
- 使用合适的图片格式
- 压缩图片大小
- 懒加载非关键图片
- 使用占位符
```

## 14. 设计工具与资源

### 14.1 设计工具
```
- Figma / Sketch（设计稿）
- Adobe XD（原型）
- Principle / Framer（动效）
```

### 14.2 开发工具
```
- 小程序开发者工具
- Chrome DevTools
- 响应式设计测试工具
```

## 15. 设计检查清单（Design Checklist）

### 15.1 视觉检查
- [ ] 色彩使用符合规范
- [ ] 字体大小和字重正确
- [ ] 间距符合系统规范
- [ ] 圆角和阴影一致
- [ ] 图标风格统一

### 15.2 交互检查
- [ ] 所有交互元素有反馈
- [ ] 动画流畅自然
- [ ] 加载状态明确
- [ ] 错误提示友好
- [ ] 操作流程顺畅

### 15.3 响应式检查
- [ ] 小屏适配良好
- [ ] 大屏布局合理
- [ ] 横竖屏切换正常
- [ ] 文字不溢出
- [ ] 图片自适应

### 15.4 可访问性检查
- [ ] 颜色对比度达标
- [ ] 点击区域足够大
- [ ] 焦点状态清晰
- [ ] 错误提示明确
- [ ] 加载状态友好

---

**文档版本**: v1.0  
**最后更新**: 2024年  
**维护者**: 设计团队

