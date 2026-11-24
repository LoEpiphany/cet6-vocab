# 六级词汇背诵工具（阅读词汇 + 翻译词汇）

一个纯本地的六级词汇背诵工具。整个应用打包成 **单个 HTML 文件**，双击就能在浏览器里用，学习进度保存在浏览器本地（localStorage），不联网、不上传、不需要注册。

## 这是什么

- 词库来自两套自整理的六级阅读词汇讲义：**第一册（阅读词汇 2017–2026）419 词**、**第二册（仔细阅读 2021–2026）1945 词**，去重合并后共 **2089 词**（重合 275 词，重合词只计一次并标记跨课程）。
- 另外收录 **1325** 条六级翻译词汇，分为「术语分类 989 / 六大主题 204 / 高频重复 179」三个模块。
- 词汇按考频与难度分为 3 档：第 1 档 157 词、第 2 档 410 词、第 3 档 1522 词。
- 阅读词与翻译词使用**两套不同的复习间隔规则**，因为两者的考察方式不同（认词 vs. 会译）。

## 怎么用

- **本地打开**：直接双击 `outputs/index.html`。
- **线上地址**：<https://37lig1w51qv5w5oqy4o.traesite.cn>
- **手机**：用手机浏览器打开同一地址即可，界面按 390×844 竖屏做过适配，主要操作按钮都在拇指可及区。
- **进度备份**：设置里可把进度导出成 JSON 文件，换浏览器/换设备时再导入，覆盖进度、错题、收藏、已熟词等。
- `outputs/学习手册.html` 是配套的使用与设计说明，讲清楚了题型、算法、词表字段口径，和主页面互相链接。

## 主要功能

- **分课程词库**：第一册 419 / 第二册 1945 / 合并 2089，每门课独立统计，也可合并为总课学习。
- **卡片与多题型自测**：认词卡、选择题、拼写、句子填空、翻译等，交替出现；答错会展示所选义项与正确义项的差别，并要求手写订正。
- **错题与加强队列**：答错的词自动进入加强队列，优先重练。
- **间隔重复分档与退休**：阅读词 0–7 阶（间隔 1/3/7/14/30/60 天），连对达标后退休；翻译词 0–4 阶（间隔 1/2/4/8 天）。退休词只退出日常队列，仍可在词库中查询，答错会被拉回。
- **手动标熟与收藏**：手动标「熟」的优先级高于算法推断，可撤销；任意词可收藏并单独组轮复习。
- **故事阅读**：把词表词汇编进英文短文，正文里点任意单词即可查词。
- **翻译三模块**：术语分类、六大主题、高频重复，各用不同的练法。
- **点词即查词典**：全站正文（故事、例句、题干、选项、搭配、手册）任意点词弹出词性、释义、音标，标注是否属于背诵词库；支持词形还原。词典与背诵词库分开存储，首次查词才加载，不拖慢首屏。
- **20 分钟脑力小游戏**：5 种小游戏轮流出现，单局 30 秒上下，可跳过或永久关闭。
- **作文语料模块**：121 条万能句式、99 条词组、98 条素材、6 套模板等，来自自备的作文讲义。

## 目录结构

```
cet6-vocab/
├─ outputs/                  # 成品，双击 index.html 即可使用
│  ├─ index.html             # 主应用（数据已内联，约 1.2MB）
│  ├─ 学习手册.html           # 配套使用手册
│  ├─ dict.js                # 查词词典（ECDICT 子集，首次点词才加载）
│  ├─ vocab.json             # 阅读词表结构化数据
│  ├─ vocab.csv              # 同一份词表的表格版，方便用 Excel 查看
│  ├─ translate.json         # 翻译词库数据
│  ├─ essay.json             # 作文语料数据
│  └─ ECDICT-LICENSE.txt     # 词典数据的 MIT 许可全文
└─ work/                     # 构建脚本与源模板（不参与运行）
   ├─ app_template.html      # 主页面模板（数据用占位符注入）
   ├─ trans_app.js           # 翻译模块脚本
   ├─ essay_app.js           # 作文模块脚本
   ├─ focus_app.js           # 专注/计时相关脚本
   ├─ manual_template.html   # 学习手册模板
   ├─ build_app.py           # 合成 outputs/index.html
   ├─ build_manual.py        # 生成 outputs/学习手册.html
   ├─ build_data.py          # 生成 vocab.json / vocab.csv
   ├─ build_translate.py     # 生成 translate.json
   ├─ build_essay.py         # 生成 essay.json
   ├─ build_dict.py          # 从 ECDICT 抽取子集生成 dict.js
   ├─ merge_courses.py       # 合并第二册与第一册，处理重合词
   ├─ download_ecdict.py     # 下载 ECDICT 词典源文件
   ├─ parse_*.py / extract_*.py / ocr_*.py  # PDF 素材提取（裁切、OCR、文本解析）
   └─ verify_*.js / debug_*.js              # 开发期的浏览器回归脚本
```

被 `.gitignore` 排除的内容：`work/ocrlibs*`（约 630MB 的第三方 OCR 运行库）、`node_modules`、`work/c2`、`work/crops`、`work/pages` 等中间图与提取文本、截图与日志。这些都是可重新生成的产物，不进仓库。

## 数据来源与许可

- **词典数据**：来自 [ECDICT](https://github.com/skywind3000/ECDICT)（作者 skywind3000 / Linwei），**MIT License**，许可全文见 [outputs/ECDICT-LICENSE.txt](outputs/ECDICT-LICENSE.txt)。当前 `dict.js` 收录 16389 个词条、20002 个词形、236 条短语，释义与音标均直接取自 ECDICT，未自行编造。
- **词表数据**：阅读词、翻译词、作文语料均来自使用者**自备的课程 PDF 讲义**，经提取、去重、结构化后得到。这些 PDF 属于课程资料，**未随本仓库分发**；仓库中只包含整理后的词表与成品页面。

## 构建方式

所有脚本在 `work/` 下，Python 3 运行。注意 `build_app.py`、`build_data.py`、`extract_js.py` 里写死了本机绝对路径（`base` / `outdir` 两行），换机器先改这两行；其余脚本用 `__file__` 定位，可直接跑。

大致顺序：

```powershell
# 1. 素材提取（前提：本地有 PDF 素材，且装了 OCR 相关依赖）
py work\parse_c2.py            # 细读册 → work/c2/*.json
py work\trans_parse.py         # 翻译讲义 → work/trans/parsed.json
py work\extract_essay.py       # 作文讲义 → work/essay_raw/*.txt

# 2. 词表与数据
py work\build_data.py          # → outputs/vocab.json、vocab.csv
py work\merge_courses.py       # 第二册合并进第一册，去重、标重合
py work\build_translate.py     # → outputs/translate.json
py work\build_essay.py         # → outputs/essay.json

# 3. 词典
py work\download_ecdict.py     # 下载 ecdict.csv（约 66MB，可断点续传）
py work\build_dict.py          # → outputs/dict.js

# 4. 成品
py work\build_app.py           # → outputs/index.html
py work\build_manual.py        # → outputs/学习手册.html
```

只想改样式文案、不动词库时，改 `work/app_template.html` 后跑一次 `build_app.py` 就够了。

## 许可

应用代码可自由参考使用；词表内容来自使用者自备讲义，请勿再分发原始课程资料。词典部分遵循 ECDICT 的 MIT 许可。
