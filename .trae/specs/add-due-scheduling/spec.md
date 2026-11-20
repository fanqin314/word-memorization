# 间隔重复调度（dueAt）Spec

## Why

手机刷词端没有「下次该复习哪一天」的概念：三档评级只改掌握度与打开次数，队列每次重建只按掌握度排序，认识的词靠词量小才被推到后面。数据页「待复习」依赖完整词卡页的打卡数据，手机刷词流程里没有打卡入口，这个数字长期为 0。

## What Changes

- 在 `store[word]` 新增 `dueAt`（当天 0 点的时间戳，缺省 0 = 从未排期、视为已到期）。
- 评级时写入下一次到期日：不认识 → 今天 0 点；有点印象 → 明天 0 点；认识 → 3 天后 0 点。
- `buildQueue` 改为按 `dueAt` 升序、再按掌握度、再按单词排序；保留「今天已评级的排到队尾」与 `onlyFresh` 语义。
- 删除 `isDue`（只被队列和数据页使用），数据页「待复习」改为按 `dueAt` 计算的真实到期数。
- 不新增 localStorage 键，不改 `wc_mobile_v1` 结构；桌面端写入的既有字段不受影响。
- 不改「复习今天刷过的」：评级照常重写 `dueAt`。

## Impact

- 受影响能力：刷词队列顺序、数据页统计、评级副作用。
- 受影响代码：`mobile/index.html` —— `startOfDay`（新增）、`rec`、`dueAfter`（新增）、`rateWord`、`buildQueue`、`isDue`（删除）、数据页渲染处。
- 不属于本次范围：方案 B 的 3→7→15 递进、跨 0 点不刷新重排、刷完自动弹自测。

## ADDED Requirements

### Requirement: 按天排期

系统 SHALL 为每个词维护 `dueAt` 到期日，并以「天」为最小单位，不出现「第三晚 11 点才算到期」的情况。

#### Scenario: 评级写入到期日
- **WHEN** 用户在 D0 23:50 对某词点「认识」
- **THEN** 该词 `dueAt` 为 D0 的 0 点 + 3 天（即 D3 0 点）
- **AND** D3 早上重建队列时该词已算到期

#### Scenario: 不认识
- **WHEN** 用户点「不认识」
- **THEN** `dueAt` 为今天 0 点
- **AND** 该词今天不会重复出现（今天已评级词排到队尾），次日进入到期队列前排

### Requirement: 队列按到期排序

系统 SHALL 让 `buildQueue` 以 `dueAt` 升序为主序。

#### Scenario: 到期优先
- **WHEN** 存在 `dueAt = 0`（从未排期）、`dueAt = 昨天`、`dueAt = 明天` 三类词
- **THEN** 队列顺序为：0 → 昨天 → 明天
- **AND** 同一 `dueAt` 与同一掌握度的并列项按字母序，结果稳定可复现

#### Scenario: 今天已评级
- **WHEN** 某词今天已被评级
- **THEN** 它在队列中仍排在最后（`fresh.concat(done)` 不变）
- **AND** `buildQueue(true)` 仍只含今天未评级的词

### Requirement: 待复习数字可解释

系统 SHALL 用 `dueAt` 计算数据页「待复习」，不再依赖卡片页打卡。

#### Scenario: 到期计数
- **WHEN** 有 N 个词 `dueAt <= 今天 0 点`
- **THEN** 数据页显示「待复习 N」
- **AND** 今天刚点「不认识」的词会 +1（欠一次，但今天不再出现），接受这一处小出入

## REMOVED Requirements

### Requirement: 打卡驱动的待复习
**Reason**: `isDue` 只读 `<word>_review`，该数据由完整词卡页打卡写入，手机刷词流程不产生，指标长期为 0。
**Migration**: 不再用于队列与数据页；`reviewDone` 保留供词库详情「打卡 x/4」与卡片显示使用。旧数据无需迁移，缺 `dueAt` 即视为到期，行为与升级前一致。
