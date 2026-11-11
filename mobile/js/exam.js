/* 期末题库：题库数据、首页、记忆库、汉译英、答题与结果 */

/* ============================================================
   期末题库：新视野读写 3 · Unit 1–4 的「3 Words in use」与「6 Expressions in use」
   题面与选项逐题照抄自 新视野读写3_期末题库.md
   ============================================================ */
const EXAM_KEY = 'wc_exam_v1';
const EXAM_UNITS = {
  1:'The digital age: Are we ready?',
  2:'Life stories',
  3:'Let\'s go',
  4:'When work is a pleasure'
};
const EXAM_GROUPS = [
  { id:'u1w', unit:1, kind:'word', title:'Unit 1 · Words in use', ref:'Section A · 教材 p.11',
    bank:['alter','assess','collaborate','discrete','furious','immersed','sacred','scenario','substitute','velocity'],
    items:[
      { q:1, b:1, s:'He entered the film industry, taking small roles and writing ___ for a famous film company.',
        o:['scenario','scenarios','scenic','scenery'], a:1,
        n:'scenario 剧本、情节梗概；这里泛指多部，用复数 scenarios' },
      { q:2, b:1, s:'In doing translation, one should not ___ the meaning of the original to suit one\'s own taste.',
        o:['alters','altered','altar','alter'], a:3,
        n:'alter 改变；should not 后接动词原形' },
      { q:3, b:1, s:'Without warning, there was a(n) ___ storm and the waves swept over the boat.',
        o:['furiously','fury','furious','curious'], a:2,
        n:'furious 猛烈的、狂暴的；修饰 storm' },
      { q:4, b:1, s:'Doctors consider it their ___ duty to protect and save the lives of their patients.',
        o:['sacred','scared','scarred','secret'], a:0,
        n:'sacred 神圣的；sacred duty 神圣的职责' },
      { q:5, b:1, s:'The question was how to maintain that kind of ___ for a vehicle that weighed considerably more than 3,300 pounds.',
        o:['velocities','veracity','velocity','vicinity'], a:2,
        n:'velocity 速度（正式用词）；维持那种速度' },
      { q:6, b:1, s:'They are able to take ___ ideas, thoughts, and generalizations and weave them into meaningful patterns.',
        o:['discrete','discreet','discreetly','discretion'], a:0,
        n:'discrete 分离的、离散的；别和 discreet（谨慎的）混淆' },
      { q:7, b:1, s:'They needed someone to ___ for a pianist who couldn\'t make it, and her professor recommended her.',
        o:['substituting','substituted','substitution','substitute'], a:3,
        n:'substitute for 替代…；to 后接动词原形' },
      { q:8, b:1, s:'Let\'s embrace Chinese culture this summer and get ___ in the richness of traditional Chinese music and dance!',
        o:['immerse','immersing','immersed','immersion'], a:2,
        n:'get immersed in 沉浸于…；过去分词作表语' },
      { q:9, b:1, s:'The Chinese scientific community will ___ with their international peers in frontier science research.',
        o:['collaborate','collaborated','collaborating','collaboration'], a:0,
        n:'collaborate with 与…合作；will 后接原形' },
      { q:10, b:1, s:'At the end of the semester, students will be ___ on their proficiency in writing and speaking in English.',
        o:['assess','assessed','assesses','assessing'], a:1,
        n:'be assessed on 被考核…；被动语态用过去分词' }
    ] },
  { id:'u1e', unit:1, kind:'expr', title:'Unit 1 · Expressions in use', ref:'Section A · 教材 p.13',
    bank:['add up to','dumb ... down','in the company of','lay ... out','make room for','pick ... up','plunge into','wipe ... out'],
    items:[
      { q:1, b:1, s:'The cheerful guy who wore virtual reality glasses ___ the virtual world.',
        o:['plunge into','plunging into','plunged into','plunges into'], a:2,
        n:'plunge into 投身于；叙述过去的事用过去式' },
      { q:2, b:1, s:'It has been the tradition in China that elderly people live in a familiar environment, preferably ___ their children.',
        o:['in the company of','in the charge of','in the course of','in the care of'], a:0,
        n:'in the company of 在…陪伴下；介词短语不变形' },
      { q:3, b:1, s:'Chinese isn\'t a subject that can be ___ in a month, and you can\'t accomplish your goal of mastering the language unless you work at it for years.',
        o:['picking up','pick up','picked on','picked up'], a:3,
        n:'pick up（不经意地）学会；被动 can be + 过去分词' },
      { q:4, b:1, s:'He ___ the map across the table and took another look at it.',
        o:['laid out','lay out','laying out','lays out'], a:0,
        n:'lay out 铺开、摊开；过去式 laid out（不是 lied）' },
      { q:5, b:1, s:'The live music, the wild dancing, and the amazing lights all ___ an exciting theatrical experience.',
        o:['add up','add up to','add to','add in'], a:1,
        n:'add up to 合起来构成…；一般现在时或过去式都算对' },
      { q:6, b:1, s:'Since space is limited, we sometimes have to say goodbye to old things in order to ___ new items.',
        o:['make room to','make way for','make room for','make up for'], a:2,
        n:'make room for 为…腾出空间；in order to 后接原形' },
      { q:7, b:1, s:'The magazine has a reputation for being very thorough, although critics claim that it has been ___ in recent years to cater to the mass market.',
        o:['dumbing down','dumb down','dumbed up','dumbed down'], a:3,
        n:'dumb down 使通俗化/降低难度；has been + 过去分词' },
      { q:8, b:1, s:'This marks another historic step toward ___ the absolute poverty that has plagued the nation for centuries.',
        o:['wipe out','wiping out','wiped out','wiping off'], a:1,
        n:'wipe out 彻底消除；toward 是介词，后接动名词' }
    ] },
  { id:'u2w', unit:2, kind:'word', title:'Unit 2 · Words in use', ref:'Section A · 教材 p.38',
    bank:['appoint','complexity','dense','escort','expansion','frail','maintenance','patrol','realm','vague'],
    items:[
      { q:1, b:1, s:'The eastern area is three times bigger than the western area, featuring ___ tropical rainforests and giant waterfalls.',
        o:['dense','densely','density','denser'], a:0,
        n:'dense 茂密的；dense rainforests 茂密的热带雨林' },
      { q:2, b:1, s:'In the meeting, a new manager was ___ to take charge of the project which was in financial difficulties.',
        o:['appoint','appointing','appointment','appointed'], a:3,
        n:'be appointed to do 被任命去做；被动用过去分词' },
      { q:3, b:1, s:'Services such as cooking, cleaning, and ___ the elderly to hospitals are in high demand.',
        o:['escort','escorting','escorted','escorts'], a:1,
        n:'escort 护送；与 cooking / cleaning 并列，用动名词 escorting' },
      { q:4, b:1, s:'A high-tech police car capable of immediately detecting stolen cars, disqualified drivers, and other offenses is ___ the roads.',
        o:['patrol','patrolled','patrolling','patrols'], a:2,
        n:'patrol 巡逻；is + 现在分词构成现在进行时' },
      { q:5, b:1, s:'Around 300 workers and engineers are working hard for the timely delivery of the project despite its ___ .',
        o:['complex','complexion','complexity','complexities'], a:2,
        n:'complexity 复杂性；its 后接名词' },
      { q:6, b:1, s:'A researcher said China\'s fast economic ___ in recent years has made great contributions to world economic growth.',
        o:['expansion','expanding','expansions','expanse'], a:0,
        n:'expansion 扩张、扩展；economic expansion 经济扩张' },
      { q:7, b:1, s:'That visit was hard work because he spoke no Chinese and had only a(n) ___ plan of action.',
        o:['vaguely','vague','vagueness','vaguer'], a:1,
        n:'vague 含糊的、不明确的；a vague plan 模糊的计划' },
      { q:8, b:1, s:'China\'s first domestically built polar icebreaker Xuelong 2 has completed its ___ period and will soon set out on a mission again.',
        o:['maintained','maintain','maintaining','maintenance'], a:3,
        n:'maintenance 维护、保养；maintenance period 维护期' },
      { q:9, b:1, s:'A number of people believe that genuine friendships can develop in both the digital and physical ___ , with the boundaries between the two continuing to blur.',
        o:['realm','realize','real','reel'], a:0,
        n:'realm 领域、范围；教材答案用单数 realm，写复数 realms 也说得通' },
      { q:10, b:1, s:'She had to take care of the whole family, two children and two ___ elderly people, all by herself.',
        o:['frailly','frailty','frail','frailer'], a:2,
        n:'frail（尤指老人）虚弱的；frail elderly people 体弱的老人' }
    ] },
  { id:'u2e', unit:2, kind:'expr', title:'Unit 2 · Expressions in use', ref:'Section A · 教材 p.40',
    bank:['along with','curious about','in charge of','loaded with','set off','take place','trade with','view ... as'],
    items:[
      { q:1, b:1, s:'We can enable our students to be ___ their own learning by creating interesting, open-ended tasks which they can finish by themselves.',
        o:['in the charge of','in terms of','in charge of','in need of'], a:2,
        n:'in charge of 负责、掌管；be 后接介词短语' },
      { q:2, b:1, s:'The festival, which falls on the ninth day of the ninth month on the lunar calendar, is ___ an occasion to pay respect to the elderly.',
        o:['view as','viewing as','views as','viewed as'], a:3,
        n:'view ... as 把…视为；被动 is + 过去分词' },
      { q:3, b:1, s:'The Belt and Road Initiative raises the level of connectivity and cooperation among dozens of nations that have ___ China for years.',
        o:['trade with','traded with','trading with','trades with'], a:1,
        n:'trade with 与…做贸易；现在完成时 have + 过去分词' },
      { q:4, b:1, s:'From the smallest birthday party to the largest concert, special events ___ every day in these parks.',
        o:['take over','take part','take up','take place'], a:3,
        n:'take place 举行、发生；every day 用一般现在时' },
      { q:5, b:1, s:'The train was fully ___ 50 containers of goods including glass bottles, canned food, and medical supplies.',
        o:['load with','loading with','loads with','loaded with'], a:3,
        n:'be loaded with 装载着…；被动搭配' },
      { q:6, b:1, s:'Last month, the polar icebreaker ___ from the port for its new scientific expedition to the Antarctic.',
        o:['set off','set out','set in','set up'], a:0,
        n:'set off 出发、启程；过去式仍是 set off（不规则动词不变形）' },
      { q:7, b:1, s:'We have long been ___ what really goes on inside the space station and the video satisfied our curiosity.',
        o:['curious for','curious about','curious of','curious in'], a:1,
        n:'be curious about 对…好奇；have been 后接形容词短语' },
      { q:8, b:1, s:'This is a double room and you can stay here ___ your friend.',
        o:['along for','along to','along with','along by'], a:2,
        n:'along with 和…一起；介词短语不变形' }
    ] },
  { id:'u3w', unit:3, kind:'word', title:'Unit 3 · Words in use', ref:'Section A · 教材 p.66',
    bank:['ambiguity','cluster','compulsory','contemplate','drawback','globalize','groan','loosen','offset','stubborn'],
    items:[
      { q:1, b:1, s:'Thanks to its nine-year ___ education, China has one of the highest literacy rates in the world, which is a great achievement.',
        o:['compulsion','compulsive','compulsory','compulsorily'], a:2,
        n:'compulsory 义务的、强制的；compulsory education 义务教育' },
      { q:2, b:1, s:'He has been ___ leaving the studio for some time and will be moving on to “new adventures”.',
        o:['contemplating','contemplate','contemplated','contemplation'], a:0,
        n:'contemplate 考虑、盘算；has been + 现在分词' },
      { q:3, b:1, s:'Standards should be ___ to include more people in more types of jobs to increase diversity.',
        o:['loosen','loosening','looseness','loosened'], a:3,
        n:'loosen 放宽（标准）；被动 be + 过去分词' },
      { q:4, b:1, s:'In the 1970s, the firm was restructured to ___ the business and pursue new areas of growth.',
        o:['globalizing','globalize','globalized','global'], a:1,
        n:'globalize 使（业务）全球化；to 后接动词原形' },
      { q:5, b:1, s:'However, your current losses should soon be ___ by gains — the fund will produce a positive return of 11.6 percent over a nine-month period.',
        o:['offsets','offsetting','offset','set off'], a:2,
        n:'offset 抵消；be offset by 被…抵消（offset 三态同形）' },
      { q:6, b:1, s:'She pushed herself up into a sitting position to look around but immediately ___ in pain and fell back onto the blanket.',
        o:['groan','groaning','grown','groaned'], a:3,
        n:'groan 呻吟；与 pushed / fell 并列用过去式' },
      { q:7, b:1, s:'My mom was very ___ and unwilling to accept advice, but she became softer and nicer after reading this book.',
        o:['stubbornly','stubborn','stubbornness','sturdy'], a:1,
        n:'stubborn 固执的；was 后接形容词' },
      { q:8, b:1, s:'On weekends, the school parking lot is almost empty except that a few cars ___ near the entrance.',
        o:['cluster','clustering','clutch','clustered'], a:0,
        n:'cluster 聚集；主语 cars 是复数，一般现在时用原形' },
      { q:9, b:1, s:'In the photographer\'s finest pictures there is also a degree of ___ , which allows them to be interpreted in a variety of ways.',
        o:['ambition','ambiguities','ambiguity','ambiguous'], a:2,
        n:'ambiguity 模棱两可；a degree of + 名词' },
      { q:10, b:1, s:'The chief ___ to farming in these districts is the considerable proportion of stony ground.',
        o:['drawing','drawback','drawbacks','draw back'], a:1,
        n:'drawback 缺点、不利因素；the chief drawback to … 的主要弊端' }
    ] },
  { id:'u3e', unit:3, kind:'expr', title:'Unit 3 · Expressions in use', ref:'Section A · 教材 p.68',
    bank:['be open to','endow ... with','make up for','mingle ... with','more often than not','on sale','settle for','trade ... for'],
    items:[
      { q:1, b:1, s:'They should be more patient, and willing to ___ something less than their dream job at first.',
        o:['settle down','settle for','settle up','settle in'], a:1,
        n:'settle for 勉强接受；willing to 后接原形' },
      { q:2, b:1, s:'The situations these explorers face are various, sometimes unpredictable, and ___ , challenging.',
        o:['more often than not','more often than usual','more or less','sooner or later'], a:0,
        n:'more often than not 往往、多半；插入语，不变形' },
      { q:3, b:1, s:'As the voyage progressed, the soft, sweet tropical air ___ the fresh smell of the sea and gave the crew a delightful experience of ocean travel.',
        o:['mingle with','mingling with','mingles with','mingled with'], a:3,
        n:'mingle with 与…混合；与 progressed / gave 并列用过去式' },
      { q:4, b:1, s:'I bought too much milk so I ___(1) her my extra gallons ___(2) her bread.',
        o:['trade','trading','traded','trades'], a:2,
        n:'trade ... for 用…换…；第一空填 traded（过去式）' },
      { q:4, b:2, s:'I bought too much milk so I ___(1) her my extra gallons ___(2) her bread.',
        o:['to','for','by','with'], a:1,
        n:'第二空填介词 for，构成 trade sth for sth' },
      { q:5, b:1, s:'You should learn to time your purchases so that you can buy the products when they\'re ___ and save money.',
        o:['on sale','in sale','for sale','on sales'], a:0,
        n:'on sale 打折出售；介词短语不变形' },
      { q:6, b:1, s:'You need to let them know that you ___ their ideas and that you will do what it takes to get things done.',
        o:['is open to','are opened to','are open for','are open to'], a:3,
        n:'be open to 愿意接受；主语 you → are open to' },
      { q:7, b:1, s:'Herbs have been used for centuries to ___(1) a whole range of foods ___(2) subtle flavors.',
        o:['endow','endowed','endowing','endows'], a:0,
        n:'endow ... with 赋予…以…；to 后接原形 endow' },
      { q:7, b:2, s:'Herbs have been used for centuries to ___(1) a whole range of foods ___(2) subtle flavors.',
        o:['by','with','for','to'], a:1,
        n:'第二空填 with，构成 endow sth with sth' },
      { q:8, b:1, s:'The new research indicates that doing enough exercise could ___ some of the unhealthy impacts of bad sleep.',
        o:['make up to','make for','make up for','make up with'], a:2,
        n:'make up for 弥补；could 后接原形' }
    ] },
  { id:'u4w', unit:4, kind:'word', title:'Unit 4 · Words in use', ref:'Section A · 教材 p.92',
    bank:['abolish','adverse','commonplace','contend','diversion','foster','gauge','revenue','suffice','upcoming'],
    items:[
      { q:1, b:1, s:'He is measuring the depth of the hole to ___ how much climbing line we\'ll need to get us down and back up again.',
        o:['gauges','garage','gauged','gauge'], a:3,
        n:'gauge 估计、判断；to 后接动词原形' },
      { q:2, b:1, s:'He ___ for the lead in the final round, but ultimately finished in second position.',
        o:['contending','contended','contented','contend'], a:1,
        n:'contend for 争夺；与 finished 并列用过去式' },
      { q:3, b:1, s:'Smartphone conversations, which are fairly ___ on commuter trains, can be annoying to fellow commuters.',
        o:['commonplace','common sense','commonwealth','commoner'], a:0,
        n:'commonplace 常见的、屡见不鲜的；are 后接形容词' },
      { q:4, b:1, s:'Ask your doctor whether a low-fat diet and a daily walk will ___ to lower your high blood pressure.',
        o:['sufficed','suffices','suffice','surface'], a:2,
        n:'suffice 足够；suffice to do 足以做…；will 后接原形' },
      { q:5, b:1, s:'According to the latest statistics, most of the company\'s ___ is generated through the sale of smartphones.',
        o:['avenue','revenues','revenge','revenue'], a:3,
        n:'revenue（公司）收入、收益；不可数名词' },
      { q:6, b:1, s:'Scientists have learned more about the ___ effects that human activities have on the environment and climate.',
        o:['advance','adverse','adversity','averse'], a:1,
        n:'adverse 不利的、有害的；adverse effects 负面影响' },
      { q:7, b:1, s:'I learned a great deal from this guide, and I am feeling very confident about my chances of passing the ___ exam.',
        o:['upcoming','coming up','incoming','up-and-coming'], a:0,
        n:'upcoming 即将来临的；只能放在名词前作定语' },
      { q:8, b:1, s:'There are rumors going around that this program will be ___ in November or December and all the work will be stopped.',
        o:['abolish','abolishing','polished','abolished'], a:3,
        n:'abolish 废除、取消；被动 be + 过去分词' },
      { q:9, b:1, s:'This program has transformed the airport\'s security screening area into an art gallery and is a pleasant ___ for travelers.',
        o:['division','diverse','diversion','diversity'], a:2,
        n:'diversion 消遣、娱乐；a pleasant + 名词' },
      { q:10, b:1, s:'We hope that the new series of music festivals will ___ interest in the arts in general and increase the city\'s international reputation.',
        o:['fosters','foster','fostering','fostered'], a:1,
        n:'foster 培养、促进；will 后接原形' }
    ] },
  { id:'u4e', unit:4, kind:'expr', title:'Unit 4 · Expressions in use', ref:'Section A · 教材 p.94',
    bank:['be counting down the days','conform to','contend with','correlate with','designate ... as','refrain from','sink one\'s teeth into','slave away'],
    items:[
      { q:1, b:1, s:'The rapid rise in unemployment does ___ the increase in young people living at home, according to research.',
        o:['correlated with','correlate to','correlation with','correlate with'], a:3,
        n:'correlate with 与…相关；does 表强调，后接动词原形' },
      { q:2, b:1, s:'It was a moment of overwhelming excitement when Steve was given the first prize; Tiffany couldn\'t ___ hugging and kissing him.',
        o:['refrain from','refrain with','refrain of','refrain to'], a:0,
        n:'refrain from 忍住不做…；couldn\'t 后接原形，from 后接动名词' },
      { q:3, b:1, s:'I guarantee they will ___ to come and spend time with you because you have made them feel welcome.',
        o:['be counting on the days','be counting down the day','be counting down the days','be counting the days down'], a:2,
        n:'be counting down the days 数着日子盼；will + 动词原形 be' },
      { q:4, b:1, s:'She spent the next 10 years ___ to pay back the money they had borrowed from the bank.',
        o:['slaved away','slaving away','slave away','slaving off'], a:1,
        n:'slave away 埋头苦干；spend time doing → 动名词' },
      { q:5, b:1, s:'This is a rare opportunity and he just can\'t wait to ___ the interesting new project.',
        o:['sink his tooth into','sink one\'s teeth into','set his teeth into','sink his teeth into'], a:3,
        n:'sink one\'s teeth into 全身心投入；主语 he → his' },
      { q:6, b:1, s:'The travel agency offers considerate care for its customers when they encounter unplanned circumstances or must ___ an unfamiliar environment.',
        o:['contend against','contend for','contend with','contend to'], a:2,
        n:'contend with 应对、与…作斗争；must 后接原形' },
      { q:7, b:1, s:'One teacher will be ___ the distance learning teacher for students who choose to start the school year that way.',
        o:['designate as','designated as','designated to','designating as'], a:1,
        n:'designate ... as 指定…为；被动 be + 过去分词' },
      { q:8, b:1, s:'The deepening cooperation between the two countries meets the development needs of both sides and ___ the will of the people of both sides.',
        o:['conforms with','conforming to','conform to','conforms to'], a:3,
        n:'conform to 符合；主语 cooperation 单数 → conforms to' }
    ] }
];

