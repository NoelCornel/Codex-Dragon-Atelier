# Codex Dragon Atelier · 龙娘工坊

克制的明暗双主题，同一位 GPT 白发龙娘的双姿态作为聊天背景。灵感来自 DSH Maid Atelier 的底层舞台与双角色构图；这是独立的非官方主题项目。

**v0.1.0-beta.2 本地候选版 · Windows Store Codex 26.1002.6548.0 实机验证。** 当前公开 Release 仍为 v0.1.0-beta.1；本分支的背景版尚未发布。原生配色通过官方导入，人物通过可恢复的本机 CDP 装饰。

| Q 版背景 | 正常立绘背景 |
|---|---|
| ![Q 版深色实机匿名预览](docs/images/background-q-dark.png) | ![立绘深色实机匿名预览](docs/images/background-portrait-dark.png) |
| ![Q 版浅色实机匿名预览](docs/images/background-q-light.png) | ![立绘浅色实机匿名预览](docs/images/background-portrait-light.png) |

Q 版素材：fywdy，原设 ZipZipPipe。立绘左侧：ZipZipPipe，右侧：ApprenTice；透明背景处理：本项目 imagegen。完整来源与各自许可见 [NOTICE](NOTICE.md)。

## 本地安装与选择

1. 需要 Node.js 22+ 和 Microsoft Store Codex。解压 Windows 包到长期目录；本地构建使用 `node scripts/build.mjs`。
2. 在「设置 → 外观」先复制、保存自己的浅色和深色主题分享码。将 `dist/native-dark.txt`、`dist/native-light.txt` 分别导入对应主题。
3. 双击「启动Q版背景.cmd」或「启动立绘背景.cmd」。旧「启动龙娘工坊.cmd」默认 Q 版。切换版本会核对身份、结束原有主题观察进程，再启动所选版本。

启动器直接启动官方客户端，默认端口 9445，仅连接 127.0.0.1；可能需要在独立配置的窗口重新登录。普通已打开的 Codex 窗口不会自动获得人物背景。端口被其他程序占用时停止，可用 `powershell -File scripts/Launch.ps1 -Port 9446 -Edition portrait` 指定空闲端口。

## 体验与恢复

- 静态人物放在聊天主区域第一子节点、z-index:0，正文、输入区及原生菜单保留在前景；人物不可点击、不会生成桌面置顶覆盖窗。
- Q 版采用原始图集两个不同静态姿态。立绘版使用两张现成正常比例图，一大一小；只做透明背景处理，不绑定模型名称。
- 会话页人物退让；聊天区域宽度小于 700px 或高度不大于 420px 时隐藏。设置页和系统高对比度模式不显示人物。
- 保留原生明暗切换、字体、输入区尺寸及红绿语义颜色。所有人物均为静态，减少动态效果模式同样适用。
- 双击「恢复装饰.cmd」结束本项目观察进程并移除本项目样式和人物。原生配色保留；恢复颜色需导入先前保存的分享码。
- 「记录窗口遮挡.cmd」及「解除开屏遮挡.cmd」用于独立的开屏覆盖问题，具体行为见 [窗口取证](docs/WINDOW_RECOVERY.md)。这些工具不会安装常驻监控。

主题不修改 WindowsApps、官方 app.asar、模型配置或额度挂件设置，不发送消息。不要同时启用其他全窗口样式注入器。

## 开发与兼容性

```sh
node scripts/build.mjs
node --test tests/palette.test.mjs
python tests/browser-regression.py
node scripts/package.mjs
```

模拟回归需要 Python Playwright 和 Chromium。实际客户端与模拟页面的检查分开记录，见 [验证记录](docs/VALIDATION.md)。构建产物在 `dist/`；包使用文件白名单，不含本机证据、账号配置或聊天内容。

新版 Codex 保留不可见旧路由，适配器仅选择可见节点。缺失锚点或未来客户端采用不支持的主区域定位时关闭装饰。兼容版本在 `src/adapter.json`；其他版本、平台及跨更新迁移尚未验证。

## 分支、补丁与授权

独立仓库：`main` 为首版公开基线，`theme/dragon-atelier` 为首版主题分支；当前本地背景改造在 `fix/background-stage-handoff`，未推送新 Release。

另附 Dynamic Skin Manager 1.6.2 的 [运行时资源打包修复补丁](patches/README.md)，未重编译管理器 EXE，未声称上游合入。

原创代码 MIT；Q 版素材 CC BY-NC 4.0；ApprenTice 改编立绘及其透明衍生版本 CC BY-NC-SA 4.0；ZipZipPipe 的 GPT 原设图按第一方署名、非商业取用说明保留权利，不能套用其 DeepSeek 角色协议。**代码的 MIT 不覆盖图片或原设权利。**

构图灵感：Small-tailqwq / DSH Maid Atelier。没有打包 DSH 鲸娘图片。项目未获 OpenAI 官方授权、赞助或背书。
