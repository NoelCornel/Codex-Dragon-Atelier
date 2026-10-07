# Codex Dynamic Skin Manager 1.6.2 运行时资源补丁

问题：Windows 管理器 EXE 的嵌入清单和运行时提取映射未包含 11 个实际需要的资源。即使 ZIP 带有这些文件，从 EXE 提取的 payload 仍会缺失模块或主题校验资源。

`dynamic-skin-manager-payload.patch` 修改：

- `windows/app/CodexDreamSkin.Manager/RuntimeProvisioner.cs`
- `windows/app/CodexDreamSkin.Manager/CodexDreamSkin.Manager.csproj`
- `windows/tests/manager-payload-completeness.test.mjs`

基线：CCDawn/Codex-Dynamic-Skin 提交 `64543b70bbfcfce5c7113aef8f23ac17926d80a9`。在该基线上先运行 `git apply --check`，再应用补丁。项目升级后需要重新检查差异。测试及二进制限制见 `docs/VALIDATION.md`。

本文件是便于向上游提交的修复交付；没有声称上游已接受，也未附带重编译 EXE。
