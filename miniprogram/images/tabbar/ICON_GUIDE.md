# TabBar 图标快速添加指南

## 方法一：使用在线图标生成器

### 步骤
1. 访问 https://www.iconfont.cn/ 或 https://icons8.com/
2. 搜索以下关键词：
   - 首页：搜索 "home" 或 "首页"
   - 答题记录：搜索 "list" 或 "记录"
   - 统计：搜索 "chart" 或 "统计"
   - 我的：搜索 "user" 或 "用户"
3. 下载图标（选择PNG格式，81px × 81px）
4. 使用图片编辑工具调整颜色
5. 保存到 `miniprogram/images/tabbar/` 目录

## 方法二：使用Emoji作为图标（临时方案）

如果暂时没有图标文件，可以使用文字模式（当前配置），tabBar会正常显示文字。

## 方法三：创建简单图标

可以使用以下工具快速创建简单图标：
1. 使用在线SVG编辑器创建简单图标
2. 导出为PNG格式
3. 调整尺寸和颜色

## 当前状态

当前tabBar配置为**纯文字模式**，无需图标即可正常工作。如果需要添加图标，请按照上述步骤操作。

## 图标颜色规范

- **未选中颜色**：#999999（灰色）
- **选中颜色**：#FF7A45（橙色）

## 文件命名规范

确保文件名与 `app.json` 中的配置完全一致：
- `home.png` / `home-active.png`
- `record.png` / `record-active.png`
- `statistics.png` / `statistics-active.png`
- `user.png` / `user-active.png`

