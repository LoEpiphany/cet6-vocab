# -*- coding: utf-8 -*-
"""从用户新增的 7 份作文资料构建 outputs/essay.json。
只做结构化与清洗，英文原句不改写；中文释义/大纲为资料内容或忠实转写。
"""
import os, re, json, sys
sys.stdout.reconfigure(encoding="utf-8")

BASE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(BASE, "essay_raw")
OUT = os.path.join(os.path.dirname(BASE), "outputs", "essay.json")

def read(name):
    return open(os.path.join(RAW, name), encoding="utf-8").read()

# ---------------- 预测题 / 范文 ----------------
PRED = read("六级翻译写作预测7711581513755394349.txt")
t = re.sub(r"===== PAGE \d+ =====", "", PRED)
t = re.sub(r"第\s*\d+\s*页", "", t)
t = re.sub(r"^\s*中文表达\s*$|^\s*英文表达\s*$", "", t, flags=re.M)
t = t.replace("Directions:", "").replace("Direction:", "")

TOPIC_POINTS = {
 "2.1": ["AI 是助手不是替身：整理资料可以，判断和创造不能外包",
         "过度依赖会削弱分析、判断、创造，也难辨偏见信息",
         "做法：以 AI 为参考，批判性审视输出，保留自己推理的过程"],
 "2.2": ["信息洪流里核实成本高，谣言常被包装得像事实",
         "不核实就转发，会放大焦虑、误导判断、影响稳定",
         "做法：查官方与可靠来源，先停三秒再转发"],
 "2.3": ["习惯标准答案后，人容易停在舒适区",
         "好奇心驱动提问与探索，是创新的源头",
         "做法：保持开放，敢质疑，不把一切当理所当然"],
 "2.4": ["拖延与无优先级，让任务堆到最后一刻",
         "低效带来压力、熬夜，牺牲休息与质量",
         "做法：分清主次，做可行的日计划，避免无谓拖延"],
 "2.5": ["只盯着未得到的，会忽视身边的支持",
         "无休止的不满消耗精力，也削弱关系与动力",
         "做法：表达感谢，珍惜小收获，把感恩变成日常习惯"],
 "2.6": ["网络让人急于评判，缺少完整语境",
         "共情让人换位思考，减少误解与冲突",
         "做法：下判断前先停一下，想想对方经历过什么"],
 "2.7": ["即时回报让人短视，短期没成效就放弃",
         "真正的能力与突破来自持续投入",
         "做法：盯长期成长，日拱一卒，不迷信速成"],
 "2.8": ["急于表达、只顾准备回应，沟通变成独白",
         "不听会曲解意图、制造误会、破坏信任",
         "做法：先听懂对方真实感受，再发表看法"],
 "2.9": ["物质与刺激越多，越容易陷入比较和消耗",
         "什么都想要，反而看不清真正需要",
         "做法：分清主次，减少不必要消费与干扰"],
 "2.10": ["怕失败让人回避尝试，困在负面情绪里",
          "失败暴露短板，是调整策略的信息",
          "做法：复盘教训，把失败转成下一步行动"],
 "2.11": ["短视频给碎片信息与即时快感，难成体系",
          "深度阅读训练专注、语言与独立思考",
          "做法：每天固定一段无干扰阅读时间"],
 "2.12": ["小成绩后容易高估自己，听不进不同声音",
          "盲目自信遮蔽短板，让人停在原地",
          "做法：取得成绩保持清醒，开放接受批评"],
 "2.13": ["硬撑不等于高效，大脑无法一直满负荷",
          "缺休息导致注意力下降、反应变慢、错误增多",
          "做法：合理排期，主动短暂休息再回到任务"],
 "2.14": ["弹窗与短视频不断切碎注意力",
          "频繁切换让思考变浅，难出高质量成果",
          "做法：设无手机时段，一次只做一件重要的事"],
 "2.15": ["边界界定“我到哪里、你从哪里开始”",
          "无边界导致过度依赖、怨气与倦怠",
          "做法：识别自己的限度，清晰而尊重地表达，也尊重他人边界"],
}
TOPIC_TYPE = {"2.4": "问题解决型"}
TOPIC_TAG = {
 "2.1": "科技·思维", "2.2": "信息·判断", "2.3": "成长·探索", "2.4": "方法·效率",
 "2.5": "心态·关系", "2.6": "关系·共情", "2.7": "成长·坚持", "2.8": "沟通·倾听",
 "2.9": "生活·取舍", "2.10": "心态·韧性", "2.11": "学习·阅读", "2.12": "品格·进步",
 "2.13": "方法·恢复", "2.14": "能力·专注", "2.15": "关系·边界",
}

def clean_en(s):
    s = re.sub(r"\s+", " ", s).strip()
    s = re.sub(r"([a-z]\.)([A-Z])", r"\1 \2", s)
    s = re.sub(r"\s+([,.;:!?])", r"\1", s)
    s = s.replace("( ", "(").replace(" )", ")")
    s = s.replace("‑", "-").replace("—", "—")
    s = re.sub(r"\s+", " ", s).strip()
    return s

def clean_cn(s):
    s = re.sub(r"\s+", " ", s).strip()
    s = re.sub(r"\s*([，。；：！？、）】」])\s*", r"\1", s)
    s = re.sub(r"([（【「])\s*", r"\1", s)
    s = re.sub(r"(?<=[\u4e00-\u9fff])\s+(?=[\u4e00-\u9fff])", "", s)
    return s.strip()

