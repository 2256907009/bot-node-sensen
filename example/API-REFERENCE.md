# QQ频道机器人 SDK API 参考文档

## 📦 快速开始

```javascript
import { createOpenAPI, createWebsocket } from 'qq-guild-bot';

const config = {
  appID: '你的AppID',
  appSecret: '你的AppSecret',  // 新版鉴权（推荐）
  intents: ['PUBLIC_GUILD_MESSAGES'],
  sandbox: true,
};

const client = createOpenAPI(config);
const ws = createWebsocket(config);
```

---

## 📡 WebSocket 事件

### 可用的 intents（事件订阅）

| Intent | 说明 | 权限 |
|--------|------|------|
| `GUILDS` | 频道创建/更新/删除，子频道创建/更新/删除 | 公域 |
| `GUILD_MEMBERS` | 成员加入/更新/离开 | 公域 |
| `GUILD_MESSAGES` | 频道消息（不需要@） | **私域** |
| `GUILD_MESSAGE_REACTIONS` | 表情表态 | 公域 |
| `DIRECT_MESSAGE` | 私信消息 | 公域 |
| `INTERACTION` | 互动事件（按钮点击等） | 公域 |
| `PUBLIC_GUILD_MESSAGES` | @机器人的消息 | 公域 |
| `MESSAGE_AUDIT` | 消息审核结果 | 公域 |
| `FORUMS_EVENT` | 论坛事件 | **私域** |
| `AUDIO_ACTION` | 音频事件 | 公域 |

### 事件监听示例

```javascript
// 机器人就绪
ws.on('READY', (data) => {
  console.log('机器人上线:', data.msg.user.username);
});

// 公域消息（@机器人）
ws.on('PUBLIC_GUILD_MESSAGES', async (data) => {
  const { msg, eventId } = data;
  console.log('收到消息:', msg.content);
});

// 私域消息
ws.on('GUILD_MESSAGES', async (data) => {
  console.log('私域消息:', data.msg.content);
});

// 私信
ws.on('DIRECT_MESSAGE', async (data) => {
  console.log('私信:', data.msg.content);
});

// 表情表态
ws.on('GUILD_MESSAGE_REACTIONS', (data) => {
  // eventType: MESSAGE_REACTION_ADD / MESSAGE_REACTION_REMOVE
  console.log('表情事件:', data.eventType);
});

// 互动事件
ws.on('INTERACTION', async (data) => {
  console.log('互动:', data.msg);
});

// 频道事件
ws.on('GUILDS', (data) => {
  // eventType: GUILD_CREATE / GUILD_UPDATE / GUILD_DELETE
  //            CHANNEL_CREATE / CHANNEL_UPDATE / CHANNEL_DELETE
  console.log('频道事件:', data.eventType);
});

// 成员事件
ws.on('GUILD_MEMBERS', (data) => {
  // eventType: GUILD_MEMBER_ADD / GUILD_MEMBER_UPDATE / GUILD_MEMBER_REMOVE
  console.log('成员事件:', data.eventType, data.msg.user);
});

// 错误事件
ws.on('ERROR', (data) => {
  console.error('错误:', data);
});
```

---

## 📤 消息API

### 发送消息

```javascript
// 基础文本消息
await client.messageApi.postMessage(channelId, {
  content: '你好！',
  msg_id: messageId, // 被动回复必填
});

// 带图片的消息
await client.messageApi.postMessage(channelId, {
  content: '看图片',
  image: 'https://example.com/image.png',
  msg_id: messageId,
});

// @用户
await client.messageApi.postMessage(channelId, {
  content: `<@${userId}> 你好！`,
  msg_id: messageId,
});

// @全体成员（需要权限）
await client.messageApi.postMessage(channelId, {
  content: '@everyone 重要通知！',
  msg_id: messageId,
});
```

### Embed 卡片消息

