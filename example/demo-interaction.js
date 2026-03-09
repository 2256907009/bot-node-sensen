/**
 * QQ频道机器人 - 互动示例代码
 * 
 * 本示例展示了如何使用SDK进行各种消息交互：
 * 1. 接收并回复@消息
 * 2. 发送普通文本消息
 * 3. 发送图片消息
 * 4. 发送Markdown消息
 * 5. 发送Embed消息（卡片）
 * 6. 发送Ark消息（模板消息）
 * 7. 私信互动
 * 8. 表情回应
 */

import { createOpenAPI, createWebsocket } from 'qq-guild-bot';

// =====================================================
// 配置区域
// =====================================================
const config = {
  appID: '你的AppID',
  appSecret: '你的AppSecret',
  intents: [
    'GUILDS',                    // 频道事件
    'GUILD_MEMBERS',             // 成员事件
    'GUILD_MESSAGES',            // 私域消息（需要申请）
    'GUILD_MESSAGE_REACTIONS',   // 表情表态
    'DIRECT_MESSAGE',            // 私信
    'INTERACTION',               // 互动事件
    'PUBLIC_GUILD_MESSAGES',     // 公域消息（@机器人）
  ],
  sandbox: true, // 沙箱环境
};

// 创建客户端
const client = createOpenAPI(config);
const ws = createWebsocket(config);

// =====================================================
// 事件监听
// =====================================================

// 机器人上线
ws.on('READY', (data) => {
  console.log('🤖 机器人已上线！');
  console.log('用户信息:', data.msg.user);
});

// 错误处理
ws.on('ERROR', (data) => {
  console.error('❌ 错误:', data);
});

// =====================================================
// 公域消息处理（@机器人触发）
// =====================================================
ws.on('PUBLIC_GUILD_MESSAGES', async (data) => {
  console.log('📩 收到@消息:', data);
  
  const { msg } = data;
  const channelId = msg.channel_id;
  const messageId = msg.id;
  const content = msg.content || '';
  const author = msg.author;
  
  // 提取用户发送的实际内容（去除@机器人的部分）
  const userMessage = content.replace(/<@!\d+>/g, '').trim();
  
  try {
    // =========== 1. 简单文本回复 ===========
    if (userMessage === '你好' || userMessage === 'hello') {
      await client.messageApi.postMessage(channelId, {
        content: `你好 ${author.username}！我是你的小助手 🎉`,
        msg_id: messageId, // 回复消息ID（必填，用于被动回复）
      });
      return;
    }
    
    // =========== 2. 帮助菜单 ===========
    if (userMessage === '帮助' || userMessage === 'help') {
      await client.messageApi.postMessage(channelId, {
        content: `📖 **可用指令**\n` +
                 `• 你好 - 打招呼\n` +
                 `• 帮助 - 显示此菜单\n` +
                 `• 时间 - 获取当前时间\n` +
                 `• 图片 - 发送图片示例\n` +
                 `• 卡片 - 发送Embed卡片\n` +
                 `• 表情 - 添加表情回应`,
        msg_id: messageId,
      });
      return;
    }
    
    // =========== 3. 获取时间 ===========
    if (userMessage === '时间') {
      const now = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
      await client.messageApi.postMessage(channelId, {
        content: `🕐 当前时间: ${now}`,
        msg_id: messageId,
      });
      return;
    }
    
    // =========== 4. 发送图片 ===========
    if (userMessage === '图片') {
      await client.messageApi.postMessage(channelId, {
        content: '这是一张示例图片 📷',
        image: 'https://via.placeholder.com/300x200.png?text=Hello+Bot',
        msg_id: messageId,
      });
      return;
    }
    
    // =========== 5. Embed卡片消息 ===========
    if (userMessage === '卡片') {
      await client.messageApi.postMessage(channelId, {
        embed: {
          title: '📋 信息卡片',
          prompt: '这是一条卡片消息',
          thumbnail: {
            url: 'https://via.placeholder.com/100x100.png',
          },
          fields: [
            { name: '用户名', value: author.username },
            { name: '用户ID', value: author.id },
            { name: '频道ID', value: channelId },
          ],
        },
        msg_id: messageId,
      });
      return;
    }
    
    // =========== 6. 表情回应 ===========
    if (userMessage === '表情') {
      // 给消息添加表情回应
      await client.reactionApi.postReaction(channelId, messageId, {
        type: 1,    // 1: 系统表情, 2: emoji表情
        id: '4',    // 表情ID，4是"好的"表情
      });
      
      await client.messageApi.postMessage(channelId, {
        content: '已添加表情回应！👍',
        msg_id: messageId,
      });
      return;
    }
    
    // =========== 默认回复 ===========
    await client.messageApi.postMessage(channelId, {
      content: `收到你的消息: "${userMessage}"\n发送"帮助"查看可用指令`,
      msg_id: messageId,
    });
    
  } catch (error) {
    console.error('发送消息失败:', error);
  }
});

