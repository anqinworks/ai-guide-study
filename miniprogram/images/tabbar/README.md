# TabBar 图标说明

## 图标规格要求

微信小程序 tabBar 图标需要满足以下要求：
- **格式**：PNG
- **尺寸**：81px × 81px（推荐）
- **颜色模式**：RGB
- **背景**：透明或白色
- **文件大小**：建议小于 40KB

## 图标文件列表

需要以下8个图标文件：

### 首页图标
- `home.png` - 未选中状态（灰色 #999999）
- `home-active.png` - 选中状态（橙色 #FF7A45）

### 答题记录图标
- `record.png` - 未选中状态（灰色 #999999）
- `record-active.png` - 选中状态（橙色 #FF7A45）

### 统计图标
- `statistics.png` - 未选中状态（灰色 #999999）
- `statistics-active.png` - 选中状态（橙色 #FF7A45）

### 我的图标
- `user.png` - 未选中状态（灰色 #999999）
- `user-active.png` - 选中状态（橙色 #FF7A45）

## 图标设计建议

### 设计风格
- 简洁明了，符合应用整体风格
- 使用线性图标或填充图标
- 保持图标风格一致

### 图标主题
- **首页**：房子、主页、首页图标
- **答题记录**：列表、记录本、文档图标
- **统计**：图表、数据、统计图标
- **我的**：用户、个人、设置图标

## 免费图标资源

### 推荐网站
1. **IconFont** (https://www.iconfont.cn/) - 阿里巴巴图标库
2. **Icons8** (https://icons8.com/) - 免费图标库
3. **Flaticon** (https://www.flaticon.com/) - 免费图标库
4. **Material Icons** (https://fonts.google.com/icons) - Google Material图标

### 使用建议
1. 搜索对应的图标关键词
2. 下载PNG格式，81px × 81px尺寸
3. 使用图片编辑工具调整颜色：
   - 未选中：灰色 (#999999)
   - 选中：橙色 (#FF7A45)

## 图标制作工具

### 在线工具
- **Canva** (https://www.canva.com/) - 在线设计工具
- **Figma** (https://www.figma.com/) - 专业设计工具

### 本地工具
- **Photoshop** - 专业图片编辑
- **GIMP** - 免费图片编辑工具
- **Sketch** - Mac设计工具

## 快速开始

1. 从推荐网站下载图标
2. 调整尺寸为 81px × 81px
3. 调整颜色：
   - 未选中图标：灰色 (#999999)
   - 选中图标：橙色 (#FF7A45)
4. 保存为PNG格式
5. 放置到 `miniprogram/images/tabbar/` 目录
6. 在 `app.json` 中配置图标路径

## 注意事项

- 确保图标文件存在且路径正确
- 图标文件名必须与 `app.json` 中的配置一致
- 建议使用透明背景的PNG图标
- 图标应该清晰，避免过于复杂的细节
- 保持所有图标风格统一