/* 汉译英：中文原文与参考译文逐字照抄自题库 md 的 Translation 段落 */
const EXAM_TRANS = [
  { id:'t1', unit:1, ref:'Section C · Translation · 教材 p.28',
    zh:'近年来，随着互联网技术的迅猛发展，互联网经济已成为一个热门话题。以电子商务为代表的互联网经济已成为中国经济发展的重要引擎（driving force）。我国政府提出了“互联网+”的概念，以推动互联网与医疗、交通、教育、金融、公共服务等领域的结合。这将为互联网经济的发展提供更多发展机遇和更广阔的发展空间。',
    en:'In recent years, with the rapid development of Internet technology, the Internet economy has become a hot topic. The Internet economy, represented by e-commerce, has become an important driving force for China\'s economic development. The Chinese government has proposed the concept of “Internet Plus” to promote the integration of the Internet with healthcare, transportation, education, finance, public services, and other sectors. This will provide more development opportunities and broader space for the development of the Internet economy.' },
  { id:'t2', unit:2, ref:'Section C · Translation · 教材 p.55',
    zh:'中央电视台春节联欢晚会（Spring Festival Gala）自 1983 年举办以来，已成为中国人生活中不可缺少的文化消费品和一个重要的文化符号。虽然众口难调，但必须承认的是，“春晚”已成为一项“新民俗”。它不仅是一台晚会，更是一种仪式与象征，一种文化与标签，一种情感与寄托。随着新媒体的出现，“春晚”也在与时俱进，以满足大众日渐多样化的需求。',
    en:'Since its inception in 1983, the CCTV Spring Festival Gala has become an indispensable cultural consumer product and an important cultural symbol in the lives of Chinese people. Although it is difficult to cater to all tastes, it must be admitted that the Gala has become a “new folk custom”. It is not merely a TV gala, but also a ritual and a symbol, a culture and a label, an emotional attachment and a spiritual anchor. With the emergence of new media, the Gala has also kept pace with the times to meet the public\'s increasingly diverse needs.' },
  { id:'t3', unit:3, ref:'Section C · Translation · 教材 p.82',
    zh:'丽江古城坐落在玉龙雪山（Yulong Snow Mountain）脚下，是一座风景秀丽的历史文化名城，也是我国保存完好的少数民族古城之一。随着丽江旅游业的发展，到丽江古城观光游览的中外游客日益增多。1997 年 12 月，丽江古城申报世界文化遗产（World Cultural Heritage Site）获得成功，成为中国第一批被列入世界文化遗产名录的历史文化名城。',
    en:'The Old Town of Lijiang, located at the foot of Yulong Snow Mountain, is a town of scenic beauty, known for its history and culture. It is also one of China\'s well-preserved old towns of ethnic minority groups. With the boom in Lijiang\'s tourism, the Old Town of Lijiang is receiving a growing number of tourists from home and abroad. In December 1997, the Old Town succeeded in applying to be recognized as a World Cultural Heritage Site, becoming one of the first noted historical and cultural cities in China to be included on the World Cultural Heritage List.' },
  { id:'t4', unit:4, ref:'Section C · Translation · 教材 p.108',
    zh:'近年来，社会的发展和就业形势的变化对大学生提出了更高的要求。越来越多的大学生不再局限于学习书本知识，而是利用业余时间积极投身于社会实践活动。通过社会实践活动，他们可以提高分析问题和解决问题的能力，更深入地了解社会，增强社会责任感。同时，参加社会实践活动还可以帮助他们认识到自身的不足，明确未来努力的方向。',
    en:'In recent years, the social development and changes in employment have posed higher requirements for college students. Instead of confining themselves to learning from books, more and more college students are taking an active part in social practice in their spare time. Through social practice, they can improve their analytical and problem-solving abilities, gain a deeper understanding of society, and increase their sense of social responsibility. Meanwhile, taking part in social practice can also help them recognize their own shortcomings and gain a clear idea about where they should be headed in the future.' }
];