```javascript
await client.messageApi.postMessage(channelId, {
  embed: {
    title: '标题',
    prompt: '消息提示',
    thumbnail: {
      url: 'https://example.com/thumb.png',
    },
    fields: [
      { name: '字段1', value: '值1' },
      { name: '字段2', value: '值2' },
    ],
  },
  msg_id: messageId,
});
```

### Markdown 消息

```javascript
await client.messageApi.postMessage(channelId, {
  markdown: {
    content: '# 标题\n**粗体** *斜体* ~~删除线~~\n- 列表项1\n- 列表项2',
  },
  msg_id: messageId,
});

// 使用模板
await client.messageApi.postMessage(channelId, {
  markdown: {
    template_id: 123,  // 模板ID
    params: [
      { key: 'title', values: ['标题内容'] },
      { key: 'content', values: ['正文内容'] },
    ],
  },
  msg_id: messageId,
});
```

### Ark 模板消息

```javascript
// 链接分享卡片 (ark 23)
await client.messageApi.postMessage(channelId, {
  ark: {
    template_id: 23,
    kv: [
      { key: '#DESC#', value: '描述文字' },
      { key: '#PROMPT#', value: '消息提示' },
      { key: '#TITLE#', value: '标题' },
      { key: '#METADESC#', value: '详细描述' },
      { key: '#IMG#', value: 'https://example.com/image.png' },
      { key: '#LINK#', value: 'https://example.com' },
    ],
  },
  msg_id: messageId,
});

// 大图卡片 (ark 24)
await client.messageApi.postMessage(channelId, {
  ark: {
    template_id: 24,
    kv: [
      { key: '#TITLE#', value: '标题' },
      { key: '#METADESC#', value: '描述' },
      { key: '#IMG#', value: 'https://example.com/big-image.png' },
      { key: '#LINK#', value: 'https://example.com' },
    ],
  },
  msg_id: messageId,
});
```

### 撤回消息

```javascript
await client.messageApi.deleteMessage(channelId, messageId, hideTip);
// hideTip: true 隐藏撤回提示
```

### 获取消息

```javascript
const message = await client.messageApi.message(channelId, messageId);
console.log(message.data);
```

---

## 💬 私信API

### 创建私信会话

```javascript
const dm = await client.directMessageApi.createDirectMessage({
  recipient_id: userId,      // 接收者ID
  source_guild_id: guildId,  // 来源频道ID
});

const dmGuildId = dm.data.guild_id;
```

### 发送私信

```javascript
await client.directMessageApi.postDirectMessage(dmGuildId, {
  content: '这是一条私信',
  msg_id: messageId, // 被动回复时需要
});
```

---

## 😊 表情表态API

### 添加表情表态

```javascript
await client.reactionApi.postReaction(channelId, messageId, {
  type: 1,  // 1: 系统表情, 2: emoji
  id: '4',  // 表情ID
});
```

### 删除表情表态

```javascript
await client.reactionApi.deleteReaction(channelId, messageId, {
  type: 1,
  id: '4',
});
```

### 系统表情ID参考

| ID | 表情 | ID | 表情 |
|----|----|----|----|
| 4 | 得意 | 5 | 流泪 |
| 8 | 睡 | 14 | 微笑 |
| 21 | 可爱 | 78 | 抓狂 |
| 96 | 冷汗 | 179 | 鄙视 |

---

## 🏠 频道API

### 获取频道详情

```javascript
const guild = await client.guildApi.guild(guildId);
console.log(guild.data);
```

### 获取子频道列表

```javascript
const channels = await client.channelApi.channels(guildId);
console.log(channels.data);
```

### 获取子频道详情

```javascript
const channel = await client.channelApi.channel(channelId);
console.log(channel.data);
```

### 创建子频道

```javascript
const newChannel = await client.channelApi.postChannel(guildId, {
  name: '新子频道',
  type: 0,       // 0: 文字, 2: 语音, 4: 分组
  parent_id: parentChannelId,
});
```

