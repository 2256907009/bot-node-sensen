import { GetWsParam, SessionEvents, SessionRecord, WsObjRequestOptions } from '@src/types/websocket-types';
import { Ws } from '@src/client/websocket/websocket';
import { EventEmitter } from 'ws';
import resty from 'resty-client';
import { addAuthorization, addAuthorizationWithAccessToken } from '@src/utils/utils';
import { BotLogger } from '@src/utils/logger';
import { getTokenManager } from '@src/utils/token-manager';

export default class Session {
  config: GetWsParam;
  heartbeatInterval!: number;
  ws!: Ws;
  event!: EventEmitter;
  sessionRecord: SessionRecord | undefined;

  constructor(config: GetWsParam, event: EventEmitter, sessionRecord?: SessionRecord) {
    this.config = config;
    this.event = event;
    // 如果会话记录存在的话，继续透传
    if (sessionRecord) {
      this.sessionRecord = sessionRecord;
    }
    this.createSession();
  }

  // 新建会话
  async createSession() {
    this.ws = new Ws(this.config, this.event, this.sessionRecord || undefined);
    // 拿到 ws地址等信息
    const reqOptions = WsObjRequestOptions(this.config.sandbox as boolean);

    try {
      // 判断使用哪种鉴权方式
      if (this.config.appSecret) {
        // 新版AccessToken鉴权
        const tokenManager = getTokenManager();
        if (!tokenManager) {
          throw new Error('TokenManager未初始化');
        }
        const accessToken = await tokenManager.getToken();
        addAuthorizationWithAccessToken(reqOptions.headers, accessToken);
      } else if (this.config.token) {
        // 旧版固定Token鉴权（已弃用）
        addAuthorization(reqOptions.headers, this.config.appID, this.config.token);
      } else {
        throw new Error('请提供appSecret（推荐）或token进行鉴权');
      }

      const r = await resty.create(reqOptions).get(reqOptions.url as string, {});
      const wsData = r.data;
      if (!wsData) throw new Error('获取ws连接信息异常');
      this.ws.createWebsocket(wsData);
    } catch (e) {
      BotLogger.info('[ERROR] createSession: ', e);
      this.event.emit(SessionEvents.EVENT_WS, {
        eventType: SessionEvents.DISCONNECT,
        eventMsg: this.sessionRecord,
      });
    }
  }

  // 关闭会话
  closeSession() {
    this.ws.closeWs();
  }
}
