/**
 * 游戏数据模块 - GameData
 * 定义所有游戏静态数据：草药、物品、任务等
 */

const GameData = {
    /**
     * 草药数据定义
     */
    HERBS_DATA: [
        { id: 'gancao', name: '甘草', property: '性平，味甘淡', meridian: '心脾肺胃', effect: '补脾益气，清热解毒，调和诸药', icon: '🌿', rarity: 'common', rarityLabel: '普通', category: '根茎类', season: '春秋二季', origin: '西北干旱草原', petTip: '💡 灵宠青苗对此药材有特殊好感', symptom: '气虚证', image: '', descDetail: '甘草被誉为"国老"，是中医药方中应用最广的调和之药。其根茎肥大，味甘甜，能解百毒，调和诸药之性。' },
        { id: 'huangqi', name: '黄芪', property: '甘/微温', meridian: '脾肺', effect: '补气固表，利尿托毒，排脓生肌', icon: '🌱', rarity: 'common', rarityLabel: '普通', category: '根茎类', season: '春秋采挖', origin: '山西、内蒙高原', petTip: '💡 采集时灵宠可增加双倍经验', symptom: '气虚证', image: '', descDetail: '黄芪为补气圣药，以山西浑源所产者为上品。其根绵软而韧，断面有菊花心纹路，气香而味甘。' },
        { id: 'danggui', name: '当归', property: '甘辛/温', meridian: '心肝脾', effect: '补血活血，调经止痛，润肠通便', icon: '🌾', rarity: 'rare', rarityLabel: '稀有', category: '根茎类', season: '秋末初冬', origin: '甘肃岷山深谷', petTip: '💡 女性角色使用效果更佳', symptom: '血虚证', image: '', descDetail: '当归补血圣药，因"应当归"而得名。甘肃岷县产者最佳，称"岷当归"，香气浓郁，质地油润。' },
        { id: 'gouqi', name: '枸杞', property: '甘/平', meridian: '肝肾', effect: '滋补肝肾，益精明目，养血安神', icon: '🫐', rarity: 'uncommon', rarityLabel: '优良', category: '果实类', season: '夏秋果实成熟时', origin: '宁夏中宁沙地', petTip: '💡 灵宠小狐狸的最爱零食', symptom: '虚劳证', image: '', descDetail: '枸杞子红如玛瑙，宁夏中宁所产最为地道。可泡茶、煮粥、入药，久服轻身不老。' },
        { id: 'jinyinhua', name: '金银花', property: '甘寒', meridian: '肺心胃', effect: '清热解毒，疏散风热，凉血止痢', icon: '🌸', rarity: 'uncommon', rarityLabel: '优良', category: '花叶类', season: '夏初花开时节', origin: '河南封丘花田', petTip: '💡 花香可吸引稀有蝴蝶', symptom: '风热证', image: '', descDetail: '金银花初开白色，后转黄色，故得名。善治温病初起、热毒疮疡，为清热解毒要药。' },
        { id: 'juhua', name: '菊花', property: '甘苦/微寒', meridian: '肺肝', effect: '散风清热，平肝明目，清热解毒', icon: '🌼', rarity: 'common', rarityLabel: '普通', category: '花叶类', season: '秋季霜降后', origin: '浙江桐乡菊园', petTip: '💡 泡茶饮用可恢复精神', symptom: '风热证', image: '', descDetail: '菊花品种繁多，杭白菊、亳菊、滁菊、贡菊并称四大名菊。疏散风热多用黄菊，平肝明目多用白菊。' },
        { id: 'chenpi', name: '陈皮', property: '辛苦/温', meridian: '脾胃肺', effect: '理气健脾，燥湿化痰，降逆止呕', icon: '🍊', rarity: 'common', rarityLabel: '普通', category: '果实类', season: '秋冬果实成熟时', origin: '广东新会柑园', petTip: '💡 存放越久价值越高', symptom: '痰湿证', image: '', descDetail: '陈皮以广东新会柑皮为道地药材，陈放三年以上方称"陈皮"。越陈越香，理气化痰之功愈著。' },
        { id: 'cheqiancao', name: '车前草', property: '甘/寒', meridian: '肝肾膀胱', effect: '清热利尿，渗湿止泻，明目祛痰', icon: '🌱', rarity: 'common', rarityLabel: '普通', category: '全草类', season: '夏季茂盛时', origin: '路边田野湿地', petTip: '💡 常见但实用，路边即可采集', symptom: '湿热证', image: '', descDetail: '车前草生于道旁车辙之间，故得名。虽为寻常野草，却能利水通淋、清肝明目，是民间常用的清热良药。' },
        { id: 'pugongying', name: '蒲公英', property: '苦甘/寒', meridian: '肝胃', effect: '清热解毒，消肿散结，利尿通淋', icon: '🌼', rarity: 'common', rarityLabel: '普通', category: '全草类', season: '春夏花期', origin: '田间地头草甸', petTip: '💡 数量多分布广，是新手首选', symptom: '实热证', image: '', descDetail: '蒲公英遍地可见，看似平凡却是清热解毒的良药。全草入药，花开如金，种子如絮，随风而去。' },
        { id: 'zisu', name: '紫苏', property: '辛/温', meridian: '肺脾', effect: '解表散寒，行气和胃，安胎解毒', icon: '🟣', rarity: 'common', rarityLabel: '普通', category: '花叶类', season: '夏季枝叶茂盛时', origin: '村舍田园', petTip: '💡 解鱼蟹毒效果奇佳', symptom: '风寒证', image: '', descDetail: '紫苏叶色紫气香，能解表散寒、行气宽中。古人食蟹必佐紫苏，可解鱼蟹之毒，亦能理气安胎。' },
        { id: 'bohe', name: '薄荷', property: '辛/凉', meridian: '肺肝', effect: '疏散风热，清利头目，利咽透疹', icon: '🌿', rarity: 'common', rarityLabel: '普通', category: '花叶类', season: '夏秋茎叶茂盛时', origin: '溪边阴湿处', petTip: '💡 清凉提神，可缓解暑热', symptom: '风热证', image: '', descDetail: '薄荷清凉芳香，入口有凉意，善治风热感冒、头痛目赤。夏日泡饮，消暑解热，令人神清气爽。' },
        { id: 'guizhi', name: '桂枝', property: '辛甘/温', meridian: '心肺膀胱', effect: '发汗解肌，温通经脉，助阳化气', icon: '🪵', rarity: 'uncommon', rarityLabel: '优良', category: '根茎类', season: '春秋剪取嫩枝', origin: '南方桂树林', petTip: '💡 与麻黄配伍发汗之力更强', symptom: '风寒证', image: '', descDetail: '桂枝为肉桂树之嫩枝，辛温发散，善祛风寒。其性温而不燥，为解表之要药，亦能温通经脉、助阳化气。' },
        { id: 'renshen', name: '人参', property: '甘微苦/温', meridian: '脾肺心肾', effect: '大补元气，复脉固脱，补脾益肺', icon: '🧆', rarity: 'legendary', rarityLabel: '传说', category: '根茎类', season: '秋季采挖最佳', origin: '长白山千年老林深处', petTip: '⚡ 传说级灵物！服用可大幅增强体质', symptom: '虚劳证', image: '', descDetail: '人参为百草之王，主产长白山。野生参称"野山参"，价值连城；栽培参称"园参"。芦、艼、体、纹、须俱全者为佳。' },
        { id: 'lingzhi', name: '灵芝', property: '甘/平', meridian: '心肺肝肾', effect: '补气安神，止咳平喘，延年益寿', icon: '🍄', rarity: 'legendary', rarityLabel: '传说', category: '矿石类', season: '四季可见，雨后最盛', origin: '深山古木枯根之上', petTip: '⚡ 仙草！可解锁隐藏配方', symptom: '虚劳证', image: '', descDetail: '灵芝乃传说中的仙草，生长于深山古木之上。赤芝入心，青芝入肝，白芝入肺，黄芝入脾，黑芝入肾。' },
        { id: 'tianma', name: '天麻', property: '甘/平', meridian: '肝', effect: '息风止痉，平抑肝阳，祛风通络', icon: '⚡', rarity: 'epic', rarityLabel: '史诗', category: '根茎类', season: '冬季至翌春', origin: '云贵高原密林', petTip: '⭐ 史诗级药材！治疗头痛眩晕之圣药', symptom: '肝阳证', image: '', descDetail: '天麻又名定风草，专治一切风症。云南昭通产者质优，形如鹦哥嘴，质地坚实。' },
        { id: 'dahuang', name: '大黄', property: '苦/寒', meridian: '脾胃大肠', effect: '泻下攻积，清热泻火，凉血解毒', icon: '🔥', rarity: 'uncommon', rarityLabel: '优良', category: '根茎类', season: '秋季采收', origin: '四川高山峡谷', petTip: '💡 用量需谨慎，过量伤脾胃', symptom: '实热证', image: '', descDetail: '大黄为将军之官，荡涤肠胃之力甚强。四川产者称"川大黄"，泻下攻积效佳，用量宜慎。' },
        { id: 'moyao', name: '没药', property: '苦辛/平', meridian: '心肝脾', effect: '散瘀定痛，消肿生肌，活血化瘀', icon: '💧', rarity: 'rare', rarityLabel: '稀有', category: '矿石类', season: '夏季树脂渗出时', origin: '西域沙漠索马里', petTip: '💡 与当归配伍效果倍增', symptom: '瘀血证', image: '', descDetail: '没药为橄榄科树干树脂，产于西域诸国。与乳香常配伍使用，专治跌打损伤、痈肿疮疡。' },
        { id: 'shanyao', name: '山药', property: '甘/平', meridian: '脾肺肾', effect: '补脾养胃，生津益肺，补肾涩精', icon: '🥔', rarity: 'common', rarityLabel: '普通', category: '根茎类', season: '冬季采挖', origin: '中原沃土田间', petTip: '💡 药食同源，滋补佳品', symptom: '虚劳证', image: '', descDetail: '山药原名薯蓣，为药食同源之佳品。其性平和，补而不腻，能益肺气、养脾阴、固肾精，老少皆宜。' },
        { id: 'yinchen', name: '茵陈', property: '苦辛/微寒', meridian: '脾胃肝胆', effect: '清热利湿，利胆退黄，解毒疗疮', icon: '🌾', rarity: 'uncommon', rarityLabel: '优良', category: '全草类', season: '清明前后采收最佳', origin: '溪边湿地浅滩', petTip: '💡 清明采集药效最佳', symptom: '湿热证', image: '', descDetail: '茵陈为菊科植物，民间有"三月茵陈四月蒿，五月六月当柴烧"之说。清明前后所采者药效最佳，善清肝胆湿热。' },
        { id: 'lugen', name: '芦根', property: '甘/寒', meridian: '肺胃', effect: '清热生津，除烦止呕，利尿通淋', icon: '🎋', rarity: 'common', rarityLabel: '普通', category: '根茎类', season: '四季可采', origin: '河岸溪边浅水处', petTip: '💡 随处可见，清热良品', symptom: '实热证', image: '', descDetail: '芦根即芦苇之根茎，生于水边湿地，鲜品汁液丰富。清热而不伤胃，生津而不滋腻，尤善治肺热咳嗽、胃热呕吐。' },
        { id: 'lianzi', name: '莲子', property: '甘涩/平', meridian: '脾肾心', effect: '补脾止泻，益肾涩精，养心安神', icon: '🪷', rarity: 'common', rarityLabel: '普通', category: '果实类', season: '秋季莲蓬成熟时', origin: '荷塘水面莲蓬中', petTip: '💡 清心安神，夏日良品', symptom: '虚劳证', image: '', descDetail: '莲子为睡莲科植物莲的成熟种子，生于荷塘之中。其味甘涩，能补脾益肾、固精止带，亦可养心安神。' },
        { id: 'zexie', name: '泽泻', property: '甘淡/寒', meridian: '肾膀胱', effect: '利水渗湿，泄热通淋，化浊降脂', icon: '💦', rarity: 'common', rarityLabel: '普通', category: '根茎类', season: '冬季茎叶枯萎时', origin: '浅水沼泽湿地', petTip: '💡 需踩石涉水小心采集', symptom: '湿热证', image: '', descDetail: '泽泻生于沼泽浅水中，块茎入药。其性寒而淡渗，利水之力较强，善导湿热下行，为利水渗湿之要药。' },
        { id: 'shichangpu', name: '石菖蒲', property: '辛苦/温', meridian: '心胃', effect: '开窍豁痰，醒神益智，化湿和胃', icon: '💎', rarity: 'rare', rarityLabel: '稀有', category: '根茎类', season: '秋冬采挖', origin: '深山溪流石缝间', petTip: '💡 隐藏采集点，价值极高', symptom: '痰湿证', image: '', descDetail: '石菖蒲生于山涧溪流石缝之间，其根茎芳香开窍，堪称"水草之精"。善化湿浊、开心窍，为醒神益智之上品。' },
        { id: 'fuling', name: '茯苓', property: '甘淡/平', meridian: '心脾肾', effect: '利水渗湿，健脾宁心，安神定志', icon: '🪨', rarity: 'uncommon', rarityLabel: '优良', category: '矿石类', season: '全年可采', origin: '松树根际土壤中', petTip: '💡 健脾渗湿之要药', symptom: '痰湿证', image: '', descDetail: '茯苓为多孔菌科真菌的干燥菌核，寄生于松树根部。其性平和，利水而不伤正，健脾而能宁心，为渗湿利水第一要药。' },
        { id: 'baihe', name: '百合', property: '甘/微寒', meridian: '肺心', effect: '养阴润肺，清心安神，止咳化痰', icon: '🌷', rarity: 'uncommon', rarityLabel: '优良', category: '花叶类', season: '秋季鳞茎成熟时', origin: '山坡林缘向阳处', petTip: '💡 润肺止咳，温柔之药', symptom: '虚劳证', image: '', descDetail: '百合为百合科植物卷丹或细叶百合的肉质鳞叶，其形如莲、其质如玉。善润肺止咳、清心安神，味甘性润。' }
    ],

    /**
     * 物资/道具数据定义（非草药类的背包物品）
     */
    ITEMS_DATA: [
        // === 货币 ===
        { id: 'copper', name: '铜钱', type: 'currency', category: '物资', icon: '💰', rarity: 'common', rarityLabel: '普通',
          description: '通用货币，可用于购买药材和物资', descDetail: '铜钱为本朝流通货币，面值有制钱、当十、当百不等。行医路上，铜钱既是路费也是药资。' },
        // === 装备/容器 ===
        { id: 'bag_luggage', name: '行囊', type: 'equipment', category: '物资', icon: '🎒', rarity: 'uncommon', rarityLabel: '优良',
          description: '结实耐用的布质行囊，可增加背包容量', descDetail: '白院长亲手缝制的行囊，内衬防水油纸，外层粗麻织就。虽不华丽，却装得下满载的期望与梦想。' },
        // === 文书/地图 ===
        { id: 'recommendation', name: '院长推荐信', type: 'document', category: '文书', icon: '📜', rarity: 'rare', rarityLabel: '稀有',
          description: '各地药铺、村庄好感度+10', descDetail: '白院长亲笔书写，盖有学堂朱印。持此信者可在各地药铺获得优待，亦能证明你师出名门。' },
        { id: 'bai_caotu', name: '百草图录', type: 'document', category: '文书', icon: '📖', rarity: 'epic', rarityLabel: '史诗',
          description: '记录已发现草药的图鉴手册，可随时查阅', descDetail: '白院长毕生心血之作，收录天下草木药性。每一页都是一位医者的智慧结晶。' },
        { id: 'map_cuizhu', name: '城郊地图', type: 'document', category: '文书', icon: '🗺️', rarity: 'uncommon', rarityLabel: '优良',
          description: '翠竹村周边区域的手绘地图', descDetail: '手绘于泛黄的宣纸之上，标注了村落、溪流、山林和可能的草药分布点。' },
        { id: 'map_qinghe', name: '清禾镇地图', type: 'document', category: '文书', icon: '🗺️', rarity: 'uncommon', rarityLabel: '优良',
          description: '清禾镇的详细地图，标注了商铺与地标', descDetail: '清禾镇为方圆百里最大的集市所在。此图标注了药铺、客栈、市集等重要地点。' },
        // === 特殊物品 ===
        { id: 'achievement', name: '成就：百草行者', type: 'special', category: '特殊', icon: '🏆', rarity: 'legendary', rarityLabel: '传说',
          description: '完成序章剧情解锁', descDetail: '「百草行者」——踏上采药之路的第一步。从今往后，每一步都算数。' },
        { id: 'reputation', name: '声望：学堂毕业生', type: 'special', category: '特殊', icon: '⭐', rarity: 'rare', rarityLabel: '稀有',
          description: '声望+10（学堂毕业生身份）', descDetail: '作为白院长的弟子毕业出师，你在医药圈已有薄名。这份声誉将伴随你的旅途。' }
    ],

    /**
     * 背包分类标签（新版：支持草药+物品混合分类）
     */
    BACKPACK_CATEGORIES: [
        { id: 'all', label: '全部物品', icon: '' },
        { id: 'herb_all', label: '全部药材', icon: '🌿' },
        { id: 'root', label: '根茎类', icon: '' },
        { id: 'flower', label: '花叶类', icon: '' },
        { id: 'fruit', label: '果实类', icon: '' },
        { id: 'mineral', label: '矿石类', icon: '' },
        { id: 'supplies', label: '物资', icon: '' },
        { id: 'documents', label: '文书', icon: '' },
        { id: 'pet', label: '灵宠道具', icon: '' },
        { id: 'special', label: '特殊', icon: '' }
    ],

    /**
     * 分类映射（herb.category -> category.id）—— 仅用于草药
     */
    CATEGORY_MAP: {
        '根茎类': 'root',
        '花叶类': 'flower',
        '果实类': 'fruit',
        '矿石类': 'mineral',
        '全草类': 'flower'
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
        { id: '虚劳证', label: '虚劳证', icon: '🌙' },
        { id: '风寒证', label: '风寒证', icon: '❄️' },
        { id: '湿热证', label: '湿热证', icon: '💧' }
    ],

    /**
     * 《本草情籍》—— 主角属性/数值系统
     * 记录专业能力、声望、技术等各类成长数值
     */
    ATTRIBUTES_DATA: [
        // ===== 医术能力（核心成长线）=====
        {
            id: 'herb_knowledge', name: '草药学识', icon: '📚',
            category: 'medical', categoryLabel: '医术',
            initialValue: 15, maxValue: 100,
            description: '识别草药种类、药性归经的功底',
            detail: '学堂三年所学的基础。能辨认的草药越多、对药性的理解越深，此值越高。影响：辨识未知药材成功率、图鉴解锁速度。',
            growthRule: '+2~5/每解锁新草药，+3~8/剧情关键学习'
        },
        {
            id: 'gathering', name: '采药技艺', icon: '🌿',
            category: 'medical', categoryLabel: '医术',
            initialValue: 20, maxValue: 100,
            description: '采摘草药的手法与效率',
            detail: '从药圃中亲手实践得来的技艺。手法娴熟者，采得的药材质地更佳、数量更多。影响：采集速度、稀有掉率、药材品质。',
            growthRule: '+1~3/每次采集，+5/完成采集类任务'
        },
        {
            id: 'crafting', name: '炮制药能', icon: '🔥',
            category: 'medical', categoryLabel: '医术',
            initialValue: 10, maxValue: 100,
            description: '晾晒、碾磨、炼制等加工手艺',
            detail: '炮制间里的初次尝试只是入门。火候的掌控、时机的把握都需要大量练习。影响：炮制成功率、药品品质等级、特殊配方解锁。',
            growthRule: '+2~4/每次炮制成功，+10/学会新炮制法'
        },
        {
            id: 'diagnosis', name: '望闻问切', icon: '💉',
            category: 'medical', categoryLabel: '医术',
            initialValue: 12, maxValue: 100,
            description: '诊断病情、辨证论治的能力',
            detail: '医者的根本功夫。通过望气色、闻气味、问症状、切脉象来推断病因。影响：诊疗选项解锁、判断正确率、病人信任度。',
            growthRule: '+3~6/每次正确诊断，+8~15/攻克疑难杂症'
        },

        // ===== 声望社交 =====
        {
            id: 'reputation', name: '医者声望', icon: '⭐',
            category: 'social', categoryLabel: '声望',
            initialValue: 10, maxValue: 999,
            description: '在医药圈和百姓中的知名度',
            detail: '作为岐黄学堂毕业生，你已有了最初的薄名。随着行医救人的事迹传开，名声将远播四方。影响：NPC好感度上限、特殊事件触发、商店折扣。',
            growthRule: '+5~20/完成诊疗任务，+10~30/重大事件选择'
        },
        {
            id: 'social', name: '交际人脉', icon: '🤝',
            category: 'social', categoryLabel: '声望',
            initialValue: 5, maxValue: 100,
            description: '与各路人物建立的交情深浅',
            detail: '白院长的人脉、药铺掌柜的认可、村长们的信赖……人脉就是行医路上的通行证。影响：信息获取渠道、委托任务品质、特殊对话选项。',
            growthRule: '+2~5/每次送礼或帮助NPC，+10/建立新关系'
        },

        // ===== 特殊属性 =====
        {
            id: 'spirit_bond', name: '灵宠羁绊', icon: '💎',
            category: 'special', categoryLabel: '特殊',
            initialValue: 30, maxValue: 100,
            description: '与灵宠青苗之间的默契程度',
            detail: '青苗认你为主的那一刻，羁绊便已结下。共同经历的每一次冒险都会让这份联结更加深厚。影响：灵宠技能强度、寻药范围、灵宠互动内容。',
            growthRule: '+2~5/每次带灵宠出行，+8~15/灵宠相关剧情'
        },
        {
            id: 'luck', name: '行医机缘', icon: '🍀',
            category: 'special', categoryLabel: '特殊',
            initialValue: 8, maxValue: 100,
            description: '遇见稀有事物和转机的运气',
            detail: '有人说医者自有天佑——在山野偶遇珍稀草药、在路上碰见需要救治之人……这些看似偶然的相遇，或许并非巧合。影响：奇遇触发率、稀有资源获取、意外收获概率。',
            growthRule: '+1~3/随机事件，+5/行善积德 choices'
        }
    ],

    /**
     * 属性分类标签（用于UI筛选展示）
     */
    ATTRIBUTE_CATEGORIES: [
        { id: 'all', label: '全部属性', icon: '📖' },
        { id: 'medical', label: '医术能力', icon: '💊' },
        { id: 'social', label: '声望交际', icon: '⭐' },
        { id: 'special', label: '特殊天赋', icon: '✨' }
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