segments = re.split(r"\n(2\.\d+)\s+([^\n]+)\n", t)
topics = []
for i in range(1, len(segments), 3):
    num, title, body = segments[i], segments[i + 1].strip(), segments[i + 2]
    if num not in TOPIC_POINTS:
        continue
    q = re.search(r"begins\s+with\s+the\s+sentence\s*[“\"](.+?)[”\"]", body, re.S)
    prompt = clean_en(q.group(1)) if q else ""
    m = re.search(r"【参考范文】(.*?)【中文对照】(.*?)(?=\n2\.\d+\s|\n三、|$)", body, re.S)
    if not m:
        print("WARN no model", num); continue
    model = clean_en(m.group(1))
    cn = clean_cn(m.group(2))
    topics.append({
        "id": "tp" + num.replace(".", "_"),
        "num": num, "title": title.strip(), "type": TOPIC_TYPE.get(num, "引言式议论文"),
        "tag": TOPIC_TAG.get(num, ""), "prompt": prompt,
        "points": TOPIC_POINTS[num], "model": model, "cn": cn,
        "src": "六级翻译写作预测",
    })
print("topics:", len(topics))

# ---------------- 100 组高频搭配 ----------------
PHR = read("英语写作中100个使用频率较高的词语搭配7639206280252008000.txt")
PHR = re.sub(r"===== PAGE \d+ =====", "", PHR)
PHR = re.sub(r"^\s*英语写作中100.*$", "", PHR, flags=re.M)
blocks = re.split(r"\n(?=\s*\d{1,3}\s*[．.])", PHR)
phrases = []
for b in blocks:
    b = re.sub(r"\s+", " ", b).strip()
    m = re.match(r"(\d{1,3})\s*[．.]\s*(.+)", b)
    if not m:
        continue
    n = int(m.group(1)); rest = m.group(2).strip()
    if n == 77:
        cn, en = "可以取代“think”的词", "believe, claim, maintain, argue, insist, hold the opinion / belief that"
    else:
        k = None
        for j, ch in enumerate(rest):
            if ("a" <= ch.lower() <= "z") and (j == 0 or rest[j - 1] not in "“"):
                k = j; break
        if k is None:
            cn, en = rest, ""
        else:
            cn, en = rest[:k].strip(" 　：:"), rest[k:].strip()
    en = en.replace("fovor", "favor").replace("latteropinion", "latter opinion")
    en = re.sub(r"\s*（[^）]*）\s*$", "", en).strip()
    en = re.sub(r"\s+[\u4e00-\u9fff].*$", "", en).strip()
    en = re.sub(r"\s+", " ", en)
    if not cn or not en:
        continue
    phrases.append({"id": "ph%d" % n, "no": n, "cn": cn, "en": en})
print("phrases:", len(phrases))

# ---------------- 万能素材（好处/坏处） ----------------
MAT = read("写作万能素材库7648606550856173480.txt")
MAT = re.sub(r"===== PAGE \d+ =====", "", MAT)
chunks = re.split(r"\n(?=\s*(?:好处|坏处)\d)", MAT)
materials = []
GROUP_EN = {"好处": "benefit", "坏处": "harm"}
for c in chunks:
    m = re.match(r"\s*(好处|坏处)(\d)\s*([^\n]*)\n(.+)", c, re.S)
    if not m:
        continue
    g, no, topic, body = m.group(1), int(m.group(2)), m.group(3).strip(), m.group(4)
    body = re.sub(r"\s+", " ", body).strip()
    cut = None
    for j, ch in enumerate(body):
        if "\u4e00" <= ch <= "\u9fff":
            cut = j; break
    if not cut:
        continue
    en, cn = clean_en(body[:cut]), clean_cn(body[cut:])
    materials.append({"id": "m%s%d" % ("b" if g == "好处" else "h", no), "group": g,
                      "topic": topic, "en": en, "cn": cn, "kind": "素材",
                      "src": "写作万能素材库"})
print("materials(素材):", len(materials))

# ---------------- 维度词块 ----------------
DIM = [
 ("个人", "critical thinking", "批判性思维"), ("个人", "problem-solving skills", "解决问题的能力"),
 ("个人", "practical skills", "实践能力"), ("个人", "communicative competence", "沟通能力"),
 ("个人", "time management", "时间管理"), ("个人", "self-discipline", "自律"),
 ("个人", "lifelong learning", "终身学习"), ("个人", "resilient", "有韧性的"),
 ("个人", "adaptable", "适应性强的"), ("个人", "proactive", "主动的"),
 ("个人", "responsible", "有责任心的"), ("个人", "confident", "自信的"),
 ("个人", "personal growth", "个人成长"), ("个人", "academic and career success", "学业与职业成功"),
 ("个人", "a sense of achievement", "成就感"), ("个人", "clarity in goals", "目标清晰"),
 ("社会", "social harmony", "社会和谐"), ("社会", "a positive atmosphere", "积极氛围"),
 ("社会", "mutual assistance", "互助"), ("社会", "cultural diversity", "文化多样性"),
 ("社会", "inclusivity", "包容性"), ("社会", "abide by the law", "守法"),
 ("社会", "follow social codes", "遵守社会公德"), ("社会", "respect others", "尊重他人"),
 ("社会", "participate in public welfare", "参与公益"), ("社会", "collective progress", "集体进步"),
 ("社会", "social cohesion", "社会凝聚力"), ("社会", "a sense of community", "社群归属感"),
 ("国家", "sustainable development", "可持续发展"), ("国家", "economic prosperity", "经济繁荣"),
 ("国家", "national rejuvenation", "民族复兴"), ("国家", "global competitiveness", "全球竞争力"),
 ("国家", "innovation-driven strategy", "创新驱动战略"), ("国家", "talent cultivation", "人才培养"),
 ("国家", "cultural confidence", "文化自信"), ("国家", "comprehensive national power", "综合国力"),
 ("国家", "a community with a shared future", "人类命运共同体"),
 ("家庭", "emotional support", "情感支持"), ("家庭", "family bond", "家庭纽带"),
 ("家庭", "mutual understanding", "相互理解"), ("家庭", "filial piety", "孝道"),
 ("家庭", "setting a good example", "树立好榜样"), ("家庭", "encouraging exploration", "鼓励探索"),
 ("家庭", "open communication", "开放交流"), ("家庭", "granting appropriate freedom", "给予适当自由"),
 ("家庭", "a well-rounded personality", "健全的人格"), ("家庭", "a sense of security", "安全感"),
 ("家庭", "positive values", "积极的价值观"),
]
for i, (dim, en, cn) in enumerate(DIM, 1):
    materials.append({"id": "md%02d" % i, "group": dim, "topic": "维度词块", "en": en, "cn": cn,
                      "kind": "词块", "src": "六级作文模板和分论点"})

