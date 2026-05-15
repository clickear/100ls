# 📦 存储与媒体管理 (Storage & Media)

100LS 采用多驱动存储设计，允许用户根据部署环境选择最合适的存储方案。

## 1. 存储驱动类型

### 🏠 本地存储 (Local Storage) - 默认
- **原理**: 视频和图片保存在 `backend/data/videos` 目录下，由后端通过 `/media` 接口提供静态服务。
- **优点**: 隐私性强，无需网络配置，适合本地单机学习。
- **缺点**: 无法用于纯静态部署（如 GitHub Pages），大文件占用本地磁盘空间。

### ☁️ 云端存储 (Qiniu OSS)
- **原理**: 导入视频时，系统会自动将 MP4 和封面图上传至七牛云存储，数据库中仅存储公网 URL。
- **优点**: 配合 CDN 加速加载极快，支持 GitHub Pages 等 Serverless 环境。
- **缺点**: 需要配置云服务凭证，可能会产生少量的流量费用。

---

## 2. 七牛云配置指南

如果您希望使用云存储，请按照以下步骤操作：

### 步骤 A：获取凭证
1. 登录 [七牛云控制台](https://portal.qiniu.com/)。
2. 在“密钥管理”中获取 `AccessKey (AK)` 和 `SecretKey (SK)`。
3. 创建一个“对象存储 (Kodo)”空间，获取 `Bucket` 名称。
4. 绑定一个域名或使用测试域名 `Domain`。

### 步骤 B：修改环境配置
编辑 `backend/.env` 文件：

```env
# 启用七牛云驱动
STORAGE_PROVIDER=qiniu

# 填入您的凭证
STORAGE_QINIU_AK=您的AccessKey
STORAGE_QINIU_SK=您的SecretKey
STORAGE_QINIU_BUCKET=您的空间名称
STORAGE_QINIU_DOMAIN=http://您的域名
```

---

## 3. 常见问题 (FAQ)

**Q: 开启云存储后，本地还会留存文件吗？**  
A: 会的。系统会先在本地下载并处理（Whisper 识别等），成功上传云端后，本地文件可作为备份保留，也可以手动清理。

**Q: 我可以从本地模式切换到云端模式吗？**  
A: 可以。修改配置后，新导入的视频将存储在云端，旧视频依然会通过本地路径读取。
