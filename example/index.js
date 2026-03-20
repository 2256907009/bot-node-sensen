// 以下仅为用法示意，详情请参照文档：https://bot.q.qq.com/wiki/develop/nodesdk/
import 'dotenv/config'; // 自动加载 .env 文件到 process.env
import { createOpenAPI, createWebsocket } from 'qq-guild-bot';

const appID = process.env.AppID;
const appSecret = process.env.AppSecret;

if (!appID || !appSecret) {
  console.error('❌ 请在 example/.env 文件中配置 AppID 和 AppSecret');
  process.exit(1);
}

// =====================================================
// 新版鉴权配置（推荐）- 使用 appSecret 获取 AccessToken
// =====================================================
//现在实现全新写小说全球online
const testConfigWs = {
  appID,
  appSecret, // 使用appSecret进行OAuth2鉴权
  intents: [
    'GUILDS',                    // 需要调用 频道基础事件
    'GUILD_MEMBERS',             // 成员事件
    'GUILD_MESSAGES',         // ⚠️ 私域消息（需要申请私域权限，公域机器人请勿开启） 需要调用频道消息事件
    'GUILD_MESSAGE_REACTIONS',   // 表情表态
    'DIRECT_MESSAGE',            // 私信
    'INTERACTION',               // 需要调用 互动事件 
    'PUBLIC_GUILD_MESSAGES',     // 公域消息（@机器人）✅ 这是你需要的
  ],
  sandbox: true, // 设置为沙箱环境，就可以在测试群进行测试
};



const client = createOpenAPI(testConfigWs);

const ws = createWebsocket(testConfigWs);
ws.on('READY', (wsdata) => {
  console.log('机器人已上线！');
  console.log('[READY] 事件接收 :', wsdata);
});

ws.on('ERROR', (data) => {
  console.log('[ERROR] 事件接收 :', data);
});
ws.on('GUILDS', (data) => {
  console.log('[GUILDS] 事件接收 :', data);
});
ws.on('GUILD_MEMBERS', async (data) => {
  console.log('[GUILD_MEMBERS] 事件接收 :', data);
  const {msg} = data;
  const channelId = msg.channel_id;
  const messageId = msg.id;
  const content = msg.content;
  const author = msg.author;

  const userMessage = content.replace(/<@!\d+>/g,'').trim();
  console.log("=====================")
  console.log(userMessage);
  console.log("=====================")
  try{
    if (userMessage === '你好' || userMessage === 'hello'){
      await client.messageApi.postMessage(channelId,{
        content: `你好 ${author.username}！我是你的小助手 🎉`,
        msg_id:messageId
      })
      return;
    }

    
  }catch(error){
    console.error('发送消息失败:', error);
  }



});
ws.on('GUILD_MESSAGES', (data) => {
  console.log('[GUILD_MESSAGES] 事件接收 :', data);
});
ws.on('GUILD_MESSAGE_REACTIONS', (data) => {
  console.log('[GUILD_MESSAGE_REACTIONS] 事件接收 :', data);
});
ws.on('DIRECT_MESSAGE', async (data) => {
  console.log('[DIRECT_MESSAGE] 事件接收 :', data);
  const {msg} = data;
  const guildId = msg.guild_id;  // ⚠️ 私信使用 guild_id，不是 channel_id
  const messageId = msg.id;
  const content = msg.content || '';
  const author = msg.author;

  const userMessage = content.replace(/<@!\d+>/g,'').trim();
  console.log("=====================")
  console.log("私信内容:", userMessage);
  console.log("=====================")
  try{
    if (userMessage === '你好' || userMessage === 'hello'){
      // ⚠️ 私信回复使用 directMessageApi，不是 messageApi
      await client.directMessageApi.postDirectMessage(guildId, {
        content: `你好 ${author.username}！我是你的小助手 🎉`,
        msg_id: messageId  // 被动回复需要 msg_id
      });
      return;
    }

    // 默认回复
    await client.directMessageApi.postDirectMessage(guildId, {
      content: `收到你的私信: "${userMessage}"`,
      msg_id: messageId
    });
    
  }catch(error){
    console.error('发送私信失败:', error);
  }

});
ws.on('INTERACTION', (data) => {
  console.log('[INTERACTION] 事件接收 :', data);
});
ws.on('MESSAGE_AUDIT', (data) => {
  console.log('[MESSAGE_AUDIT] 事件接收 :', data);
});
ws.on('FORUMS_EVENT', (data) => {
  console.log('[FORUMS_EVENT] 事件接收 :', data);
});
ws.on('AUDIO_ACTION', (data) => {
  console.log('[AUDIO_ACTION] 事件接收 :', data);
});
ws.on('PUBLIC_GUILD_MESSAGES', async (eventData) => {
  console.log("收到消息")
  console.log('[PUBLIC_GUILD_MESSAGES] 事件接收 :', eventData);
  const {data} = await client.messageApi.postMessage('', {
    content: 'test'
  })
  console.log(data);
});

// client.guildApi.guild('').then((data) => {
//   console.log(data);
// });

// // ✅
// client.channelApi.channels(guildID).then((res) => {
//   console.log(res.data);
// });