# ---------------- 高级替换词 ----------------
REPL = [
 ("more and more", "an increasing number of", "越来越多的"),
 ("very", "extremely", "非常、极大"),
 ("good", "remarkable", "好的、卓越的"),
 ("important", "significant / key", "重要的"),
 ("a lot of", "significant / substantial", "很多、重大的"),
 ("many", "numerous", "许多"),
 ("like", "be fond of / have a deep affection for", "喜欢"),
 ("famous", "renowned", "著名的"),
]
for i, (old, new, cn) in enumerate(REPL, 1):
    materials.append({"id": "mr%d" % i, "group": "替换", "topic": "高级替换词",
                      "en": "%s → %s" % (old, new), "cn": cn, "kind": "替换",
                      "src": "写作万能素材库"})
print("materials total:", len(materials))

# ---------------- 近年高频主题句（套句总结 OCR） ----------------
THEMES = [
 ("人工智能", "AI tools are changing the way we learn, but they cannot replace independent thinking.", "人工智能工具正在改变我们的学习方式，但无法取代独立思考。"),
 ("人工智能", "Instead of banning AI tools, we should teach students to use them responsibly.", "与其禁止人工智能工具，不如教学生负责任地使用它们。"),
 ("人工智能", "Over-reliance on AI may weaken our ability to think critically and solve problems on our own.", "过度依赖人工智能可能削弱我们独立思考和解决问题的能力。"),
 ("人工智能", "Used properly, AI can personalize learning and save teachers time.", "使用得当，人工智能可以实现个性化学习，并为教师节省时间。"),
 ("人工智能", "The key is to make AI a tool, not a crutch.", "关键在于让人工智能成为工具，而不是拐杖。"),
 ("社交媒体", "Social media keeps us connected, yet it can also make us feel isolated.", "社交媒体让我们保持联系，却也可能让我们感到孤独。"),
 ("社交媒体", "Endless scrolling steals time that could be spent on study, exercise, or face-to-face communication.", "无休止地刷屏，偷走了本可用于学习、锻炼或面对面交流的时间。"),
 ("社交媒体", "We should set clear boundaries and use social media with a purpose.", "我们应划清界限，有目的地使用社交媒体。"),
 ("社交媒体", "The value of social media depends on how we use it.", "社交媒体的价值取决于我们如何使用它。"),
 ("心理健康", "Mental health deserves as much attention as physical health.", "心理健康应得到与身体健康同等的重视。"),
 ("心理健康", "Universities should provide counseling services and create a supportive environment.", "高校应提供心理咨询服务，营造支持性的环境。"),
 ("心理健康", "Seeking help is a sign of strength, not weakness.", "寻求帮助是坚强的表现，而非软弱。"),
 ("心理健康", "A healthy mind is the foundation of academic success and personal growth.", "健康的心理是学业成功和个人成长的基础。"),
 ("传统文化", "Traditional culture is a source of identity and confidence.", "传统文化是认同感与自信心的源泉。"),
 ("传统文化", "We should pass on our cultural heritage in ways that appeal to young people.", "我们应以年轻人喜闻乐见的方式传承文化遗产。"),
 ("传统文化", "Protecting intangible cultural heritage is protecting our roots.", "保护非物质文化遗产，就是保护我们的根脉。"),
 ("传统文化", "Cultural confidence enables us to engage with the world on equal terms.", "文化自信使我们能够平等地与世界交流。"),
 ("跨文化交流", "Cross-cultural competence is essential in a globalized world.", "在全球化时代，跨文化能力至关重要。"),
 ("跨文化交流", "Respect for differences is the first step toward effective communication.", "尊重差异是有效沟通的第一步。"),
 ("跨文化交流", "Learning about other cultures helps us understand our own better.", "了解其他文化有助于我们更好地理解自身文化。"),
 ("校园生活", "The university could improve campus life by upgrading facilities and streamlining services.", "学校可以通过升级设施、简化服务流程来改善校园生活。"),
 ("校园生活", "Extending library hours during exam weeks would benefit students greatly.", "考试周延长图书馆开放时间将使学生大为受益。"),
 ("校园生活", "A one-stop online platform would save students time and reduce frustration.", "一站式线上平台将为学生节省时间、减少困扰。"),
 ("校园生活", "It would be helpful if the university could collect feedback regularly.", "学校若能定期收集反馈，将会很有帮助。"),
 ("志愿服务", "Community service allows students to apply what they have learned and give back to society.", "社区服务让学生学以致用，并回馈社会。"),
 ("志愿服务", "Volunteering helps students develop empathy, teamwork, and a sense of responsibility.", "志愿服务有助于培养学生的同理心、团队合作意识和责任感。"),
 ("志愿服务", "Social practice and academic learning are equally important.", "社会实践与课堂学习同等重要。"),
 ("健康生活", "A healthy lifestyle consists of a balanced diet, regular exercise, and adequate sleep.", "健康的生活方式包括均衡饮食、规律运动和充足睡眠。"),
 ("健康生活", "Regular exercise not only strengthens the body but also relieves stress.", "规律运动不仅能强身健体，还能缓解压力。"),
 ("健康生活", "Good health is the foundation on which everything else is built.", "健康是其他一切赖以建立的基础。"),
]
for i, (topic, en, cn) in enumerate(THEMES, 1):
    materials.append({"id": "mt%02d" % i, "group": "主题句", "topic": topic,
                      "en": en, "cn": cn, "kind": "主题句", "src": "四六级作文套句总结"})