/* 用户整理的第 3/6 题记忆库：q 与原题号对应，w 里 ==..== 是变形部分 */
const EXAM_MEMO = [
  { id:'u1w', unit:1, kind:'word', items:[
    { q:1, w:'scenario==s==', cue:'writing for a company', zh:'为电影公司写**剧本**' },
    { q:2, w:'alter', cue:'the meaning', zh:'**改变**含义' },
    { q:3, w:'furious', cue:'a ____ storm', zh:'**猛烈的**风暴' },
    { q:4, w:'sacred', cue:'____ duty', zh:'**神圣的**职责' },
    { q:5, w:'velocity', cue:'maintain ____', zh:'保持**速度**' },
    { q:6, w:'discrete', cue:'____ ideas', zh:'**离散的**想法' },
    { q:7, w:'substitute', cue:'____ for a pianist', zh:'**代替**钢琴家' },
    { q:8, w:'immers==ed==', cue:'get ____ in', zh:'沉浸于...之中' },
    { q:9, w:'collaborate', cue:'____ with peers', zh:'与同行**合作**' },
    { q:10, w:'assess==ed==', cue:'be ____ on', zh:'根据...**被评估**' }
  ] },
  { id:'u1e', unit:1, kind:'expr', items:[
    { q:1, w:'plung==ed== into', cue:'____ the virtual world', zh:'一头扎进**虚拟世界**' },
    { q:2, w:'in the company of', cue:'live ____ children', zh:'在子女的**陪伴下**生活' },
    { q:3, w:'pick==ed== up', cue:'be ____ in a month', zh:'一个月内**学会**' },
    { q:4, w:'la==id== out', cue:'____ the map', zh:'**铺开**地图' },
    { q:5, w:'add up to', cue:'all ____ an experience', zh:'共同**构成**一次体验' },
    { q:6, w:'make room for', cue:'____ new items', zh:'为新品**腾出空间**' },
    { q:7, w:'dumb==ed== down', cue:'has been ____', zh:'已经被**简单化**' },
    { q:8, w:'wip==ing== out', cue:'____ poverty', zh:'**消除**贫困' }
  ] },
  { id:'u2w', unit:2, kind:'word', items:[
    { q:1, w:'dense', cue:'____ rainforests', zh:'**茂密的**热带雨林' },
    { q:2, w:'appoint==ed==', cue:'was ____ to', zh:'**被任命**为...' },
    { q:3, w:'escort==ing==', cue:'____ the elderly', zh:'**护送**老人' },
    { q:4, w:'patroll==ing==', cue:'is ____ the roads', zh:'正在道路上**巡逻**' },
    { q:5, w:'complexity', cue:'despite its ____', zh:'尽管其具有**复杂性**' },
    { q:6, w:'expansion', cue:'economic ____', zh:'经济**扩张**' },
    { q:7, w:'vague', cue:'a ____ plan', zh:'一个**模糊的**计划' },
    { q:8, w:'maintenance', cue:'____ period', zh:'**维护**期' },
    { q:9, w:'realm==s==', cue:'digital and physical ____', zh:'数字和物理**领域**' },
    { q:10, w:'frail', cue:'____ elderly people', zh:'**虚弱的**老人' }
  ] },
  { id:'u2e', unit:2, kind:'expr', items:[
    { q:1, w:'in charge of', cue:'be ____ learning', zh:'**负责**学习' },
    { q:2, w:'view==ed== as', cue:'is ____ an occasion', zh:'**被视为**一个场合' },
    { q:3, w:'trad==ed== with', cue:'have ____ China', zh:'与中国**进行贸易**' },
    { q:4, w:'take place', cue:'events ____ daily', zh:'每天**发生**的事件' },
    { q:5, w:'load==ed== with', cue:'was fully ____ goods', zh:'**满载着**货物' },
    { q:6, w:'set off', cue:'____ from the port', zh:'从港口**出发**' },
    { q:7, w:'curious about', cue:'been ____ space', zh:'对太空**感到好奇**' },
    { q:8, w:'along with', cue:'stay ____ your friend', zh:'**与**朋友**一起**待着' }
  ] },
  { id:'u3w', unit:3, kind:'word', items:[
    { q:1, w:'compulsory', cue:'____ education', zh:'**义务**教育' },
    { q:2, w:'contemplat==ing==', cue:'has been ____ leaving', zh:'一直**打算**离开' },
    { q:3, w:'loosen==ed==', cue:'be ____', zh:'被**放宽**' },
    { q:4, w:'globalize', cue:'____ the business', zh:'使业务**全球化**' },
    { q:5, w:'offset', cue:'be ____ by gains', zh:'被收益**抵消**' },
    { q:6, w:'groan==ed==', cue:'____ in pain', zh:'痛苦地**呻吟**' },
    { q:7, w:'stubborn', cue:'very ____', zh:'非常**固执**' },
    { q:8, w:'cluster', cue:'cars ____ near...', zh:'车辆**聚集**在...附近' },
    { q:9, w:'ambiguity', cue:'a degree of ____', zh:'一定程度的**模糊性**' },
    { q:10, w:'drawback', cue:'chief ____', zh:'主要**缺点**' }
  ] },
  { id:'u3e', unit:3, kind:'expr', items:[
    { q:1, w:'settle for', cue:'willing to ____', zh:'愿意**勉强接受**' },
    { q:2, w:'more often than not', cue:'____ challenging', zh:'**往往**具有挑战性' },
    { q:3, w:'mingl==ed== with', cue:'air ____ smell', zh:'空气与气味**混合**' },
    { q:4, w:'trad==ed== ... for', cue:'____ milk ____ bread', zh:'用牛奶**交换**面包' },
    { q:5, w:'on sale', cue:'when they\'re ____', zh:'当它们**打折**时' },
    { q:6, w:'are open to', cue:'____ their ideas', zh:'**愿意接受**他们的想法' },
    { q:7, w:'endow... with', cue:'____ foods ____ flavors', zh:'**赋予**食物风味' },
    { q:8, w:'make up for', cue:'____ impacts', zh:'**弥补**影响' }
  ] },
  { id:'u4w', unit:4, kind:'word', items:[
    { q:1, w:'gauge', cue:'____ how much', zh:'**估计**有多少' },
    { q:2, w:'contend==ed==', cue:'____ for the lead', zh:'**争夺**领先地位' },
    { q:3, w:'commonplace', cue:'fairly ____', zh:'相当**常见**' },
    { q:4, w:'suffice', cue:'will ____ to lower', zh:'**足以**降低...' },
    { q:5, w:'revenue', cue:'company\'s ____', zh:'公司的**收入**' },
    { q:6, w:'adverse', cue:'____ effects', zh:'**不利的**影响' },
    { q:7, w:'upcoming', cue:'____ exam', zh:'**即将到来的**考试' },
    { q:8, w:'abolish==ed==', cue:'be ____', zh:'被**废除**' },
    { q:9, w:'diversion', cue:'pleasant ____', zh:'愉快的**消遣**' },
    { q:10, w:'foster', cue:'____ interest', zh:'**培养**兴趣' }
  ] },
  { id:'u4e', unit:4, kind:'expr', items:[
    { q:1, w:'correlate with', cue:'does ____ the increase', zh:'**与**增长**相关**' },
    { q:2, w:'refrain from', cue:'couldn\'t ____ hugging', zh:'忍不住（无法**克制**）拥抱' },
    { q:3, w:'count==ing== down the days', cue:'will be ____ to come', zh:'**倒数着日子**盼着到来' },
    { q:4, w:'slav==ing== away', cue:'10 years ____', zh:'**苦干**十年' },
    { q:5, w:'sink his teeth into', cue:'____ the project', zh:'**全身心投入**项目' },
    { q:6, w:'contend with', cue:'must ____ environment', zh:'必须**应对**环境' },
    { q:7, w:'designat==ed== as', cue:'be ____ the teacher', zh:'**被指定为**老师' },
    { q:8, w:'conform==s== to', cue:'____ the will', zh:'**符合**意愿' }
  ] }
];