// =====================================================
// 私域消息处理（需要私域权限）
// =====================================================
ws.on('GUILD_MESSAGES', async (data) => {
  console.log('📨 收到私域消息:', data);
  // 处理逻辑与公域消息类似
});

// =====================================================
// 私信消息处理
// =====================================================
ws.on('DIRECT_MESSAGE', async (data) => {
  console.log('💬 收到私信:', data);
  
  const { msg } = data;
  const guildId = msg.guild_id; // 私信场景的guild_id
  const content = msg.content || '';
  
  try {
    // 回复私信
    await client.directMessageApi.postDirectMessage(guildId, {
      content: `收到你的私信: "${content}"`,
      msg_id: msg.id,
    });
  } catch (error) {
    console.error('回复私信失败:', error);
  }
});

// =====================================================
// 互动事件（按钮点击等）
// =====================================================
ws.on('INTERACTION', async (data) => {
  console.log('🔘 收到互动事件:', data);
  
  const { msg } = data;
  const interactionId = msg.id;
  
  try {
    // 响应互动（告诉服务端已处理）
    await client.interactionApi.putInteraction(interactionId, {
      code: 0, // 0表示成功
    });
  } catch (error) {
    console.error('响应互动失败:', error);
  }
});

// =====================================================
// 表情表态事件
// =====================================================
ws.on('GUILD_MESSAGE_REACTIONS', (data) => {
  console.log('😊 表情事件:', data);
  // eventType: MESSAGE_REACTION_ADD 或 MESSAGE_REACTION_REMOVE
});

// =====================================================
// 频道/成员事件
// =====================================================
ws.on('GUILDS', (data) => {
  console.log('🏠 频道事件:', data.eventType);
});

ws.on('GUILD_MEMBERS', (data) => {
  console.log('👥 成员事件:', data.eventType, data.msg?.user?.username);
});

// =====================================================
// 主动发送消息示例（不需要触发事件）
// =====================================================

/**
 * 主动发送消息到指定频道
 * 注意：主动消息有频率限制
 */
async function sendMessageToChannel(channelId, content) {
  try {
    const result = await client.messageApi.postMessage(channelId, {
      content: content,
    });
    console.log('主动消息发送成功:', result.data);
    return result;
  } catch (error) {
    console.error('主动消息发送失败:', error);
    throw error;
  }
}

/**
 * 创建私信会话并发送消息
 */
async function sendDirectMessage(userId, guildId, content) {
  try {
    // 1. 创建私信会话
    const dmResult = await client.directMessageApi.createDirectMessage({
      recipient_id: userId,
      source_guild_id: guildId,
    });
    
    const dmGuildId = dmResult.data.guild_id;
    
    // 2. 发送私信
    const result = await client.directMessageApi.postDirectMessage(dmGuildId, {
      content: content,
    });
    
    console.log('私信发送成功:', result.data);
    return result;
  } catch (error) {
    console.error('私信发送失败:', error);
    throw error;
  }
}

// 导出函数供外部调用
export { sendMessageToChannel, sendDirectMessage };

console.log('🚀 机器人启动中...');