print("materials total:", len(materials))

# ---------------- 模板段落 ----------------
templates = [
 {"id": "t1", "part": "开头", "name": "开门见山 + 多维分析",
  "en": "“{题目起始句}.” This phenomenon has sparked widespread discussion, and its significance can be analyzed from the following perspectives.",
  "cn": "“{题目起始句}”。这一现象引发了广泛讨论，其重要性可以从以下多个维度进行分析。",
  "use": "题干已给首句时，原样抄写，再用一句话把话题拉进“多维分析”。", "src": "六级作文模板和分论点"},
 {"id": "t2", "part": "主体·个人", "name": "个人维度：成长与能力",
  "en": "From an individual perspective, {主题} is indispensable for personal growth and success. It enables us to {能力1} and {能力2}. For instance, students who {具体举例} tend to perform better in their future endeavors.",
  "cn": "从个人角度看，{主题}对个人成长与成功不可或缺。它使我们能够{能力1}并{能力2}。例如，那些{具体举例}的学生往往在未来表现更佳。",
  "use": "主题和个人成长、能力、就业、心态有关时优先用。", "src": "六级作文模板和分论点"},
 {"id": "t3", "part": "主体·社会", "name": "社会维度：和谐与进步",
  "en": "On a societal level, {主题} plays a vital role in fostering a healthy and progressive community. When citizens engage in {与主题相关的积极行为}, it promotes social harmony and drives collective advancement. Conversely, a lack of it may lead to issues like {负面问题}.",
  "cn": "在社会层面，{主题}对培育健康、进步的社会至关重要。当公民积极参与{与主题相关的积极行为}时，它能促进社会和谐并推动集体进步。反之，其缺失可能导致{负面问题}。",
  "use": "主题涉及公共行为、风气、信任、合作时用；结尾补一句反面的后果更有力。", "src": "六级作文模板和分论点"},
 {"id": "t4", "part": "主体·国家", "name": "国家维度：发展与竞争力",
  "en": "From a national viewpoint, {主题} is closely linked to the country's sustainable development and global competitiveness. It contributes to {领域1} and strengthens {领域2}, which are key to a nation's prosperity.",
  "cn": "从国家视角看，{主题}与国家的可持续发展和全球竞争力密切相关。它有助于{领域1}并增强{领域2}，这些都是国家繁荣的关键。",
  "use": "主题能上升到科技、人才、文化、综合国力时用；不要硬套。", "src": "六级作文模板和分论点"},
 {"id": "t5", "part": "主体·家庭", "name": "家庭维度：第一课堂",
  "en": "The influence of {主题} also extends to the family unit. Parents who {相关的家庭教育行为} can effectively help their children {培养的品质}. Therefore, family serves as the primary ground for cultivating this awareness.",
  "cn": "{主题}的影响同样延伸至家庭。那些{相关的家庭教育行为}的家长，能有效帮助孩子{培养的品质}。因此，家庭是培养这种意识的首要场所。",
  "use": "主题与习惯、品格、沟通、成长环境有关时用。", "src": "六级作文模板和分论点"},
 {"id": "t6", "part": "结尾", "name": "总结 + 行动 + 升华",
  "en": "In conclusion, the importance of {主题} is multifaceted, encompassing personal, social, and national dimensions. It is, therefore, imperative that we take concerted action to promote it, thereby securing a brighter future for both individuals and society as a whole.",
  "cn": "总之，{主题}的重要性是多方面的，涵盖个人、社会与国家维度。因此，我们采取一致行动来推广它至关重要，从而为个人和整个社会赢得更光明的未来。",
  "use": "三个维度都写了才用“multifaceted”；只写两个维度就删掉没写的那个。", "src": "六级作文模板和分论点"},
]

