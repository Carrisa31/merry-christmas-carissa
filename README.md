# Christmas Memories · 星光圣诞树

Carrisa31 的开源互动圣诞树：金色粒子、红金挂饰、照片相框与摄像头手势。

在线体验：https://carrisa31.github.io/christmas-memory-tree/

## 功能

- 鼠标拖动或触屏旋转；滚轮或双指缩放。
- 星光散开与圣诞树聚合。
- 导入照片并点击相框放大；最多 36 张，单张不超过 15 MB。
- 摄像头手势：张开散开、握拳聚合、左右移动旋转、捏合查看照片。
- 摄像头选择、权限与黑屏提示、加载超时处理。
- 本地合成铃声、沉浸模式、手机和平板布局。

## 使用与隐私

访客无需安装或登录 GPT。请使用支持 WebGL 的现代 Chrome、Edge 或 Safari。

照片仅存于导入时的浏览器 IndexedDB，不上传，也不会提交到公开仓库。清理站点数据会移除照片，请保留原图。

摄像头画面在设备内处理，不使用麦克风。首次使用需要允许相机；应用内浏览器可能限制相机，建议使用系统浏览器。物理遮挡盖和系统隐私开关需要使用者打开。

示例冬日插画由程序绘制，不是用户照片。手势效果取决于光照、镜头位置和设备性能。

## 本地开发

静态 HTML、CSS、JavaScript 项目，无需安装 Node 依赖。克隆后在项目目录执行 `python -m http.server 8080`，再打开 http://localhost:8080 。线上请使用 HTTPS。

## 项目结构

- index.html：界面。
- style.css：响应式布局。
- app.js：粒子、照片、手势及交互。
- vendor/：本地 3D 库、识别组件与模型。
- .github/workflows/deploy.yml：自动发布配置。

## 部署

Settings → Pages 选择 GitHub Actions，修改 main 分支后自动发布。首次流程从带 SHA-256 校验的发布包导入并提交完整源码；之后直接使用本仓库源码，运行中的网站不依赖 ChatGPT 域名。

## 许可

项目自身代码与示例插画采用 MIT 许可证，Copyright (c) 2026 Carrisa31。第三方组件保留原许可：Three.js 为 MIT；MediaPipe 许可见 vendor/MEDIAPIPE-LICENSE.txt 和 vendor/MEDIAPIPE-README.md。

视觉参考用户提供的视频，不保证与拍摄画面逐像素一致。本项目在 AI 辅助下开发。
