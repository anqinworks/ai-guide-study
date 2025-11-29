# 富文本格式支持系统实现文档

## 功能概述

实现了全面的富文本格式支持系统，为答题页面提供专业级排版功能，包括代码语法高亮、数学公式渲染、文本格式化等。

## 已实现功能

### 1. 富文本解析器 (`miniprogram/utils/richTextParser.js`)

#### 支持的格式

**代码语法高亮**
- 支持多种编程语言：JavaScript、Python、Java、C++、C、HTML、CSS、SQL、JSON、XML、Bash等
- 代码块格式：\`\`\`语言\n代码\n\`\`\`
- 行内代码格式：\`代码\`
- 自动关键字高亮（关键字、字符串、注释、数字等）

**数学公式渲染**
- 行内公式：$formula$
- 块级公式：$$formula$$
- 支持LaTeX语法
- 在小程序中显示为格式化文本（可扩展为图片渲染）

**文本格式化**
- 加粗：**text** 或 __text__
- 斜体：*text* 或 _text_
- 有序列表：1. item
- 无序列表：- item 或 * item
- 自动换行处理

#### 核心函数

```javascript
// 主解析函数
parseRichText(text) // 将Markdown/HTML文本转换为小程序rich-text可用的HTML

// 代码高亮
highlightCode(code, language) // 对代码进行语法高亮处理

// LaTeX处理
formatLatexFormula(formula, isBlock) // 格式化LaTeX公式
```

### 2. AI生成引擎增强 (`backend/routes/ai-qa.js`)

#### 新增参数支持

- `learningGoals`: 学习目标
- `knowledgePoints`: 知识点范围
- `questionTypes`: 题型要求

#### 增强的提示词

AI提示词现在包含：
1. **学习目标**：根据用户指定的学习目标生成题目
2. **知识点范围**：重点覆盖指定的知识点
3. **题型要求**：生成指定类型的题目
4. **格式要求**：要求AI使用Markdown格式，支持代码、公式、格式化文本

#### 详细答案解析要求

AI生成的答案解析必须包含：
- 正确答案的详细解释
- 错误选项的错误原因分析
- 相关知识点扩展
- 代码示例（如适用）
- 数学推导过程（如适用）
- 实际应用场景说明

### 3. 答题页面优化 (`miniprogram/pages/answer/`)

#### 布局改进

**视觉层次结构**
- 清晰的区域划分：进度区 → 题目区 → 选项区 → 按钮区
- 使用边框和间距进行逻辑分组
- 标题和标签明确标识各区域

**响应式设计**
- 支持小屏幕设备（< 375rpx）
- 自适应字体大小和间距
- 代码块和公式在小屏幕上的优化显示

**富文本渲染**
- 使用 `rich-text` 组件渲染问题文本
- 使用 `rich-text` 组件渲染选项文本
- 支持代码高亮、公式、格式化文本

#### 样式特性

- 代码块：深色背景（#282c34），等宽字体
- 行内代码：浅灰背景，粉色文字
- LaTeX公式：浅灰背景，斜体显示
- 列表：适当的缩进和间距
- 加粗/斜体：清晰的视觉区分

### 4. 结果页面增强 (`miniprogram/pages/result/`)

#### 布局优化

**答案对比区域**
- 清晰的"你的答案"和"正确答案"对比
- 使用不同背景色区分
- 支持富文本显示

**详细解析区域**
- 独立的解析区域，带图标和标题
- 支持完整的富文本格式
- 学术级深度的解释内容

#### 富文本支持

- 解析答案文本（用户答案和正确答案）
- 解析详细解释（支持代码、公式、格式化）
- 保持格式一致性

### 5. 主题设置页面扩展 (`miniprogram/pages/topic-setting/`)

#### 高级选项

新增可折叠的高级选项区域：
- **学习目标**：描述希望通过题目达到的学习目标
- **知识点范围**：指定需要重点覆盖的知识点
- **题型要求**：指定希望生成的题目类型

#### 用户体验

- 可折叠设计，默认隐藏，不干扰基础操作
- 清晰的标签和提示文字
- 文本域输入，支持多行文本

## 技术实现细节

### 富文本解析流程

1. **输入**：Markdown格式文本
2. **处理**：
   - 检测代码块（```language\ncode\n```）
   - 检测行内代码（`code`）
   - 检测LaTeX公式（$formula$ 或 $$formula$$）
   - 检测格式化文本（**加粗**、*斜体*）
   - 检测列表（- item 或 1. item）
3. **输出**：HTML字符串（小程序rich-text组件可直接使用）

### 代码高亮实现

- 使用正则表达式匹配关键字
- 为不同语法元素添加颜色样式
- 支持多种编程语言的关键字识别
- 字符串、注释、数字等特殊处理

### LaTeX公式处理

- 检测公式标记（$ 或 $$）
- 提取公式内容
- 添加特殊样式类
- 可扩展为服务端图片渲染

### 页面布局系统

**视觉层次**
- 使用卡片设计，清晰的边界
- 使用间距和边框进行分组
- 使用颜色和字体大小区分重要性

**响应式设计**
- 使用媒体查询适配不同屏幕
- 字体大小自适应
- 间距和 padding 自适应

## 使用示例

### 问题文本示例

```markdown
以下JavaScript代码的输出是什么？