structures = [
 {"id": "s1", "name": "问题解决型", "tag": "现象→原因→措施",
  "desc": "题干给一个棘手问题，问怎么办。首段点问题与危害，主体给 2–3 条措施，结尾收束。",
  "steps": ["首段：名言/现象 + 问题 + 危害 + 该解决了", "主体：措施 1（能力/知识）→ 措施 2（资源/制度）→ 措施 3（特殊情况）", "结尾：总结 + 只要落实就能改善"],
  "frame": "Just as the old saying goes, “Everything has its merits and demerits.” In today's fast-paced world, many people are confronted with the thorny problem of ______, which exerts an adverse impact on their study and daily life. It is high time that we figured out effective ways to cope with it. From my perspective, several approaches can help address this problem. To begin with, we are well-advised to ______, for the reason that relevant knowledge or abilities allow us to work and study more efficiently. In addition, in order to gain a clearer understanding of ______, it is essential for us to allocate resources reasonably. Last but not least, we ought to cater to individual needs when facing special circumstances. Taking into account all the above points, we may safely arrive at a conclusion that we can achieve a satisfying outcome if we take these practical measures.",
  "src": "六级翻译写作预测 3.1"},
 {"id": "s2", "name": "谚语评论型", "tag": "引语→阐释→例证→回扣",
  "desc": "题干给一句名言/谚语，要求评论。先解释这句话，再落到社会现象，举例，最后回扣。",
  "steps": ["首段：引出名言 + 它揭示了什么现象", "主体：这句话为什么成立（价值）+ 反面的代价 + 例子", "结尾：我们该怎么做 + 回扣名言"],
  "frame": "As a world celebrity said, “______.” The quote not only summarizes the secret of ______, but also reveals a widespread phenomenon in our society: ______. There is no doubt that ______ matters enormously. Nevertheless, it may turn out futile or even harmful if we lack correct values. Take ______ as an example. As college students, it is crucial that we ______. We will never discover our full potential until we challenge ourselves. In order to make ______ serve us better, we should draw on our work and life experience. ______ is a challenge for cowards yet a precious opportunity for the brave. Therefore, we should hold the faith that everyone can overcome any obstacles and eventually reach our goals.",
  "src": "六级翻译写作预测 3.2"},
 {"id": "s3", "name": "观点论述型", "tag": "现象→争议→理由→立场",
  "desc": "题干给一个有争议的做法或趋势，问是否合理。首段摆争议，主体给理由，结尾亮立场。",
  "steps": ["首段：趋势 + 争议 + 下面给理由", "主体：理由 1（需求/动机）→ 理由 2（替代方案）→ 理由 3（外部支持）", "结尾：我的立场 + 但也要审慎/准备"],
  "frame": "Nowadays there is a growing tendency for ______ to ______. This trend has aroused widespread debate over whether such a practice is reasonable or not. The following reasons may account for this phenomenon. First and foremost, ______ are dissatisfied with ______. Instead, they attempt to ______ by means of ______. Moreover, when confronted with ______, people have to seek alternative solutions. Last but not least, thanks to the encouragement and support from the government and media, more people have been motivated to follow suit. From my perspective, it is a sensible choice for ______ to ______. Nevertheless, the process is far from easy and requires sufficient ______ and ______. Accordingly, we are supposed to think carefully and make full preparations before ______ takes place.",
  "src": "六级翻译写作预测 3.3（按原文可读部分整理）"},
]

# ---------------- 加分句型 ----------------
def P(fn, en, cn, tip="", src="英语六级议论文万能加分句式"):
    return {"fn": fn, "en": en, "cn": cn, "tip": tip, "src": src}

