/**
 * 任务数据定义 — QuestData
 * 
 * 任务激活/完成规则：
 *  - required: 前置任务 ID 列表（全部完成才激活）
 *  - completeOn: 完成条件（event: 事件ID 或 loc: 地点key）
 */

window.QUESTS_DATA = [
  // ========================================================
  // 平原 (plain) 任务 — 6个
  // ========================================================
  {
    id: 'Q_PLAIN_HERB',
    name: '采集甘草',
    desc: '在平原上找到并采集甘草',
    mapId: 'plain',
    icon: '🌿',
    required: [],
    completeOn: { type: 'event', value: 'EVT_FIRST_HERB' },
    order: 1
  },
  {
    id: 'Q_PLAIN_WOODCUTTER',
    name: '与砍柴老伯对话',
    desc: '向路边的砍柴老伯打听翠竹村的消息',
    mapId: 'plain',
    icon: '🪓',
    required: [],
    completeOn: { type: 'event', value: 'EVT_WOODCUTTER' },
    order: 2
  },
  {
    id: 'Q_PLAIN_BASKET',
    name: '查看废弃药篓',
    desc: '检查路边遗落的药篓，寻找线索',
    mapId: 'plain',
    icon: '🧺',
    required: [],
    completeOn: { type: 'event', value: 'EVT_ABANDONED_BASKET' },
    order: 3
  },
  {
    id: 'Q_PLAIN_WASHER',
    name: '与洗衣妇对话',
    desc: '与河边洗衣的村妇交谈了解村中情况',
    mapId: 'plain',
    icon: '🧺',
    required: [],
    completeOn: { type: 'event', value: 'EVT_WASHERWOMAN' },
    order: 4
  },
  {
    id: 'Q_PLAIN_MERCHANT',
    name: '与王掌柜对话',
    desc: '与路过的行商王掌柜交谈',
    mapId: 'plain',
    icon: '💰',
    required: ['Q_PLAIN_HERB'],
    completeOn: { type: 'event', value: 'EVT_MERCHANT' },
    order: 5
  },
  {
    id: 'Q_PLAIN_VILLAGE',
    name: '进入翠竹村',
    desc: '穿过平原，前往翠竹村牌坊',
    mapId: 'plain',
    icon: '🏘️',
    required: ['Q_PLAIN_HERB'],
    completeOn: { type: 'event', value: 'EVT_VILLAGE_GATE' },
    order: 6
  },

  // ========================================================
  // 翠竹村 (village) 任务 — 5个（对应地图上的「！」标记点）
  // ========================================================
  {
    id: 'Q_VILL_HERB',
    name: '药圃辨药',
    desc: '前往药圃帮助老李辨识药材',
    mapId: 'village',
    icon: '🌱',
    required: [],
    completeOn: { type: 'loc', value: 'loc_herb_garden' },
    order: 1
  },
  {
    id: 'Q_VILL_WELL',
    name: '水井探查',
    desc: '去水井边了解村民病情',
    mapId: 'village',
    icon: '🪣',
    required: [],
    completeOn: { type: 'loc', value: 'loc_well' },
    order: 2
  },
  {
    id: 'Q_VILL_DRY',
    name: '晒药台炮制',
    desc: '到晒药台学习晾晒炮制药材',
    mapId: 'village',
    icon: '☀️',
    required: ['Q_VILL_HERB'],
    completeOn: { type: 'loc', value: 'loc_drying_platform' },
    order: 3
  },
  {
    id: 'Q_VILL_SHOP',
    name: '接手空药铺',
    desc: '查看空置药铺，接手经营「百草堂」',
    mapId: 'village',
    icon: '🏮',
    required: [],
    completeOn: { type: 'loc', value: 'loc_empty_shop' },
    order: 4
  },
  {
    id: 'Q_VILL_DIAGNOSIS',
    name: '为张大娘诊治',
    desc: '去张大娘家四诊合参，开具处方',
    mapId: 'village',
    icon: '🩺',
    required: ['Q_VILL_HERB', 'Q_VILL_DRY', 'Q_VILL_WELL', 'Q_VILL_SHOP'],
    completeOn: { type: 'loc', value: 'loc_zhang_home' },
    order: 5
  },

  // ========================================================
  // 溪流 (stream) 任务 — 3个
  // ========================================================
  {
    id: 'Q_STREAM_SHANYAO',
    name: '采集山药',
    desc: '在溪流山谷中采集3株山药',
    mapId: 'stream',
    icon: '🥔',
    required: [],
    completeOn: { type: 'event', value: 'EVT_SHANYAO_3_COLLECTED' },
    order: 1
  },
  {
    id: 'Q_STREAM_FULING',
    name: '采集茯苓',
    desc: '在松林深处采集3株茯苓',
    mapId: 'stream',
    icon: '🍄',
    required: ['Q_STREAM_SHANYAO'],
    completeOn: { type: 'event', value: 'EVT_FULING_3_COLLECTED' },
    order: 2
  },
  {
    id: 'Q_STREAM_GUGEN',
    name: '发现蛊根草',
    desc: '穿过迷雾松林，发现传说中的蛊根草',
    mapId: 'stream',
    icon: '🌿',
    required: ['Q_STREAM_FULING'],
    completeOn: { type: 'event', value: 'EVT_VALLEY_CLEARING' },
    order: 3
  }
];

console.log('[QuestData] 任务数据已加载，共', window.QUESTS_DATA.length, '个任务');