let examState = loadJSON(EXAM_KEY, {groups:{}});
if(!examState || typeof examState !== 'object' || Array.isArray(examState)) examState = {groups:{}};
if(!examState.groups || typeof examState.groups !== 'object' || Array.isArray(examState.groups)) examState.groups = {};
if(!examState.trans || typeof examState.trans !== 'object' || Array.isArray(examState.trans)) examState.trans = {};

/* 一轮的临时状态：items 里每项是一空 {gid, item} */
const examRun = {
  mode:'group', gid:'', title:'',
  items:[], idx:0, right:0, wrong:[], answers:{}
};

/* 答题时收起底部导航，并压一条历史记录：
   手机返回键先回到题库首页，而不是把整个页面退掉 */
let examInRun = false;
function examChrome(on){
  const app = document.querySelector('.app');
  if(app) app.classList.toggle('exam-run', on);
}
function examEnterRun(){
  examInRun = true;
  examChrome(true);
  if(!history.state || !history.state.examRun) history.pushState({examRun:1}, '');
}
function examLeaveRun(){
  examInRun = false;
  examChrome(false);
  renderExam();
  /* 退掉自己压的那条记录；popstate 里 examInRun 已是 false，不会再多绘一次 */
  if(history.state && history.state.examRun) history.back();
}

/* ---------------- 读写小工具 ---------------- */
function examGroup(id){
  return EXAM_GROUPS.find(g => g.id === id) || null;
}
function examKey(item, gid){
  return gid + ':' + item.q + ':' + item.b;
}
/* 只读视图：不往 examState 里塞默认值 */
function examInfo(gid){
  const r = examState.groups[gid];
  const o = (r && typeof r === 'object') ? r : {};
  return {
    seen: typeof o.seen === 'number' ? o.seen : 0,
    right: typeof o.right === 'number' ? o.right : 0,
    best: typeof o.best === 'number' ? o.best : -1,
    wrong: Array.isArray(o.wrong) ? o.wrong : []
  };
}
/* 写之前先补齐字段，返回真实引用 */
function examRec(gid){
  let r = examState.groups[gid];
  if(!r || typeof r !== 'object') r = examState.groups[gid] = {};
  if(typeof r.seen !== 'number') r.seen = 0;
  if(typeof r.right !== 'number') r.right = 0;
  if(typeof r.best !== 'number') r.best = -1;
  if(!Array.isArray(r.wrong)) r.wrong = [];
  return r;
}
/* 跨组汇总错题，反查回题目；组不存在就忽略 */
function examWrongList(){
  const out = [];
  EXAM_GROUPS.forEach(g => {
    examInfo(g.id).wrong.forEach(k => {
      const it = g.items.find(x => examKey(x, g.id) === k);
      if(it) out.push({gid:g.id, item:it});
    });
  });
  return out;
}
/* 题干里的空位统一交给回调渲染 */
function examBlankStem(s, fn){
  return esc(s).replace(/___\((\d)\)|___/g, (m, num) => fn(num ? Number(num) : 1));
}

