# 🌟 Golden Majestic 100LS AI 学习助手

> **AI 驱动的极速英语精听与影子跟读工具**

这是一个专门为 100LS (Listen & Speak) 学习法设计的专业辅助系统。它通过 OpenAI Whisper 技术实现精准的视频转字幕与切片，结合极致华丽的 Golden Majestic UI 交互，让英语精听练习从枯燥变得极具沉浸感。

---

## ✨ 核心特性

### 🎥 AI 智能导入
- **多源支持**：支持 YouTube 链接直接导入及本地视频上传。
- **高精度识别**：利用 Whisper 模型实现语义级断句，自动生成中英双语对齐字幕。
- **模式识别**：自动提取台词中的核心句型 (Patterns) 并存入句型本。

### 🎙️ Shadowing Pro (影子跟读大师)
- **智能暂停**：每句播完自动暂停，预留 1.5 倍时长的练习空间。
- **自动恢复**：练习时间结束自动跳转下一句，真正实现“解放双手”的跟读体验。
- **状态反馈**：动态的“正在等待跟读”呼吸提示，增加交互仪式感。

### ⌨️ 极客操控 (Power User Mode)
- **全快捷键支持**：无需鼠标，通过空格、方向键、R/A/B/S/L 键掌控全局。
- **HUD 实时反馈**：所有快捷键操作均有金色 HUD 动画提示。
- **专业级播放器**：支持 AB 循环、单句循环、0.5x - 1.5x 倍速调节。

### 🏆 游戏化学习系统
- **五大阶段 (Stages)**：自动根据学习进度调整字幕模式（从双语到纯英再到无字幕）。
- **XP 经验值**：每一次跟读、标记重点、完成循环都会获得即时 XP 反馈。
- **句型掌握度**：通过大数据分析你在不同视频中遇到相同句型的频次。

---

## 🛠️ 技术架构

- **Frontend**: Vite + React + TypeScript + CSS Modules (Majestic Theme)
- **Backend**: Node.js + Express + SQLite (WAL Mode)
- **AI Core**: OpenAI Whisper + FFmpeg (Audio processing)
- **Database**: 极简高性能 SQLite 架构，支持大规模台词存储

---

## ⌨️ 快捷键指南

| 按键 | 动作 |
| :--- | :--- |
| **Space** | 播放 / 暂停 (影子模式下跳转至下一句) |
| **ArrowRight (→)** | 跳转下一句 |
| **ArrowLeft (←)** | 跳转上一句 |
| **ArrowUp (↑)** | 音量 +10% |
| **ArrowDown (↓)** | 音量 -10% |
| **R** | 本句重播 |
| **A / B** | 设置 A-B 循环起点/终点 |
| **S** | 开启/关闭 影子模式 (Shadowing Mode) |
| **L** | 开启/关闭 本句循环 (Sentence Loop) |

---

## 📝 更新日志 (Changelog)

### v1.2.0 - 2026-05-15 (当前版本)
- **[Feature]** 推出 **Shadowing Pro** 模式，支持自动暂停与智能恢复。
- **[Feature]** 增加 **极客快捷键系统** 与 **HUD 视觉反馈** 提示。
- **[Optimization]** 重构数据库架构，移除冗余字段，极大提升了加载速度。
- **[Bugfix]** 修复了进度条悬浮窗在视频播放时的闪烁问题。
- **[Bugfix]** 解决了影子模式下空格键“原地踏步”的逻辑 Bug。

### v1.1.0 - 2026-05-14
- **[Feature]** 引入 **Golden Majestic** 2.0 视觉系统，全面升级磨砂玻璃质感。
- **[Feature]** 视频导入增加 SSE (Server-Sent Events) 实时进度条。
- **[Refactor]** 后端 API 适配 Linux 生产环境部署，增加环境变量支持。

### v1.0.0 - 2026-05-13
- **[Core]** 100LS 核心播放器上线，支持基础循环与重点句标记。
- **[Core]** Whisper 解析服务集成。

---

## 🚀 快速开始

### 1. 环境自动一键配置 (推荐)
本项目提供了一个自动化的设置脚本，可自动检查/安装 `ffmpeg`, `yt-dlp` (Mac 用户)，初始化 `.env` 并安装所有依赖。

```bash
# 在项目根目录下运行
npm run setup
```

### 2. 启动项目
环境配置完成后，可以使用一个命令同时启动前端和后端：

```bash
npm run dev
```

---

## 🛠️ 技术架构

*Designed with ❤️ by Antigravity*
