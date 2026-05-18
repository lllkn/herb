// 百草行 - 模拟API（前端版本，无需后端服务器）
// 用于在没有Node.js环境时测试AI问诊功能

class MockAPI {
    constructor() {
        this.isMock = true;
        this.mockDelay = 500; // 模拟网络延迟(ms)
    }

    /**
     * 模拟AI问诊流式返回
     * @param {string} patientId - 患者ID
     * @param {string} symptoms - 症状描述
     * @param {array} herbIds - 玩家选择的草药ID
     * @param {function} onToken - 每个token的回调
     * @returns {Promise<string>} - 完整回复
     */
    async streamDiagnosis(patientId, symptoms, herbIds, onToken) {
        // 模拟网络延迟
        await this.delay(this.mockDelay);

        // 读取患者数据
        const patient = this.getPatientById(patientId);
        if (!patient) {
            throw new Error('患者不存在');
        }

        // 生成AI回复
        const response = this.generateDiagnosisResponse(patient, herbIds);
        
        // 流式返回（逐字显示）
        let fullText = '';
        for (let i = 0; i < response.length; i++) {
            const char = response[i];
            fullText += char;
            onToken(char);
            
            // 模拟打字速度
            await this.delay(30);
        }

        return fullText;
    }

    /**
     * 模拟处方验证
     * @param {string} patientId 
     * @param {array} herbIds 
     * @returns {Promise<object>}
     */
    async validatePrescription(patientId, herbIds) {
        await this.delay(this.mockDelay);

        const patient = this.getPatientById(patientId);
        if (!patient) {
            throw new Error('患者不存在');
        }

        // 验证处方
        const requiredHerbs = patient.requiredHerbs;
        const isCorrect = this.checkPrescription(herbIds, requiredHerbs);

        // 生成反馈
        const feedback = isCorrect 
            ? patient.dialogue.correct 
            : patient.dialogue.wrong + '\n\n提示：再仔细想想患者的症状，可能需要调整用药。';

        return {
            success: true,
            isCorrect,
            feedback,
            reward: isCorrect ? patient.reward : null
        };
    }

    /**
     * 模拟生成草药科普内容
     * @param {string} herbId 
     * @returns {Promise<object>}
     */
    async generateHerbContent(herbId) {
        await this.delay(this.mockDelay);

        const herb = this.getHerbById(herbId);
        if (!herb) {
            throw new Error('草药不存在');
        }

        // 模拟AI生成的内容
        return {
            knowledge: `${herb.name}，性味甘平，归心、肺、脾、胃经。${herb.description}`,
            usage: `常见用量：3-10g，煎服。${herb.name}是中医药体系中非常重要的基础药材。`,
            taboo: '阴虚火旺者慎用。不宜与某些药物同用，具体请遵医嘱。',
            story: this.getHerbStory(herb.name)
        };
    }

    // ============================================
    // 辅助函数
    // ============================================

    generateDiagnosisResponse(patient, herbIds) {
        const responses = [
            `根据${patient.name}的症状"${patient.symptoms}"，`,
            `我分析需要采取${patient.diagnosis}的治法。\n\n`,
            `您选择的草药是：${herbIds.map(id => this.getHerbById(id)?.name || id).join('、')}。\n\n`,
            herbIds.length > 0 
                ? `这个处方${this.checkPrescription(herbIds, patient.requiredHerbs) ? '基本符合' : '可能需要调整'}治疗原则。`
                : '请选择适当的草药组成处方。'
        ];

        return responses.join('');
    }

    checkPrescription(herbIds, requiredHerbs) {
        // 简单验证：检查是否包含所有必需草药
        return requiredHerbs.every(herb => herbIds.includes(herb));
    }

    getPatientById(patientId) {
        // 从全局数据读取（假设已加载）
        return window.gameData?.patients?.find(p => p.id === patientId);
    }

    getHerbById(herbId) {
        // 从全局数据读取
        return window.gameData?.herbs?.find(h => h.id === herbId);
    }

    getHerbStory(herbName) {
        const stories = {
            '甘草': '甘草有"国老"之称，早在《神农本草经》中就有记载。传说汉武帝时期，甘草救过无数将士的生命。',
            '黄芪': '黄芪原名"黄耆"，耆者长也，意为补药之长。唐代诗人杜甫曾用黄芪治疗痢疾。',
            '当归': '当归名字的由来颇有意思：古人说"当归"是因为"思夫当归"，常用于治疗妇女血虚。',
            '枸杞': '枸杞被誉为"明眼子"，《本草纲目》记载其"久服坚筋骨，轻身不老"。宁夏枸杞最为著名。',
            '金银花': '金银花因一蒂二花，新旧相参，黄白相映，故称作"金银花"，夏季饮用可清热解毒。'
        };

        return stories[herbName] || `${herbName}是中医药宝库中的珍贵药材，历史悠久，应用广泛。`;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 导出到全局
window.MockAPI = MockAPI;