/* ---------------- 原句里的搭配着色 ---------------- */
/* 只拿实词当锚点：the/for 这类会把高亮拉到离谱的位置 */
const EX_CUE_STOP = ['the','for','with','and','into','of','to','in','on','at','a','an','be','is','are','that','this','his','her','its','their','from'];
/* 取命中词的第一个到最后一个，中间整段（含空位）一起标，读起来才是完整搭配 */
function examCueRange(raw, cue){
  const toks = (String(cue || '').toLowerCase().match(/[a-z]+/g) || [])
    .filter(t => t.length >= 3 && EX_CUE_STOP.indexOf(t) < 0);
  if(!toks.length) return null;
  const words = [];
  const re = /[A-Za-z][A-Za-z'-]*/g;
  let m;
  while((m = re.exec(raw))) words.push({ w:m[0].toLowerCase(), s:m.index, e:m.index + m[0].length });
  let a = -1, b = -1;
  toks.forEach(t => {
    /* 双向前缀匹配：company / companies、maintain / maintains 都算命中 */
    const hit = words.find(x => x.w === t || x.w.indexOf(t) === 0 || t.indexOf(x.w) === 0);
    if(!hit) return;
    if(a < 0 || hit.s < a) a = hit.s;
    if(hit.e > b) b = hit.e;
  });
  return (a < 0 || b <= a) ? null : [a, b];
}
/* 区间内包一层钢蓝，区间外原样转义 */
function examCueWrap(text, offset, r){
  if(!text) return '';
  const a = offset, b = offset + text.length;
  if(b <= r[0] || a >= r[1]) return esc(text);
  const s1 = Math.max(0, r[0] - a), e1 = Math.min(text.length, r[1] - a);
  return esc(text.slice(0, s1)) + '<span class="ex-cue-hl">' + esc(text.slice(s1, e1)) + '</span>' + esc(text.slice(e1));
}
/* 记忆条用 ==..== 标出的变形部分，在答案里的字符下标（用于原句里给同一批字母上色） */
function examCueHlRange(memo, answer){
  const raw = String((memo && memo.w) || '');
  const re = /==([^=]+)==/g;
  let at = -1, part = '', pos = 0, last = 0, m;
  while((m = re.exec(raw))){
    pos += raw.slice(last, m.index).length;
    if(at < 0){ at = pos; part = m[1]; }
    pos += m[1].length;
    last = re.lastIndex;
  }
  const plain = raw.replace(/==/g, '');
  const a = String(answer || '');
  if(at < 0 || !part || !a) return null;
  const lp = plain.toLowerCase(), la = a.toLowerCase(), lpart = part.toLowerCase();
  /* 词形一致时直接用记忆条里的位置；否则退到首尾对齐判断，避免把 scenario 开头的 s 标红 */
  if(lp === la) return [at, at + lpart.length];
  if(lp.endsWith(lpart) && la.endsWith(lpart)) return [la.length - lpart.length, la.length];
  if(lp.startsWith(lpart) && la.startsWith(lpart)) return [0, lpart.length];
  const k = la.indexOf(lpart);
  return k < 0 ? null : [k, k + lpart.length];
}
function examStemCue(s, cue, fn){
  const raw = String(s || '');
  const r = examCueRange(raw, cue);
  if(!r) return examBlankStem(raw, fn);
  const re = /___\((\d)\)|___/g;
  let out = '', last = 0, m;
  while((m = re.exec(raw))){
    out += examCueWrap(raw.slice(last, m.index), last, r);
    const blank = fn(m[1] ? Number(m[1]) : 1);
    out += (m.index >= r[0] && re.lastIndex <= r[1]) ? '<span class="ex-cue-hl">' + blank + '</span>' : blank;
    last = re.lastIndex;
  }
  return out + examCueWrap(raw.slice(last), last, r);
}

/* ---------------- 记忆库：取条目与渲染小工具 ---------------- */
/* 按组 + 题号取记忆；双空题两空共用同一条 */
function memoFor(gid, q){
  const g = EXAM_MEMO.find(x => x.id === gid);
  return g ? (g.items.find(m => m.q === q) || null) : null;
}
/* 记忆库总条数 */
function examMemoCount(){
  return EXAM_MEMO.reduce((n, g) => n + g.items.length, 0);
}
/* w 里的 ==..== 渲染成加粗词形，其余文字转义 */
function examMemoW(w){
  return String(w || '').split(/(==[^=]+==)/).map(seg => {
    const m = seg.match(/^==([^=]+)==$/);
    return m ? '<b class="ex-memo-hl">' + esc(m[1]) + '</b>' : esc(seg);
  }).join('');
}
/* zh 里的 **..** 渲染成加粗，其余文字转义 */
function examMemoZh(zh){
  return String(zh || '').split(/(\*\*[^*]+\*\*)/).map(seg => {
    const m = seg.match(/^\*\*([^*]+)\*\*$/);
    return m ? '<b>' + esc(m[1]) + '</b>' : esc(seg);
  }).join('');
}
/* 答题解析与结果页共用的一行记忆 */
function examMemoLine(gid, q){
  const m = memoFor(gid, q);
  if(!m) return '';
  return '<div class="ex-memo">' +
      '<span class="ex-memo-k">搭配</span>' +
      '<span class="ex-memo-w">' + examMemoW(m.w) + '</span>' +
      '<span class="ex-memo-cue">' + esc(m.cue) + '</span>' +
      '<span class="ex-memo-zh">' + examMemoZh(m.zh) + '</span>' +
    '</div>';
}
/* 遮住英文：字母逐个换成 •，____ 与标点保留 */
function examMemoMask(w){
  return String(w || '').replace(/==/g, '').replace(/[A-Za-z]/g, '•');
}

/* ---------------- 汉译英：取题、存档、覆盖率 ---------------- */
function examTrans(id){
  return EXAM_TRANS.find(t => t.id === id) || null;
}
/* 只读视图：与 examInfo 一致，没做过 best 记 -1 */
function examTransInfo(id){
  const r = examState.trans[id];
  const o = (r && typeof r === 'object') ? r : {};
  return {
    seen: typeof o.seen === 'number' ? o.seen : 0,
    right: typeof o.right === 'number' ? o.right : 0,
    best: typeof o.best === 'number' ? o.best : -1,
    last: typeof o.last === 'number' ? o.last : -1
  };
}
/* 写之前先补齐字段，返回真实引用 */
function examTransRec(id){
  let r = examState.trans[id];
  if(!r || typeof r !== 'object') r = examState.trans[id] = {};
  if(typeof r.seen !== 'number') r.seen = 0;
  if(typeof r.right !== 'number') r.right = 0;
  if(typeof r.best !== 'number') r.best = 0;
  if(typeof r.last !== 'number') r.last = 0;
  return r;
}

/* 覆盖率用的停用词：只保留实词 */
const TR_STOP = new Set(['a','an','the','of','to','in','on','at','for','with','and','or','but','is','are','was','were','be','been','being','has','have','had','do','does','did','it','its','this','that','these','those','as','by','from','not','so','than','then','when','which','who','whom','whose','will','would','can','could','may','might','must','i','you','he','she','we','they','them','him','her','his','our','their','my','me','us','your','also','more','most','some','any','all','one','two','first','into','about','such','other','there','what','how','if','up','out','over','only','both','each','very']);
/* 中英文标点一起当分隔符 */
const TR_SPLIT = /[\s,.;:!?“”"'’()（）\-—、，。！？；：]+/;
function trTokens(s){
  return String(s || '').toLowerCase().split(TR_SPLIT).filter(Boolean);
}
/* 参考词：长度 ≥3 且不是停用词，去重后保留原顺序 */
function trRefWords(en){
  const seen = {};
  const out = [];
  trTokens(en).forEach(w => {
    if(w.length < 3 || TR_STOP.has(w) || seen[w]) return;
    seen[w] = 1;
    out.push(w);
  });
  return out;
}
/* 完全相同，或前 5 个字母相同（容忍时态/复数） */
function trHit(ref, words){
  return words.some(w => w === ref || w.slice(0, 5) === ref.slice(0, 5));
}
function trCoverage(en, input){
  const refs = trRefWords(en);
  const words = trTokens(input);
  const missed = [];
  let hits = 0;
  refs.forEach(w => {
    if(trHit(w, words)) hits++;
    else missed.push(w);
  });
  const pct = refs.length ? Math.round(hits / refs.length * 100) : 0;
  return { pct:pct, total:refs.length, hits:hits, missed:missed.slice(0, 12) };
}

/* ---------------- 题库首页 ---------------- */
function renderExam(){
  const view = document.getElementById('view-exam');
  if(!view) return;
  /* 回到题库首页就是离开答题态：底部导航回来 */
  examInRun = false;
  examChrome(false);
  const blanks = EXAM_GROUPS.reduce((n, g) => n + g.items.length, 0);
  const qs = EXAM_GROUPS.reduce((n, g) => n + new Set(g.items.map(x => x.q)).size, 0);
  const wrongList = examWrongList();
  const memoTotal = examMemoCount();

  let html = '<div class="ex-wrap">' +
      '<div class="ex-head">' +
        '<span class="ex-kicker">新视野读写 3 · 期末题库</span>' +
        '<span class="ex-count">' + EXAM_GROUPS.length + ' 组 · ' + qs + ' 题 · ' + blanks + ' 空 · ' + EXAM_TRANS.length + ' 段翻译</span>' +
      '</div>' +
      '<div class="ex-picks">' +
        '<button class="ex-pick" type="button" data-ex-mix>全部混合</button>' +
        '<button class="ex-pick ghost" type="button" data-ex-wrong' + (wrongList.length ? '' : ' disabled') + '>只刷错题 ' + wrongList.length + '</button>' +
      '</div>';

  [1, 2, 3, 4].forEach(u => {
    html += '<div class="ex-unit"><div class="ex-unit-head">UNIT ' + u + ' · ' + esc(EXAM_UNITS[u]) + '</div>';
    EXAM_GROUPS.filter(g => g.unit === u).forEach(g => {
      const info = examInfo(g.id);
      const hasBest = info.best >= 0;
      const pct = hasBest ? Math.max(0, Math.min(100, info.best)) : 0;
      html += '<button class="ex-row" type="button" data-ex-group="' + g.id + '">' +
          '<span class="ex-row-main">' +
            '<span class="ex-row-t">' + (g.kind === 'word' ? '3 · Words in use' : '6 · Expressions in use') + '</span>' +
            '<span class="ex-row-s">' + esc(g.ref) + '</span>' +
          '</span>' +
          '<span class="ex-row-side">' +
            '<span class="ex-row-n">' + g.items.length + ' 空</span>' +
            '<span class="ex-row-r">' + (hasBest ? info.best + '%' : '—') + '</span>' +
            '<span class="ex-row-bar"><i style="width:' + pct + '%;"></i></span>' +
            (info.wrong.length ? '<span class="ex-row-w">错 ' + info.wrong.length + '</span>' : '') +
          '</span>' +
        '</button>';
    });
    html += '</div>';
  });

  /* 汉译英：单独一块，不进「全部混合」与「只刷错题」 */
  html += '<div class="ex-unit"><div class="ex-unit-head ex-tr-head">' +
      '<span>SECTION C · TRANSLATION</span>' +
      '<span class="ex-count">' + EXAM_TRANS.length + ' 段 · 汉译英</span>' +
    '</div>';
  EXAM_TRANS.forEach(t => {
    const info = examTransInfo(t.id);
    const hasBest = info.best >= 0;
    html += '<button class="ex-row" type="button" data-ex-tr="' + t.id + '">' +
        '<span class="ex-row-main">' +
          '<span class="ex-row-t">Unit ' + t.unit + ' · 汉译英</span>' +
          '<span class="ex-row-s">' + esc(t.ref.replace(' · Translation', '')) + '</span>' +
        '</span>' +
        '<span class="ex-row-side">' +
          '<span class="ex-row-n">1 段</span>' +
          '<span class="ex-row-r">' + (hasBest ? '最好 ' + info.best + '%' : '—') + '</span>' +
          '<span class="ex-row-bar"><i style="width:' + (hasBest ? Math.max(0, Math.min(100, info.best)) : 0) + '%;"></i></span>' +
        '</span>' +
      '</button>';
  });
  html += '</div>';

  /* 记忆库：只读背诵版，不进「全部混合」「只刷错题」，也不写存档 */
  html += '<div class="ex-unit"><div class="ex-unit-head ex-tr-head">' +
      '<span>MEMORY · 记忆库</span>' +
      '<span class="ex-count">' + memoTotal + ' 条 · 背诵版</span>' +
    '</div>' +
    '<button class="ex-row" type="button" data-ex-mm="all">' +
      '<span class="ex-row-main">' +
        '<span class="ex-row-t">第 3/6 题 · 全部词条</span>' +
        '<span class="ex-row-s">词形 + 搭配 + 中文</span>' +
      '</span>' +
      '<span class="ex-row-side">' +
        '<span class="ex-row-n">' + memoTotal + ' 条</span>' +
      '</span>' +
    '</button>' +
  '</div>';

  view.innerHTML = html + '</div>';
}

/* ---------------- 记忆库页：默认遮住英文，点一下看词 ---------------- */
let examMemoOpen = {};                    /* 展开状态只存内存，刷新不保留 */
function examOpenMemo(){
  examEnterRun();
  examMemoOpen = {};
  renderExamMemo();
}
function examMemoToggle(key){
  if(examMemoOpen[key]) delete examMemoOpen[key];
  else examMemoOpen[key] = 1;
  renderExamMemo();
}
function renderExamMemo(){
  const view = document.getElementById('view-exam');
  if(!view) return;
  let html = '<div class="ex-wrap">' +
      '<div class="ex-bar">' +
        '<button class="ex-back" type="button" data-ex-back>← 题库</button>' +
        '<span class="ex-bar-mid">记忆库</span>' +
        '<span class="ex-bar-prog">' + examMemoCount() + ' 条</span>' +
      '</div>';
  [1, 2, 3, 4].forEach(u => {
    const groups = EXAM_MEMO.filter(g => g.unit === u);
    if(!groups.length) return;
    html += '<div class="ex-mm-unit">' +
      '<div class="ex-mm-unit-head">UNIT ' + u + ' · ' + esc(EXAM_UNITS[u] || '') + '</div>';
    groups.forEach(g => {
      html += '<div class="ex-mm-sec">' + (g.kind === 'word' ? '3 · Words in use' : '6 · Expressions in use') + '</div>';
      g.items.forEach(m => {
        const key = g.id + ':' + m.q;
        const open = !!examMemoOpen[key];
        html += '<button class="ex-mm-row' + (open ? ' open' : '') + '" type="button" data-ex-mm-row="' + key + '">' +
            '<span class="ex-mm-main">' +
              '<span class="ex-mm-p">' + (open ? examMemoW(m.w) : esc(examMemoMask(m.w))) + '</span>' +
              '<span class="ex-mm-zh">' + examMemoZh(m.zh) + '</span>' +
            '</span>' +
            '<span class="ex-mm-tag">' + (open ? '收起' : '看词') + '</span>' +
          '</button>';
      });
    });
    html += '</div>';
  });
  view.innerHTML = html + '</div>';
}

/* ---------------- 开一轮 ---------------- */
function examStartGroup(gid){
  const g = examGroup(gid);
  if(!g) return;
  examEnterRun();
  examRun.mode = 'group';
  examRun.gid = gid;
  examRun.title = g.title;
  examRun.items = g.items.map(it => ({gid:gid, item:it}));
  examRun.idx = 0;
  examRun.right = 0;
  examRun.wrong = [];
  examRun.answers = {};
  renderExamRun();
}
function examStartMix(){
  const all = [];
  EXAM_GROUPS.forEach(g => g.items.forEach(it => all.push({gid:g.id, item:it})));
  examEnterRun();
  examRun.mode = 'mix';
  examRun.gid = '';
  examRun.title = '全部混合';
  examRun.items = shuffle(all);
  examRun.idx = 0;
  examRun.right = 0;
  examRun.wrong = [];
  examRun.answers = {};
  renderExamRun();
}
function examStartWrong(){
  const list = examWrongList();
  if(!list.length){ toast('还没有错题'); renderExam(); return; }
  examEnterRun();
  examRun.mode = 'wrong';
  examRun.gid = '';
  examRun.title = '错题练习';
  examRun.items = shuffle(list);
  examRun.idx = 0;
  examRun.right = 0;
  examRun.wrong = [];
  examRun.answers = {};
  renderExamRun();
}

/* ---------------- 汉译英：一轮的临时状态与三屏 ---------------- */
const examTransRun = { id:'', text:'', done:false, pct:0, missed:[] };

function examStartTrans(id){
  const t = examTrans(id);
  if(!t) return;
  examEnterRun();
  examTransRun.id = id;
  examTransRun.text = '';
  examTransRun.done = false;
  examTransRun.pct = 0;
  examTransRun.missed = [];
  renderExamTrans();
}
/* 输入时只记文本并切换按钮可用态，不重绘（避免打断输入） */
function examTransInput(el){
  examTransRun.text = el.value;
  const wrap = el.closest('.ex-wrap');
  const btn = wrap ? wrap.querySelector('[data-ex-trans-reveal]') : null;
  if(btn) btn.disabled = !el.value.trim();
}
function examTransChips(words){
  if(!words || !words.length) return '';
  return '<span class="ex-tr-miss-k">没写到的关键词</span>' +
    '<div class="ex-tr-chips">' + words.map(w => '<span class="ex-tr-chip">' + esc(w) + '</span>').join('') + '</div>';
}
function renderExamTrans(){
  const view = document.getElementById('view-exam');
  if(!view) return;
  const t = examTrans(examTransRun.id);
  if(!t){ renderExam(); return; }
  const done = examTransRun.done;
  const pct = examTransRun.pct;
  let body = '';
  if(done){
    body = '<div class="ex-tr-ref">' + esc(t.en) + '</div>' +
      '<p class="ex-tr-cov">覆盖率 ' + pct + '%</p>' +
      '<p class="ex-tr-verdict' + (pct >= 60 ? '' : ' bad') + '">' + (pct >= 60 ? '命中主要表达' : '还差一些') + '</p>' +
      examTransChips(examTransRun.missed);
  }
  view.innerHTML = '<div class="ex-wrap">' +
      '<div class="ex-bar">' +
        '<button class="ex-back" type="button" data-ex-back>← 题库</button>' +
        '<span class="ex-bar-mid">Unit ' + t.unit + ' · 汉译英</span>' +
        '<span class="ex-bar-prog">1 / 1</span>' +
      '</div>' +
      '<div>' +
        '<span class="ex-tr-k">中文原文</span>' +
        '<p class="ex-tr-zh">' + esc(t.zh) + '</p>' +
        '<textarea class="ex-tr-in" data-ex-tr-input placeholder="先自己译一遍，再对照参考译文"' +
          (done ? ' readonly' : '') + ' oninput="examTransInput(this)">' + esc(examTransRun.text) + '</textarea>' +
        body +
      '</div>' +
      '<div class="ex-foot">' +
        (done
          ? '<button class="ex-btn" type="button" data-ex-trans-result>看结果</button>'
          : '<button class="ex-btn" type="button" data-ex-trans-reveal disabled>对照译文</button>') +
      '</div>' +
    '</div>';
}
function examTransReveal(){
  const t = examTrans(examTransRun.id);
  if(!t || examTransRun.done) return;
  const text = String(examTransRun.text || '').trim();
  if(!text) return;
  const cov = trCoverage(t.en, text);
  examTransRun.done = true;
  examTransRun.pct = cov.pct;
  examTransRun.missed = cov.missed;
  const r = examTransRec(t.id);
  r.seen += 1;
  if(cov.pct >= 60) r.right += 1;
  r.best = Math.max(r.best || 0, cov.pct);
  r.last = cov.pct;
  persist(EXAM_KEY, examState);
  renderExamTrans();
}
function renderExamTransResult(){
  const view = document.getElementById('view-exam');
  if(!view) return;
  const t = examTrans(examTransRun.id);
  if(!t){ renderExam(); return; }
  const info = examTransInfo(t.id);
  const next = EXAM_TRANS.find(x => x.unit === t.unit + 1);
  view.innerHTML = '<div class="ex-wrap">' +
      '<div>' +
        '<span class="ex-kicker">Unit ' + t.unit + ' · 汉译英 · 本轮完成</span>' +
        '<p class="ex-res-num">' + examTransRun.pct + '%</p>' +
        '<p class="ex-res-sub">本段覆盖率 · 目标 60%</p>' +
        (info.best >= 0 ? '<p class="ex-res-sub">本单元最好 ' + info.best + '%</p>' : '') +
      '</div>' +
      '<div class="ex-tr-ref">' + esc(t.en) + '</div>' +
      examTransChips(examTransRun.missed) +
      '<div class="ex-foot">' +
        '<button class="ex-btn ghost" type="button" data-ex-trans-redo>再写一遍</button>' +
        (next ? '<button class="ex-btn ghost" type="button" data-ex-trans-next="' + next.id + '">下一单元</button>' : '') +
        '<button class="ex-btn" type="button" data-ex-back>返回题库</button>' +
      '</div>' +
    '</div>';
}

/* ---------------- 答题页 ---------------- */
function examRunStem(it, gid, cue){
  const g = examGroup(gid);
  const siblings = g ? g.items.filter(x => x.q === it.q) : [it];
  const blank = n => {
    const sub = siblings.find(x => x.b === n) || it;
    const a = examRun.answers[examKey(sub, gid)];
    const cls = 'ex-blank' + (n === it.b ? ' on' : '');
    if(a){
      /* 逐字拆成 <i>，让 CSS 能按 --d 依次写入；空格不包 <i>，否则会塌掉 */
      const memo = memoFor(gid, it.q);
      const hl = memo ? examCueHlRange(memo, sub.o[a.pick]) : null;
      const text = String(sub.o[a.pick] || '');
      let k = 0;
      const chars = text.split('').map((ch, idx) => {
        if(ch === ' ') return ' ';
        const on = hl && idx >= hl[0] && idx < hl[1];
        return '<i class="ex-ch' + (on ? ' ex-ch-hl' : '') + '" style="--d:' + (k++ * 40) + 'ms">' + esc(ch) + '</i>';
      }).join('');
      return '<span class="' + cls + ' ' + (a.ok ? 'right' : 'wrong') + ' writing">' + chars + '</span>';
    }
    return '<span class="' + cls + '"></span>';
  };
  /* 判分后才标：先给「读句子 → 看搭配落在哪」的时机 */
  const m = cue ? memoFor(gid, it.q) : null;
  return m ? examStemCue(it.s, m.cue, blank) : examBlankStem(it.s, blank);
}
function examOptsHtml(it, ans){
  const letters = ['A', 'B', 'C', 'D'];
  return it.o.map((txt, i) => {
    let cls = 'ex-opt';
    if(ans){
      /* 答错时正确答案用 lit 虚线点亮，和用户选的 wrong 区分开 */
      if(i === it.a) cls += ' right' + (ans.ok ? '' : ' lit');
      else if(i === ans.pick) cls += ' wrong';
      else cls += ' dim';
    }
    return '<button class="' + cls + '" type="button" data-ex-opt="' + i + '">' +
        '<span class="ex-l">' + letters[i] + '</span><span>' + esc(txt) + '</span></button>';
  }).join('');
}
function renderExamRun(){
  const view = document.getElementById('view-exam');
  if(!view) return;
  if(examRun.idx >= examRun.items.length){ renderExamResult(); return; }
  const cur = examRun.items[examRun.idx];
  const it = cur.item;
  const g = examGroup(cur.gid);
  const ans = examRun.answers[examKey(it, cur.gid)] || null;
  const blanks = g ? g.items.filter(x => x.q === it.q).length : 1;
  const where = examRun.mode === 'group' ? '' :
    (g ? 'Unit ' + g.unit + ' · ' + (g.kind === 'word' ? 'Words' : 'Expressions') + ' · ' : '');
  const meta = where + '第 ' + it.q + ' 题' + (blanks > 1 ? ' · 空 ' + it.b + '/' + blanks : '');
  const last = examRun.idx + 1 >= examRun.items.length;

  /* 题号跟本轮位置走：跨组混合时 it.q 会重复，不能用它 */
  const no = ('0' + (examRun.idx + 1)).slice(-2);
  const judgeCls = ans ? (ans.ok ? ' judged-right' : ' judged-wrong') : '';
  const memo = ans ? examMemoLine(cur.gid, it.q) : '';

  const strip = examRun.items.map((x, i) => {
    const a = examRun.answers[examKey(x.item, x.gid)];
    let cls = 'ex-score-cell';
    if(a) cls += a.ok ? ' is-right' : ' is-wrong';
    if(i === examRun.idx) cls += ' is-cur';
    return '<span class="' + cls + '"></span>';
  }).join('');

  view.innerHTML = '<div class="ex-wrap ex-run' + judgeCls + '">' +
      '<div class="ex-bar">' +
        '<button class="ex-back" type="button" data-ex-back>← 题库</button>' +
        '<span class="ex-bar-mid">' + esc(examRun.title) + '</span>' +
        '<span class="ex-bar-prog">' + (examRun.idx + 1) + ' / ' + examRun.items.length + '</span>' +
      '</div>' +
      '<div class="ex-score-strip">' + strip + '</div>' +
      '<div class="ex-q-head">' +
        '<span class="ex-q-no">' + no + '</span>' +
        '<p class="ex-q-meta">' + esc(meta) + '</p>' +
      '</div>' +
      '<p class="ex-q">' + examRunStem(it, cur.gid, !!ans) + '</p>' +
      '<div class="ex-opts">' + examOptsHtml(it, ans) + '</div>' +
      (ans ? '<div class="ex-note">' +
        '<span class="ex-note-k">考点</span>' +
        '<p>' + esc(it.n) + '</p>' +
        (memo ? '<div class="ex-note-memo">' + memo + '</div>' : '') +
      '</div>' +
      '<span class="ex-stamp ' + (ans.ok ? 'ok' : 'bad') + '" aria-hidden="true">' + (ans.ok ? '✓' : '✗') + '</span>' : '') +
      '<div class="ex-foot">' +
        '<button class="ex-btn" type="button" data-ex-next' + (ans ? '' : ' disabled') + '>' + (last ? '看结果' : '下一题') + '</button>' +
      '</div>' +
    '</div>';
}

/* 判分：状态先落盘，再按状态重绘这一屏 */
function examPick(i){
  const cur = examRun.items[examRun.idx];
  if(!cur) return;
  const it = cur.item;
  const key = examKey(it, cur.gid);
  if(examRun.answers[key]) return;                 /* 已判分：不改变状态，也不重复计数 */
  if(!(i >= 0 && i < it.o.length)) return;
  const ok = i === it.a;
  examRun.answers[key] = {pick:i, ok:ok};
  if(ok) examRun.right++;
  else examRun.wrong.push(key);
  /* 错题归属：错→加入，对→移除 */
  const r = examRec(cur.gid);
  const at = r.wrong.indexOf(key);
  if(ok){ if(at >= 0) r.wrong.splice(at, 1); }
  else if(at < 0){ r.wrong.push(key); }
  persist(EXAM_KEY, examState);

  /* 先给点击项上一版「按下」态，重绘后 CSS 还能接着放映 */
  const btn = document.querySelector('#view-exam .ex-opt[data-ex-opt="' + i + '"]');
  if(btn) btn.classList.add('pick-live');
  sfxPlay(ok ? 'ok' : 'bad');

  const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  if(reduce){ renderExamRun(); return; }
  sfxHaptic(ok ? 12 : [8, 40, 8]);

  const idx = examRun.idx;
  setTimeout(() => {
    /* 这 140ms 里用户可能已经按了「← 题库」或手机返回键，不能再把答题页画回来 */
    if(examInRun && examRun.idx === idx) renderExamRun();
  }, 140);
}
function examNext(){
  const cur = examRun.items[examRun.idx];
  if(!cur || !examRun.answers[examKey(cur.item, cur.gid)]) return;
  examRun.idx++;
  if(examRun.idx >= examRun.items.length){ renderExamResult(); return; }
  renderExamRun();
}

/* ---------------- 结果页 ---------------- */
function renderExamResult(){
  const view = document.getElementById('view-exam');
  if(!view) return;
  const total = examRun.items.length;
  const right = examRun.right;
  const rate = total ? Math.round(right / total * 100) : 0;
  let bestLine = '';
  if(examRun.mode === 'group'){                    /* 只有单组练习才写 seen/right/best */
    const r = examRec(examRun.gid);
    const prev = r.best;
    r.seen += total;
    r.right += right;
    r.best = Math.max(r.best, rate);
    persist(EXAM_KEY, examState);
    if(prev >= 0) bestLine = '本组最好 ' + r.best + '%';
  }
  const wrongs = examRun.wrong
    .map(k => examRun.items.find(x => examKey(x.item, x.gid) === k))
    .filter(Boolean);

  let listHtml = '';
  if(!wrongs.length){
    listHtml = '<p class="ex-res-sub">全对，这组可以放下了</p>';
  } else {
    listHtml = '<div class="ex-wrong">' + wrongs.map(cur => {
      const it = cur.item;
      const stem = examBlankStem(it.s, n =>
        n === it.b ? '<b>' + esc(it.o[it.a]) + '</b>' : '<span class="ex-blank"></span>');
      return '<div class="ex-wrong-i ex-res-card">' +
          '<p class="ex-wrong-s">' + stem + '</p>' +
          '<p class="ex-wrong-a">正确答案：' + 'ABCD'[it.a] + ' ' + esc(it.o[it.a]) + '</p>' +
          '<p class="ex-wrong-n">考点：' + esc(it.n) + '</p>' +
          examMemoLine(cur.gid, it.q) +
        '</div>';
    }).join('') + '</div>';
  }

  const g = examRun.mode === 'group' ? examGroup(examRun.gid) : null;
  const bankHtml = g ? '<p class="ex-bank">本组词库 · ' + g.bank.map(esc).join(' · ') + '</p>' : '';

  const ruler = examRun.items.map((x, i) => {
    const a = examRun.answers[examKey(x.item, x.gid)];
    return '<span class="ex-res-cell ' + (a && a.ok ? 'is-right' : 'is-wrong') + '" style="--d:' + (i * 18) + 'ms"></span>';
  }).join('');

  view.innerHTML = '<div class="ex-wrap ex-res">' +
      '<div class="ex-res-hero">' +
        '<span class="ex-kicker">' + esc(examRun.title) + ' · 本轮完成</span>' +
        '<p class="ex-res-num"><b id="exScoreNum">0</b> / ' + total + '</p>' +
        '<p class="ex-res-sub">正确率 ' + rate + '%</p>' +
        (bestLine ? '<p class="ex-res-sub">' + bestLine + '</p>' : '') +
      '</div>' +
      (right === total ? '<div class="ex-res-seal">全对</div>' : '') +
      '<div class="ex-res-ruler">' + ruler + '</div>' +
      listHtml +
      '<div class="ex-foot">' +
        '<button class="ex-btn ghost" type="button" data-ex-redo' + (wrongs.length ? '' : ' disabled') + '>重做错题</button>' +
        '<button class="ex-btn ghost" type="button" data-ex-again>再来一轮</button>' +
        '<button class="ex-btn" type="button" data-ex-back>返回题库</button>' +
      '</div>' +
      bankHtml +
    '</div>';

  /* innerHTML 刚换过，必须重新取元素；从 0 涨到 right 才有「结算」的感觉 */
  const numEl = document.getElementById('exScoreNum');
  if(numEl){
    const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    if(reduce || !right){
      numEl.textContent = String(right);
    } else {
      const t0 = performance.now();
      const step = now => {
        const p = Math.min(1, (now - t0) / 500);
        numEl.textContent = String(Math.round(right * p));
        if(p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  }
}
function examRedoWrong(){
  const items = examRun.wrong
    .map(k => examRun.items.find(x => examKey(x.item, x.gid) === k))
    .filter(Boolean);
  if(!items.length) return;
  examRun.mode = 'wrong';
  examRun.gid = '';
  examRun.title = '错题练习';
  examRun.items = shuffle(items);
  examRun.idx = 0;
  examRun.right = 0;
  examRun.wrong = [];
  examRun.answers = {};
  renderExamRun();
}
function examAgain(){
  if(examRun.mode === 'group') examStartGroup(examRun.gid);
  else if(examRun.mode === 'wrong') examStartWrong();
  else examStartMix();
}

/* 期末题库：整块只绑一次事件委托 */
document.getElementById('view-exam').addEventListener('click', (e) => {
  const t = e.target;
  if(t.closest('[data-ex-mm]')){
    e.preventDefault(); e.stopPropagation();
    examOpenMemo();
    return;
  }
  const mmRow = t.closest('[data-ex-mm-row]');
  if(mmRow){
    e.preventDefault(); e.stopPropagation();
    examMemoToggle(mmRow.dataset.exMmRow);
    return;
  }
  const grp = t.closest('[data-ex-group]');
  if(grp){
    e.preventDefault(); e.stopPropagation();
    examStartGroup(grp.dataset.exGroup);
    return;
  }
  if(t.closest('[data-ex-mix]')){
    e.preventDefault(); e.stopPropagation();
    examStartMix();
    return;
  }
  const wb = t.closest('[data-ex-wrong]');
  if(wb){
    e.preventDefault(); e.stopPropagation();
    if(!wb.disabled) examStartWrong();
    return;
  }
  const tr = t.closest('[data-ex-tr]');
  if(tr){
    e.preventDefault(); e.stopPropagation();
    examStartTrans(tr.dataset.exTr);
    return;
  }
  if(t.closest('[data-ex-trans-reveal]')){
    e.preventDefault(); e.stopPropagation();
    examTransReveal();
    return;
  }
  if(t.closest('[data-ex-trans-result]')){
    e.preventDefault(); e.stopPropagation();
    renderExamTransResult();
    return;
  }
  if(t.closest('[data-ex-trans-redo]')){
    e.preventDefault(); e.stopPropagation();
    examStartTrans(examTransRun.id);
    return;
  }
  const trNext = t.closest('[data-ex-trans-next]');
  if(trNext){
    e.preventDefault(); e.stopPropagation();
    examStartTrans(trNext.dataset.exTransNext);
    return;
  }
  const opt = t.closest('[data-ex-opt]');
  if(opt){
    e.preventDefault(); e.stopPropagation();
    examPick(Number(opt.dataset.exOpt));
    return;
  }
  if(t.closest('[data-ex-next]')){
    e.preventDefault(); e.stopPropagation();
    examNext();
    return;
  }
  if(t.closest('[data-ex-redo]')){
    e.preventDefault(); e.stopPropagation();
    examRedoWrong();
    return;
  }
  if(t.closest('[data-ex-again]')){
    e.preventDefault(); e.stopPropagation();
    examAgain();
    return;
  }
  if(t.closest('[data-ex-back]')){
    e.preventDefault(); e.stopPropagation();
    examLeaveRun();
  }
});