---

## 👥 成员API

### 获取成员列表

```javascript
const members = await client.memberApi.members(guildId, {
  after: '0',  // 分页参数
  limit: 100,
});
console.log(members.data);
```

### 获取成员详情

```javascript
const member = await client.memberApi.member(guildId, userId);
console.log(member.data);
```

### 删除成员（踢出）

```javascript
await client.memberApi.deleteMember(guildId, userId, {
  add_blacklist: false, // 是否加入黑名单
});
```

---

## 🎭 身份组API

### 获取身份组列表

```javascript
const roles = await client.roleApi.roles(guildId);
console.log(roles.data);
```

### 创建身份组

```javascript
const role = await client.roleApi.postRole(guildId, {
  name: '新身份组',
  color: 0xFF0000, // 红色
  hoist: 1,        // 是否单独显示
});
```

### 添加成员到身份组

```javascript
await client.roleApi.memberAddRole(guildId, roleId, userId, channelId);
```

### 移除成员身份组

```javascript
await client.roleApi.memberDeleteRole(guildId, roleId, userId, channelId);
```

---

## 🔇 禁言API

### 频道全员禁言

```javascript
await client.muteApi.muteMember(guildId, {
  mute_end_timestamp: String(Date.now() + 60000), // 禁言结束时间
  mute_seconds: '60', // 或直接指定秒数
});
```

### 指定成员禁言

```javascript
await client.muteApi.muteMember(guildId, userId, {
  mute_seconds: '60',
});
```

### 解除禁言

```javascript
await client.muteApi.muteMember(guildId, userId, {
  mute_seconds: '0',
});
```

---

## 📢 公告API

### 设置频道公告

```javascript
await client.announceApi.postGuildAnnounce(guildId, {
  channel_id: channelId,
  message_id: messageId,
});
```

### 删除频道公告

```javascript
await client.announceApi.deleteGuildAnnounce(guildId, messageId);
```

---

## 📌 精华消息API

### 设置精华消息

```javascript
await client.pinsMessageApi.putPinsMessage(channelId, messageId);
```

### 删除精华消息

```javascript
await client.pinsMessageApi.deletePinsMessage(channelId, messageId);
```

### 获取精华消息列表

```javascript
const pins = await client.pinsMessageApi.pinsMessage(channelId);
console.log(pins.data);
```

---

## 🔘 互动API

### 响应互动事件

```javascript
ws.on('INTERACTION', async (data) => {
  await client.interactionApi.putInteraction(data.msg.id, {
    code: 0, // 0: 成功
  });
});
```

---

## 🔑 鉴权说明

### 新版鉴权（AccessToken，推荐）

```javascript
const config = {
  appID: '你的AppID',
  appSecret: '你的AppSecret',
  sandbox: true,
};
```

- SDK 会自动获取和刷新 AccessToken
- AccessToken 有效期 7200 秒（2小时）
- SDK 会提前 5 分钟自动刷新

### 旧版鉴权（已弃用）

```javascript
// ⚠️ 已被QQ官方禁用，请勿使用
const config = {
  appID: '你的AppID',
  token: '你的Token',
};
```

---

## ❗ 注意事项

1. **被动消息**：收到用户消息后 5 秒内必须回复，需要 `msg_id` 参数
2. **主动消息**：有频率限制，日活跃用户数决定配额
3. **私域权限**：`GUILD_MESSAGES` 和 `FORUMS_EVENT` 需要申请私域机器人
4. **沙箱环境**：设置 `sandbox: true` 可在测试频道调试
5. **图片限制**：图片大小不超过 4MB，建议使用 HTTPS 链接

---

## 📚 更多资源

- [官方文档](https://bot.q.qq.com/wiki/)
- [API v2 文档](https://bot.q.qq.com/wiki/develop/api-v2/)
- [GitHub 仓库](https://github.com/tencent-connect/bot-node-sdk)
