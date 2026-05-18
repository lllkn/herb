/**
 * 游戏数据模块 - GameData
 * 定义所有游戏静态数据：草药、任务、道具等
 */

const GameData = {
    /**
     * 草药数据定义
     */
    HERBS_DATA: [
        { id: 'gancao', name: '甘草', property: '性平，味甘淡', meridian: '心脾肺胃', effect: '补脾益气，清热解毒，调和诸药', icon: '🌿', rarity: 'common', rarityLabel: '普通', category: '根茎类', season: '春秋二季', origin: '西北干旱草原', petTip: '💡 灵宠茯苓团子对此药材有特殊好感', symptom: '气虚证', image: '', descDetail: '甘草被誉为"国老"，是中医药方中应用最广的调和之药。其根茎肥大，味甘甜，能解百毒，调和诸药之性。' },
        { id: 'huangqi', name: '黄芪', property: '甘/微温', meridian: '脾肺', effect: '补气固表，利尿托毒，排脓生肌', icon: '🌱', rarity: 'common', rarityLabel: '普通', category: '根茎类', season: '春秋采挖', origin: '山西、内蒙高原', petTip: '💡 采集时灵宠可增加双倍经验', symptom: '气虚证', image: '', descDetail: '黄芪为补气圣药，以山西浑源所产者为上品。其根绵软而韧，断面有菊花心纹路，气香而味甘。' },
        { id: 'danggui', name: '当归', property: '甘辛/温', meridian: '心肝脾', effect: '补血活血，调经止痛，润肠通便', icon: '🌾', rarity: 'rare', rarityLabel: '稀有', category: '根茎类', season: '秋末初冬', origin: '甘肃岷山深谷', petTip: '💡 女性角色使用效果更佳', symptom: '血虚证', image: '', descDetail: '当归补血圣药，因"应当归"而得名。甘肃岷县产者最佳，称"岷当归"，香气浓郁，质地油润。' },
        { id: 'gouqi', name: '枸杞', property: '甘/平', meridian: '肝肾', effect: '滋补肝肾，益精明目，养血安神', icon: '🫐', rarity: 'uncommon', rarityLabel: '优良', category: '果实类', season: '夏秋果实成熟时', origin: '宁夏中宁沙地', petTip: '💡 灵宠小狐狸的最爱零食', symptom: '虚劳证', image: '', descDetail: '枸杞子红如玛瑙，宁夏中宁所产最为地道。可泡茶、煮粥、入药，久服轻身不老。' },
        { id: 'jinyinhua', name: '金银花', property: '甘寒', meridian: '肺心胃', effect: '清热解毒，疏散风热，凉血止痢', icon: '🌸', rarity: 'uncommon', rarityLabel: '优良', category: '花叶类', season: '夏初花开时节', origin: '河南封丘花田', petTip: '💡 花香可吸引稀有蝴蝶', symptom: '风热证', image: '', descDetail: '金银花初开白色，后转黄色，故得名。善治温病初起、热毒疮疡，为清热解毒要药。' },
        { id: 'juhua', name: '菊花', property: '甘苦/微寒', meridian: '肺肝', effect: '散风清热，平肝明目，清热解毒', icon: '🌼', rarity: 'common', rarityLabel: '普通', category: '花叶类', season: '秋季霜降后', origin: '浙江桐乡菊园', petTip: '💡 泡茶饮用可恢复精神', symptom: '风热证', image: '', descDetail: '菊花品种繁多，杭白菊、亳菊、滁菊、贡菊并称四大名菊。疏散风热多用黄菊，平肝明目多用白菊。' },
        { id: 'chenpi', name: '陈皮', property: '辛苦/温', meridian: '脾胃肺', effect: '理气健脾，燥湿化痰，降逆止呕', icon: '🍊', rarity: 'common', rarityLabel: '普通', category: '果实类', season: '秋冬果实成熟时', origin: '广东新会柑园', petTip: '💡 存放越久价值越高', symptom: '痰湿证', image: '', descDetail: '陈皮以广东新会柑皮为道地药材，陈放三年以上方称"陈皮"。越陈越香，理气化痰之功愈著。' },
        { id: 'renshen', name: '人参', property: '甘微苦/温', meridian: '脾肺心肾', effect: '大补元气，复脉固脱，补脾益肺', icon: '🧆', rarity: 'legendary', rarityLabel: '传说', category: '根茎类', season: '秋季采挖最佳', origin: '长白山千年老林深处', petTip: '⚡ 传说级灵物！服用可大幅增强体质', symptom: '虚劳证', image: '', descDetail: '人参为百草之王，主产长白山。野生参称"野山参"，价值连城；栽培参称"园参"。芦、艼、体、纹、须俱全者为佳。' },
        { id: 'lingzhi', name: '灵芝', property: '甘/平', meridian: '心肺肝肾', effect: '补气安神，止咳平喘，延年益寿', icon: '🍄', rarity: 'legendary', rarityLabel: '传说', category: '矿石类', season: '四季可见，雨后最盛', origin: '深山古木枯根之上', petTip: '⚡ 仙草！可解锁隐藏配方', symptom: '虚劳证', image: '', descDetail: '灵芝乃传说中的仙草，生长于深山古木之上。赤芝入心，青芝入肝，白芝入肺，黄芝入脾，黑芝入肾。' },
        { id: 'tianma', name: '天麻', property: '甘/平', meridian: '肝', effect: '息风止痉，平抑肝阳，祛风通络', icon: '⚡', rarity: 'epic', rarityLabel: '史诗', category: '根茎类',季节: '冬季至翌春', origin: '云贵高原密林', petTip: '⭐ 史诗级药材！治疗头痛眩晕之圣药', symptom: '肝阳证', image: '', descDetail: '天麻又名定风草，专治一切风症。云南昭通产者质优，形如鹦哥嘴，质地坚实。' },
        { id: 'dahuang', name: '大黄', property: '苦/寒', meridian: '脾胃大肠', effect: '泻下攻积，清热泻火，凉血解毒', icon: '🔥', rarity: 'uncommon', rarityLabel: '优良', category: '根茎类', season: '秋季采收', origin: '四川高山峡谷', petTip: '💡 用量需谨慎，过量伤脾胃', symptom: '实热证', image: '', descDetail: '大黄为将军之官，荡涤肠胃之力甚强。四川产者称"川大黄"，泻下攻积效佳，用量宜慎。' },
        { id: 'moyao', name: '没药', property: '苦辛/平', meridian: '心肝脾', effect: '散瘀定痛，消肿生肌，活血化瘀', icon: '💧', rarity: 'rare', rarityLabel: '稀有', category: '矿石类', season: '夏季树脂渗出时', origin: '西域沙漠索马里', petTip: '💡 与当归配伍效果倍增', symptom: '瘀血证', image: '', descDetail: '没药为橄榄科树干树脂，产于西域诸国。与乳香常配伍使用，专治跌打损伤、痈肿疮疡。' }
    ],

    /**
     * 背包分类标签
     */
    BACKPACK_CATEGORIES: [
        { id: 'all', label: '全部药材' },
        { id: 'root', label: '根茎类' },
        { id: 'flower', label: '花叶类' },
        { id: 'fruit', label: '果实类' },
        { id: 'mineral', label: '矿石类' },
        { id: 'pet', label: '灵宠道具' }
    ],

    /**
     * 分类映射（herb.category -> category.id）
     */
    CATEGORY_MAP: {
        '根茎类': 'root',
        '花叶类': 'flower',
        '果实类': 'fruit',
        '矿石类': 'mineral'
    },

    /**
     * 图鉴病症分类体系
     */
    SYMPTOM_CATEGORIES: [
        { id: 'all', label: '全部图鉴', icon: '📖' },
        { id: '气虚证', label: '气虚证', icon: '💨' },
        { id: '血虚证', label: '血虚证', icon: '🩸' },
        { id: '风热证', label: '风热证', icon: '🌬️' },
        { id: '实热证', label: '实热证', icon: '🔥' },
        { id: '瘀血证', label: '瘀血证', icon: '🔴' },
        { id: '痰湿证', label: '痰湿证', icon: '💨' },
        { id: '肝阳证', label: '肝阳上亢', icon: '⚡' },
        { id: '虚劳证', label: '虚劳证', icon: '🌙' }
    ],

    /**
     * 任务数据定义
     */
    TASKS: [
        { id: 1, description: '采集甘草 ×3 (0/3)', targetHerb: 'gancao', targetCount: 3 },
        { id: 2, description: '与药铺掌柜对话', type: 'dialogue' }
    ]
};

// 导出供其他模块使用（全局变量模式）
window.GameData = GameData;