patterns = [
 # 开头
 P("开头·利弊双面", "...has been playing an increasingly important role in our day-to-day life. It has brought a lot of benefits but has created some serious problems as well.", "……在日常生活中发挥着越来越重要的作用。它带来了许多好处，但也造成了一些严重问题。", "适合“利弊型”开头，一句话立住两面。"),
 P("开头·利弊双面", "...has been playing an increasingly important role in our day-to-day life. It has both favorable and unfavorable impacts.", "……在日常生活中发挥着越来越重要的作用，它既有有利影响，也有不利影响。"),
 P("开头·公众关注", "The problem of ... has caused wide public concern over recent years.", "近年来，……问题引起了广泛公众关注。"),
 P("开头·公众关注", "The problem of ... has aroused people's concern recently.", "……问题近来引起了人们的关注。"),
 P("开头·不得不面对", "Nowadays, ... has become a problem we have to face.", "如今，……已成为我们不得不面对的问题。"),
 P("开头·普遍看法", "It is commonly believed that ...", "人们普遍认为……", "引出大众观点，后面好接 however。"),
 P("开头·普遍看法", "Many people insist that ...", "很多人坚持认为……"),
 P("开头·时代背景", "In the last decades, advances in science and technology have made it possible for people to ...", "过去几十年，科技进步使人们能够……"),
 P("开头·意识觉醒", "An increasing number of people are beginning to realize that ...", "越来越多的人开始意识到……"),
 P("开头·时代背景", "With the development of science and technology, people in growing numbers are beginning to believe that ...", "随着科技发展，越来越多的人开始相信……"),
 P("开头·观点分歧", "People's views on ... vary from person to person. Some hold that ..., however, others believe that ...", "人们对……的看法因人而异。有人认为……，然而另一些人认为……"),
 P("开头·普遍看法", "A lot of people seem to think that ...", "很多人似乎认为……"),
 P("开头·观点分歧", "Attitudes towards ... vary from person to person.", "对……的态度因人而异。"),
 P("开头·观点分歧", "Different people hold different attitudes towards ...", "不同的人对……持不同态度。"),
 P("开头·争议", "There has been a good deal of controversy as to whether ...", "关于是否……一直存在很大争议。"),
 P("开头·严重问题", "There is no denying the fact that ... is an extremely serious problem.", "不可否认，……是一个极其严重的问题。"),
 P("开头·被忽视", "People seem to fail to take into account the fact that ...", "人们似乎忽视了……这一事实。"),
 P("开头·问题待解", "Unfortunately, an increasing number of more serious problems remain to be solved.", "不幸的是，越来越多更严重的问题仍待解决。"),
 P("开头·抱怨增多", "These days, people in growing numbers are beginning to complain that ...", "如今，越来越多的人开始抱怨……"),
 # 结尾
 P("结尾·综合归纳", "Taking into account all these factors, we may reasonably come to the conclusion that ...", "综合考虑所有这些因素，我们可以合理得出结论：……"),
 P("结尾·利弊并存", "There is no doubt that ... has its drawbacks as well as merits.", "毫无疑问，……既有优点也有缺点。"),
 P("结尾·呼吁措施", "In view of the seriousness of this problem, effective measures should be taken to ...", "鉴于问题的严重性，应采取有效措施来……"),
 P("结尾·离不开", "All in all, we cannot live without ..., but at the same time we must try to find out new ways to cope with the problems that would arise.", "总之，我们离不开……，但同时必须寻找新办法应对可能出现的问题。"),
 P("结尾·该行动了", "It is high time to take the advice of ... and to put special emphasis on the improvement of ...", "该是采纳……建议、特别重视改进……的时候了。"),
 P("结尾·停止趋势", "It is high time that we put an end to the trend.", "该是我们终止这一趋势的时候了。"),
 P("结尾·应予重视", "There is no doubt that enough attention must be paid to the problem of ...", "毫无疑问，必须对……问题给予足够重视。"),
 P("结尾·条件必要", "Obviously, if we want to do something ..., it is essential that ...", "显然，如果我们想做某事，很重要的是……"),
 P("结尾·唯一路径", "Only in this way can we ...", "只有这样，我们才能……", "倒装句，放在结尾很有力。"),
 P("结尾·必须认识", "It must be realized that ...", "必须认识到……"),
 P("结尾·不加控制", "Obviously, if we don't control the problem, the chances are that ... will put us in danger.", "很明显，如果我们不控制这一问题，……很可能让我们陷入危险。"),
 P("结尾·除非措施", "No doubt, unless we take effective measures, it is very likely that ...", "毫无疑问，除非我们采取有效措施，否则很可能……"),
 P("结尾·紧迫", "It is urgent that immediate measures should be taken to stop the situation.", "紧迫的是，应立即采取措施阻止事态发展。"),
 P("结尾·立场", "From my point of view, it is more reasonable to support the first opinion rather than the second.", "在我看来，支持第一种观点比支持第二种更合理。"),
 P("结尾·不完全同意", "I cannot entirely agree with the idea that we should take extreme measures to stop the situation.", "我不能完全同意采取极端措施来阻止事态发展的观点。", "原文有表述问题，这里取通顺版本。"),
 P("结尾·站队", "Personally, I am standing on the side of ...", "就个人而言，我站在……一边。"),
 P("结尾·深信", "From what has been discussed above, I am fully convinced that ...", "综上所述，我深信……"),
 P("结尾·利大于弊", "I sincerely believe that the advantages of ... outweigh the disadvantages.", "我真诚地认为，……的利大于弊。", "原文语序已修正。"),
 P("结尾·建议", "In my opinion, it is advisable to do ... rather than to do ...", "在我看来，做……比做……更可取。"),
 P("结尾·建议", "Here are some suggestions for handling ...", "以下是处理……的一些建议。"),
 P("结尾·最佳办法", "The best way to solve the troubles is ...", "解决这些麻烦的最佳办法是……"),
 P("结尾·理智看待", "In conclusion, we must take into account this problem rationally and place more emphasis on ...", "总之，我们应理智看待这一问题，更加重视……"),
 P("结尾·已有办法", "People have figured out many ways to solve this problem.", "人们已经想出了许多解决这个问题的办法。"),
 P("结尾·就某事而言", "As far as something is concerned ...", "就某事而言……"),
 P("结尾·显而易见", "It was obvious that ...", "很明显……"),
 P("结尾·让步反驳", "It may be true that ..., but it doesn't mean that ...", "可能……是对的，但这并不意味着……", "让步+反驳，议论文最好用的一类。"),
 P("结尾·让步反驳", "It is natural to believe that ..., but we shouldn't ignore that ...", "认为……很自然，但我们不应忽视……"),
 P("结尾·无证据", "There is no evidence to suggest that ...", "没有证据表明……"),
 P("结尾·得出结论", "From what has been discussed above, we may safely draw a conclusion that ...", "通过上面的讨论，我们不难得出结论：……"),
 P("结尾·真正重要", "What really counts is ...", "真正重要的是……", "原文已修正为常用表达。"),
 P("结尾·真正重要", "What is really important is ...", "真正重要的是……"),
 # 十页纸进阶
 P("进阶·双主题", "We mistakenly believe X or Y alone can drive success. Actually they are closely linked like a DNA helix, forming complementary elements to promote progress.", "我们误以为单凭 X 或 Y 其一便能促成成功。事实上二者如同 DNA 双螺旋般缠绕相依，互补共生，共同助推发展。", "双主题文章中间段必须分开写 X 和 Y。", "26.10.24十页纸语料补充"),
 P("进阶·双主题", "Without X, Y remains an ungrounded utopia. Lacking Y, X becomes a soulless machine.", "缺了 X，Y 便是悬在空中的乌托邦；少了 Y，X 则沦为没有灵魂的冰冷机器。", "紧接上一句，两句一组。", "26.10.24十页纸语料补充"),
 P("进阶·社会问题归因", "The dilemma, however, stems less from external factors than from a mismatch of priorities, where the pursuit of immediate gratification consistently overshadows the cultivation of X.", "但这一困境并非主要源于外界因素，而是价值取舍失衡：一味追逐即时满足，忽视了 X 的培养。", "社会问题类文章“分析原因”段。", "26.10.24十页纸语料补充"),
 P("进阶·辩证适度", "Like all virtues, X proves its value not from excess but from proportion.", "与所有美德一样，X 的价值不在于极致，而在于适度。", "后面接“适度有益、过度有害”。", "26.10.24十页纸语料补充"),
 P("进阶·引出措施", "To navigate this complexity, we must turn inward and prioritize X.", "为了应对这种复杂局面，我们必须向内探求，优先考虑 X。", "社会问题类文章由分析转入措施。", "26.10.24十页纸语料补充"),
 P("进阶·下定义", "While many individuals tend to equate X with Y, its true meaning transcends such a narrow understanding — X represents ...", "尽管不少人容易将 X 等同于 Y，但其真正内涵已超越这种狭隘认知——X 意味着……", "首段“下定义法”，学有余力再用。", "26.10.24十页纸语料补充"),
 P("进阶·知识迁移", "X bridges the gap between theory and practice, enabling learners to transfer it across disciplines and deploy it with precision in unfamiliar contexts.", "X 弥合了理论与实践之间的鸿沟，使学习者能将其迁移至不同学科，在陌生情境中精准调用。", "学习类论点。", "26.10.24十页纸语料补充"),
 P("进阶·内化知识", "The real value of genuine learning lies in the gradual process through which knowledge is absorbed, examined and eventually transformed into judgment, vision and practical competence.", "学习的真正价值在于一个逐步积累的过程：知识被吸收、审视，最终转化为判断力、视野和实践能力。", "学习类论点。", "26.10.24十页纸语料补充"),
 P("进阶·社会平等", "Progress that leaves the vulnerable behind is not progress at all.", "将弱势群体抛在身后的发展，根本称不上进步。", "短句开头，后面接 X 的作用。", "26.10.24十页纸语料补充"),
 P("进阶·环境", "As environmental challenges grow increasingly urgent, X reminds us that individual choices are never truly isolated — each decision carries an ecological footprint.", "随着环境问题日趋紧迫，X 提醒我们个人选择从来不是孤立的——每个决定都会留下生态印记。", "环境类论点。", "26.10.24十页纸语料补充"),
 P("进阶·传统文化", "As globalization accelerates, cultural heritage risks being lost in the tide of uniform trends.", "随着全球化加速，文化遗产面临在同质化浪潮中消亡的风险。", "文化类论点。", "26.10.24十页纸语料补充"),
 P("进阶·发展成果", "Economic progress becomes meaningful when it is translated into better everyday life.", "经济进步只有转化为更好的日常生活时才真正有意义。", "民生/经济类论点。", "26.10.24十页纸语料补充"),
 P("进阶·公共供给", "As society moves beyond the satisfaction of basic material needs, the inadequacy of public support becomes more visible.", "当社会超越基本物质需求之后，公共供给不足的问题就更加明显。", "万能原因分析，生活水平提升类话题。", "26.10.24十页纸语料补充"),
 P("进阶·关系表层化", "The problem lies in the growing superficiality of modern interaction: people may exchange messages more frequently than before, yet genuine attention and emotional presence are often missing.", "问题在于现代交往日益表层化：人们也许更频繁地交换信息，但真正的关注与情感在场却常常缺失。", "人际关系类问题。", "26.10.24十页纸语料补充"),
 P("进阶·责任外部化", "A deeper problem is the tendency to externalize responsibility: individuals may enjoy convenience, while leaving the costs of care and repair to families and society at large.", "更深层的问题在于责任外部化：个体享受便利，却把照料与修复的成本留给家庭和社会。", "按题目替换“享受的东西”和“成本”。", "26.10.24十页纸语料补充"),
 P("进阶·自信", "Confidence enables individuals to approach challenges positively, remain resilient in the face of difficulties, and pursue opportunities with determination.", "自信使人积极直面挑战、受挫时坚韧不拔，并坚定地抓住机遇。", "能力类论点。", "26.10.24十页纸语料补充"),
 P("进阶·道德判断", "In an increasingly complex world, ethical judgment equips individuals to navigate moral dilemmas, resist short-term temptations, and make decisions aligned with public morality.", "在日趋复杂的社会环境中，道德判断力帮助人们化解道德困境、抵制短期诱惑，做出契合社会公德的抉择。", "能力类论点。", "26.10.24十页纸语料补充"),
 P("进阶·自我认知", "At its core, X fosters a deeper self-discovery — an understanding of one's own strengths, limitations and values, which serves as the foundation for purposeful living.", "本质上，X 深化个体的自我发现，即对自身优势、局限与价值观的清醒把握，这是有目标地生活的基础。", "能力类论点。", "26.10.24十页纸语料补充"),
 P("进阶·信息爆炸", "The continuous floods of information from various sources have made it increasingly difficult to distinguish between fact and fiction.", "各类信息源源不断涌入，人们愈发难以分辨真伪。", "科技类论点。", "26.10.24十页纸语料补充"),
 P("进阶·人际疏离", "Despite enhancing connectivity, technology has paradoxically contributed to weakened face-to-face interaction and growing social isolation.", "科技提升了互联互通，却反常地弱化了面对面交流，加剧了社会疏离。", "科技类论点。", "26.10.24十页纸语料补充"),
 P("进阶·职场变化", "Automation and artificial intelligence are reshaping labor markets, potentially displacing workers whose skills become outdated.", "自动化与人工智能重塑劳动力市场，部分技能落伍的劳动者或将被取代。", "科技类论点。", "26.10.24十页纸语料补充"),
 P("进阶·过度沉迷", "The addictive nature of many digital platforms may encourage excessive use, which reduces productivity, erodes independent thinking and undermines concentration.", "众多数字平台自带成瘾属性，易造成过度使用，进而降低效率、弱化独立思考、损害专注力。", "科技类论点。", "26.10.24十页纸语料补充"),
]

