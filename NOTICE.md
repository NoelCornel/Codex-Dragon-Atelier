# 署名、许可与来源边界

## 本项目

Codex Dragon Atelier 原创代码、配色与集成：NoelCornel，2026，MIT。角色图像不属于该 MIT 许可。

## GPT 白发龙娘

- 原角色设计：**ZipZipPipe**（Pixiv 用户 18604994）。第一方来源：《AI娘化》，https://www.pixiv.net/artworks/148186519 。作者取用说明为「作为保存用，方便所有人取用，需要标注作者，不可商用。」
- 该帖关于 DeepSeek 娘的 CC BY-NC-SA 4.0 说明，不能自动套用于 GPT 龙娘。GPT 原设的说明没有完整列出所有衍生创作、再授权情形，本项目不声称取得额外独占授权。
- 本项目使用 **fywdy / chatgpt-chibi-pets** 已公开的白发龙娘 Q 版素材，保持文件字节不变，仅在界面中缩放、镜像和调节显示亮度。上游说明该素材由生成式图像工具产出并经人工筛选、拼接与修复；不是本项目重新绘制的角色。
- 上游美术许可：**CC BY-NC 4.0**。完整文本见 `LICENSES/Artwork-CC-BY-NC-4.0.txt`；保留其非官方声明 `LICENSES/Upstream-Pets-NOTICE.md`。来源固定到提交 `d5bbb27c79e5c08e8b8ab44d4023cd35a67418e2`，每个图像的路径、Git blob 与 SHA256 见 `assets/SOURCES.json`。
- 上游许可不扩大原设权利，不是 OpenAI 品牌或商标许可。角色整体使用遵守署名、非商业条件。权利人可通过本仓库 Issues 提出素材问题。

## DSH 构图灵感

双姿态、输入区两侧陪伴式布局参考 Small-tailqwq 的 DSH Maid Atelier：https://github.com/Small-tailqwq/dsh-deep-whale/tree/main/maid-atelier 。没有复制该项目源码或打包其美术。

该项目鲸娘署名链：上善（鲸娘原型，Pixiv 用户 62155430）→ ZipZipPipe（DeepSeek 女仆角色设计，Pixiv 用户 18604994）→ Small-tailqwq（Maid Atelier 集成）。其当前项目将 MIT 代码与 CC BY-NC-SA 4.0 美术分开；该美术许可不适用于本项目的 GPT 素材。

## 上游管理器修复

附带补丁针对 https://github.com/CCDawn/Codex-Dynamic-Skin ，Copyright (c) 2026 Codex Dream Skin Studio contributors，MIT。原许可保留于 `LICENSES/Dynamic-Skin-MIT.txt`。补丁只有文件打包映射、项目配置及回归检查，不包含官方 Codex 客户端或管理器二进制。

## 官方能力与实验性边界

Codex 官方文档支持原生明暗配色、字体设置与主题分享：https://learn.chatgpt.com/docs/reference/settings 。完整角色场景通过本机 CDP 注入实现，是本项目的实验性扩展，没有找到官方对该扩展的明确支持声明；不将其描述为官方主题插件。

本项目与 OpenAI 无关联、授权、赞助或背书。ChatGPT、Codex 及其他名称和商标归各自所有者所有。
