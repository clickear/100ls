import qiniu from 'qiniu';
import * as path from 'node:path';
import 'dotenv/config';

/**
 * Generic Interface for Storage Providers
 */
export interface StorageProvider {
  uploadFile(localPath: string, key: string): Promise<string>;
}

/**
 * Local File System Provider (Default)
 */
export class LocalProvider implements StorageProvider {
  async uploadFile(localPath: string, key: string): Promise<string> {
    // For local, we assume the file is already in the data/videos directory
    // and served via /media static route.
    const videoId = key.split('/')[0];
    const filename = key.split('/')[1];
    return `/media/${videoId}/${filename}`;
  }
}

/**
 * Qiniu Cloud Provider
 */
export class QiniuProvider implements StorageProvider {
  private bucket: string;
  private domain: string;
  private mac: qiniu.auth.digest.Mac;
  private config: qiniu.conf.Config;

  constructor() {
    const ak = process.env.STORAGE_QINIU_AK || '';
    const sk = process.env.STORAGE_QINIU_SK || '';
    this.bucket = process.env.STORAGE_QINIU_BUCKET || '';
    this.domain = process.env.STORAGE_QINIU_DOMAIN || '';

    if (!ak || !sk || !this.bucket || !this.domain) {
      throw new Error('❌ Qiniu configuration is incomplete. Check your .env file.');
    }

    this.mac = new qiniu.auth.digest.Mac(ak, sk);
    this.config = new qiniu.conf.Config();
    // Use specific zone if needed, e.g., qiniu.zone.Zone_z0
  }

  async uploadFile(localPath: string, key: string): Promise<string> {
    const putPolicy = new qiniu.rs.PutPolicy({
      scope: `${this.bucket}:${key}`,
    });
    const uploadToken = putPolicy.uploadToken(this.mac);
    const formUploader = new qiniu.form_up.FormUploader(this.config);
    const putExtra = new qiniu.form_up.PutExtra();

    return new Promise((resolve, reject) => {
      formUploader.putFile(uploadToken, key, localPath, putExtra, (respErr, respBody, respInfo) => {
        if (respErr) {
          reject(respErr);
        } else if (respInfo.statusCode === 200) {
          // Construct absolute URL
          const url = `${this.domain.replace(/\/$/, '')}/${key}`;
          console.log(`✅ Uploaded to Qiniu: ${url}`);
          resolve(url);
        } else {
          reject(new Error(`Qiniu Upload Error: ${respInfo.statusCode} - ${JSON.stringify(respBody)}`));
        }
      });
    });
  }
}

/**
 * Factory to get the configured storage provider
 */
export function getStorageProvider(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER || 'local';
  if (provider === 'qiniu') {
    return new QiniuProvider();
  }
  return new LocalProvider();
}