# 套句总结（图片型 PDF，经 OCR 后人工清洗）
OCR_SRC = "四六级作文套句总结（OCR 清洗）"
SETS = [
 ("开头·现象", "In recent years, ... has attracted increasing attention from college students.", "近年来，……越来越受到大学生的关注。"),
 ("开头·现象", "Nowadays, ... is no longer a rare sight on campus.", "如今，……在校园里已屡见不鲜。"),
 ("开头·现象", "With the rapid development of ..., ... has become an inseparable part of our daily lives.", "随着……的快速发展，……已成为日常生活中不可或缺的一部分。"),
 ("开头·现象", "There is a growing awareness that ...", "人们越来越意识到……"),
 ("开头·两种观点", "When it comes to ..., opinions vary from person to person.", "谈及……，人们看法不一。"),
 ("开头·现象", "... has been playing an increasingly important role in our daily lives, bringing both benefits and challenges.", "……在日常生活中扮演着越来越重要的角色，既带来好处，也带来挑战。"),
 ("开头·两种观点", "Some people argue that ..., while others maintain that ...", "有些人认为……，而另一些人则坚持认为……"),
 ("开头·两种观点", "Views on ... differ sharply: some regard it as a blessing, while others see it as a curse.", "人们对……的看法截然不同：有人视之为福音，有人视之为祸害。"),
 ("开头·两种观点", "While some people welcome ..., others remain cautious about it.", "有些人对……表示欢迎，另一些人则持谨慎态度。"),
 ("开头·引用", "The saying \"...\" reveals a simple truth: ...", "谚语“……”揭示了一个简单的道理：……"),
 ("开头·引用", "The statement that ... deserves our serious attention.", "……这一说法值得我们认真思考。"),
 ("开头·立论", "I fully agree with the view that ...", "我完全赞同……这一观点。"),
 ("开头·建议", "I am writing to offer my suggestions on how to ...", "我写信就如何……提出建议。"),
 ("开头·建议", "In response to the university's call for proposals on ..., I would like to share a few practical ideas.", "为响应学校关于……的征询，我想分享几点切实可行的建议。"),
 ("开头·建议", "If adopted, these suggestions would greatly improve ...", "这些建议若被采纳，将大大改善……"),
 ("主体·原因", "Several factors contribute to this phenomenon.", "这一现象由多种因素造成。"),
 ("主体·原因", "The reasons behind this trend are twofold.", "这一趋势背后的原因有两个方面。"),
 ("主体·原因", "This can be attributed to ..., and above all to ...", "这可以归因于……，尤其是……"),
 ("主体·原因", "First and foremost, ...; in addition, ...; more importantly, ...", "首先，……；其次，……；更重要的是，……"),
 ("主体·原因", "One major reason is that ..., which ...", "一个主要原因是……，这……"),
 ("主体·原因", "This is largely because ...", "这在很大程度上是因为……"),
 ("主体·举例", "A case in point is ...", "……就是一个恰当的例子。"),
 ("主体·举例", "Take ... as an example.", "以……为例。"),
 ("主体·举例", "This is well illustrated by ...", "……充分说明了这一点。"),
 ("主体·举例", "My own experience is a good example.", "我自己的经历就是一个很好的例子。"),
 ("主体·利弊", "... is a double-edged sword.", "……是一把双刃剑。"),
 ("主体·利弊", "On the positive side, ...; on the negative side, ...", "从积极方面看，……；从消极方面看，……"),
 ("主体·利弊", "The benefits are obvious, yet the potential risks should not be ignored.", "好处显而易见，但潜在风险也不容忽视。"),
 ("主体·利弊", "While ... brings convenience, it may also ...", "尽管……带来便利，也可能……"),
 ("主体·利弊", "Whether ... is a blessing or a curse depends on how we use it.", "……是福是祸，取决于我们如何使用它。"),
 ("主体·让步", "Admittedly, ..., but it does not follow that ...", "诚然，……，但这并不意味着……"),
 ("主体·对比", "Compared with ..., ... has its own advantages.", "与……相比，……有其自身优势。"),
 ("主体·让步", "It is true that ..., but we should not lose sight of ...", "诚然……，但我们不应忽视……"),
 ("主体·对比", "Rather than ..., we should ...", "与其……，不如……"),
 ("主体·措施", "To address this issue, several measures can be taken.", "为解决这一问题，可以采取几项措施。"),
 ("主体·措施", "It is advisable for the university to ...", "学校最好……"),
 ("主体·措施", "One practical step is to ...", "一个切实可行的做法是……"),
 ("主体·措施", "The university could set up ... to ...", "学校可以设立……来……"),
 ("主体·措施", "Students should be encouraged to ...", "应鼓励学生……"),
 ("主体·措施", "These suggestions, if implemented, would ...", "这些建议若得以实施，将……"),
 ("主体·措施", "It is high time that we took effective action to ...", "是我们采取有效措施……的时候了。"),
 ("结尾·总结", "In conclusion, ... is not a problem that can be solved overnight, but it deserves our immediate attention.", "总之，……并非一朝一夕能解决的问题，但值得我们立即关注。"),
 ("结尾·总结", "To sum up, the key lies in ...", "总之，关键在于……"),
 ("结尾·总结", "Taking all these factors into account, we may safely conclude that ...", "综合考虑这些因素，我们可以有把握地得出结论：……"),
 ("结尾·呼吁", "It is everyone's responsibility to ...", "每个人都有责任……"),
 ("结尾·呼吁", "Only in this way can we build a more ... campus.", "只有这样，我们才能建设一个更加……的校园。"),
 ("结尾·呼吁", "It is high time that we ...", "是我们……的时候了。"),
 ("结尾·呼吁", "I am confident that, with joint efforts, ... will ...", "我相信，通过共同努力，……将会……"),
 ("结尾·呼吁", "With the concerted efforts of all parties, ... is bound to ...", "在各方的共同努力下，……必将……"),
]
for fn, en, cn in SETS:
    patterns.append(P(fn, en, cn, "", OCR_SRC))
for i, p in enumerate(patterns, 1):
    p["id"] = "p%d" % i

data = {
 "meta": {
  "title": "六级写作专项",
  "source": "作文文件夹 7 份资料：套句总结、模板与分论点、万能素材库、100 组搭配、加分句式、十页纸语料补充、写作预测",
  "counts": {"patterns": len(patterns), "phrases": len(phrases), "materials": len(materials),
             "templates": len(templates), "structures": len(structures), "topics": len(topics)},
 },
 "templates": templates, "structures": structures, "patterns": patterns,
 "phrases": phrases, "materials": materials, "topics": topics,
}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump(data, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print("counts:", data["meta"]["counts"])
print("bytes:", os.path.getsize(OUT))
print("sample phrase:", phrases[:2])
print("sample topic:", topics[0]["title"], "| model chars", len(topics[0]["model"]))