\`\`\`javascript
function test() {
  const x = 10;
  console.log(x * 2);
}
test();
\`\`\`

A. 20
B. 10
C. undefined
D. 报错
```

### 答案解析示例

```markdown
**正确答案：A**

**解析：**

1. **代码执行过程**：
   - 函数 `test()` 被调用
   - 在函数内部，`const x = 10` 声明了一个常量
   - `console.log(x * 2)` 输出 `x * 2` 的结果，即 `20`

2. **关键知识点**：
   - `const` 关键字用于声明常量
   - 常量在声明时必须初始化
   - 常量在作用域内不可重新赋值

3. **错误选项分析**：
   - B选项：忽略了乘法运算
   - C选项：`x` 已定义，不会是 `undefined`
   - D选项：代码语法正确，不会报错

4. **扩展知识**：
   - 在JavaScript中，`const` 声明的常量是块级作用域
   - 与 `var` 和 `let` 的区别在于不可重新赋值
```

## 文件清单

### 新增文件
- `miniprogram/utils/richTextParser.js` - 富文本解析器
- `miniprogram/utils/latexRenderer.js` - LaTeX公式渲染器（可扩展）

### 修改文件
- `miniprogram/pages/answer/answer.js` - 添加富文本解析
- `miniprogram/pages/answer/answer.wxml` - 使用rich-text组件
- `miniprogram/pages/answer/answer.wxss` - 优化布局和样式
- `miniprogram/pages/result/result.js` - 添加富文本解析
- `miniprogram/pages/result/result.wxml` - 使用rich-text组件
- `miniprogram/pages/result/result.wxss` - 优化布局和样式
- `miniprogram/pages/topic-setting/topic-setting.js` - 添加高级选项
- `miniprogram/pages/topic-setting/topic-setting.wxml` - 添加高级选项UI
- `miniprogram/pages/topic-setting/topic-setting.wxss` - 添加高级选项样式
- `backend/routes/ai-qa.js` - 增强AI提示词，支持新参数

## 注意事项

### 小程序限制

1. **rich-text组件**：
   - 支持HTML字符串，但不支持所有HTML标签
   - 不支持JavaScript执行
   - 不支持外部样式表

2. **LaTeX公式**：
   - 当前显示为格式化文本
   - 如需完整渲染，需要使用服务端API转换为图片
   - 或使用小程序插件（如MathJax插件）

3. **代码高亮**：
   - 当前使用简化的关键字高亮
   - 完整语法高亮建议使用服务端预处理
   - 或使用highlight.js在服务端处理

### 性能优化

1. **富文本解析**：
   - 解析在客户端进行，避免服务端压力
   - 使用缓存机制减少重复解析

2. **代码高亮**：
   - 使用正则表达式，性能较好
   - 复杂代码块建议服务端预处理

3. **响应式设计**：
   - 使用CSS媒体查询，无需JavaScript
   - 性能开销小

## 后续优化建议

1. **服务端代码高亮**：
   - 使用highlight.js在服务端预处理代码
   - 生成带样式的HTML字符串

2. **LaTeX图片渲染**：
   - 集成MathJax或KaTeX服务
   - 将LaTeX公式转换为图片URL

3. **更多格式支持**：
   - 表格支持
   - 链接支持
   - 图片支持

4. **性能优化**：
   - 富文本解析结果缓存
   - 代码高亮结果缓存
   - 懒加载长文本内容

## 测试建议

1. **格式测试**：
   - 测试各种Markdown格式
   - 测试代码高亮效果
   - 测试LaTeX公式显示

2. **布局测试**：
   - 不同屏幕尺寸测试
   - 长文本显示测试
   - 代码块滚动测试

3. **AI生成测试**：
   - 测试带格式的问题生成
   - 测试详细解析生成
   - 测试高级选项参数

