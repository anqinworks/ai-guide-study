# 快速添加TabBar图标

## 方法一：使用HTML生成器（推荐，最简单）

1. 在浏览器中打开 `generate-icons.html` 文件
2. 点击每个图标下方的"下载"按钮
3. 将下载的PNG文件保存到当前目录（`miniprogram/images/tabbar/`）
4. 完成！图标已配置在 `app.json` 中

## 方法二：使用Node.js脚本

### 前提条件
安装canvas库：
```bash
npm install canvas
```

### 运行脚本
```bash
cd miniprogram/images/tabbar
node create-icons.js
```

## 方法三：手动下载图标

1. 访问以下网站下载图标：
   - IconFont: https://www.iconfont.cn/
   - Icons8: https://icons8.com/
   - Flaticon: https://www.flaticon.com/

2. 搜索关键词：
   - 首页：home, 首页, 主页
   - 答题记录：list, 列表, 记录
   - 统计：chart, 图表, 统计
   - 我的：user, 用户, 个人

3. 下载要求：
   - 格式：PNG
   - 尺寸：81px × 81px
   - 颜色：
     - 未选中：#999999（灰色）
     - 选中：#FF7A45（橙色）

4. 保存文件：
   - `home.png` / `home-active.png`
   - `record.png` / `record-active.png`
   - `statistics.png` / `statistics-active.png`
   - `user.png` / `user-active.png`

## 当前状态

✅ 图标目录已创建：`miniprogram/images/tabbar/`
✅ `app.json` 已配置图标路径
⏳ 等待图标文件添加到目录

添加图标文件后，重新编译小程序即可看到图标效果。

