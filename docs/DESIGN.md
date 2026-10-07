# 配色、舞台与适配

低亮度炭灰 / 雾灰底、低饱和紫强调、少量旧金装饰。保持原生字体和字号，正文与次要文字按 4.5:1 配色检查，焦点色按 3:1。参考 Material 3 表面与文字职责：https://m3.material.io/styles/color/the-color-system 。

DSH Maid Atelier 的参考颗粒度是聊天区域内的底层舞台，不是桌面浮窗：主聊天节点已有定位，不新增它的 z-index 或 isolation；人物舞台作为第一个子节点，绝对定位、z-index:0、contain:strict、inert、pointer-events:none。后续静态原生子节点只补 position:relative，不提升层级，原生弹层保留自身层级。嵌套聊天画布透明，实际消息表面采用 94% 背景混合以保护阅读。

Q 版显示 fywdy 原图集的两个静态姿态。正常立绘使用 ZipZipPipe 原图与 ApprenTice 已有另一姿态，imagegen 仅移除背景，按透明成品的各自宽高比显示。左右按聊天主区域尺寸缩放，正常立绘一大一小；活跃会话缩小、降低不透明度。聊天区域宽度小于 700px 或高度不大于 420px 时隐藏，侧面工作面板占位也会触发退让，不只检查整个窗口。

computed color-scheme 是原生明暗信号，旧 electron-dark/light 类只作为回退。适配器选择可见原生节点，避免新版缓存旧路由误判。缺少节点或主聊天节点为 position:static 时降级关闭，不修改未知布局。

只修改本项目拥有的属性；dispose 恢复原属性、取消待执行帧、释放 ResizeObserver/MutationObserver 和媒体监听。背景静态无动画解码，模拟空闲检查验证不会因自己的 DOM 变动形成持续重绘。

窗口级开屏播放器与页面内主题是不同层。取消播放器强制缩放 Codex 只解决几何干预，不能作为历史置顶遮挡已修复的证据。故障现场必须用原生 HWND 快照取证。
