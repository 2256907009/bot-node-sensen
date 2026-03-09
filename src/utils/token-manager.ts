import resty from 'resty-client';
import { BotLogger } from './logger';

// AccessToken响应结构
interface AccessTokenResponse {
  access_token: string;
  expires_in: number; // 过期时间（秒）
}

// TokenManager配置
export interface TokenConfig {
  appID: string;
  appSecret: string;
}

// 获取AccessToken的API地址
const ACCESS_TOKEN_URL = 'https://bots.qq.com/app/getAppAccessToken';

// POST请求body类型
interface GetAccessTokenBody {
  appId: string;
  clientSecret: string;
}

/**
 * TokenManager - 管理AccessToken的获取和自动刷新
 */
export class TokenManager {
  private appID: string;
  private appSecret: string;
  private accessToken = '';
  private expiresAt = 0;
  private refreshTimer: NodeJS.Timeout | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;

  constructor(config: TokenConfig) {
    this.appID = config.appID;
    this.appSecret = config.appSecret;
  }

  /**
   * 停止自动刷新
   */
  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * 获取AppID
   */
  getAppID(): string {
    return this.appID;
  }

  /**
   * 获取当前有效的AccessToken
   * 如果token即将过期或已过期，会自动刷新
   */
  async getToken(): Promise<string> {
    // 如果正在刷新，等待刷新完成
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    // 检查token是否有效（提前5分钟刷新）
    const now = Date.now();
    const bufferTime = 5 * 60 * 1000; // 5分钟缓冲

    if (!this.accessToken || now >= this.expiresAt - bufferTime) {
      return this.refreshToken();
    }

    return this.accessToken;
  }

  /**
   * 刷新AccessToken
   */
  async refreshToken(): Promise<string> {
    // 防止并发刷新
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.doRefreshToken();

    try {
      const token = await this.refreshPromise;
      return token;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * 执行token刷新
   */
  private async doRefreshToken(): Promise<string> {
    try {
      BotLogger.info('[TokenManager] 正在获取AccessToken...');

      const requestBody: GetAccessTokenBody = {
        appId: this.appID,
        clientSecret: this.appSecret,
      };

      const client = resty.create({
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await client.request<AccessTokenResponse>(ACCESS_TOKEN_URL, {
        method: 'POST',
        data: requestBody,
      });

      if (!response.data?.access_token) {
        throw new Error('获取AccessToken失败：响应中没有access_token');
      }

      this.accessToken = response.data.access_token;
      // expires_in 是秒数，转换为毫秒时间戳
      this.expiresAt = Date.now() + response.data.expires_in * 1000;

      BotLogger.info(`[TokenManager] AccessToken获取成功，有效期: ${response.data.expires_in}秒`);

      // 设置自动刷新定时器（提前5分钟刷新）
      this.scheduleRefresh(response.data.expires_in);

      return this.accessToken;
    } catch (error: any) {
      BotLogger.info('[TokenManager] 获取AccessToken失败:', error?.message || error);
      throw error;
    }
  }

  /**
   * 设置自动刷新定时器
   */
  private scheduleRefresh(expiresIn: number) {
    // 清除之前的定时器
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // 提前5分钟刷新
    const refreshDelay = Math.max((expiresIn - 300) * 1000, 60000); // 至少1分钟后刷新

    this.refreshTimer = setTimeout(() => {
      this.refreshToken().catch((err) => {
        BotLogger.info('[TokenManager] 自动刷新AccessToken失败:', err);
      });
    }, refreshDelay);

    BotLogger.info(`[TokenManager] 已设置自动刷新，将在 ${Math.floor(refreshDelay / 1000)} 秒后刷新`);
  }
}

// 全局TokenManager实例
let globalTokenManager: TokenManager | null = null;

/**
 * 初始化全局TokenManager
 */
export function initTokenManager(config: TokenConfig): TokenManager {
  globalTokenManager = new TokenManager(config);
  return globalTokenManager;
}

/**
 * 获取全局TokenManager实例
 */
export function getTokenManager(): TokenManager | null {
  return globalTokenManager;
}
