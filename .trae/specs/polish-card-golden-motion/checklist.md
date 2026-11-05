# Checklist

## 排版
- [x] `:root` 存在 `--phi:1.618` 与 `.382/.618/1/1.618rem` 间距阶梯，正面的间距/字号引用该阶梯（`.face` 内边距两面对称复用）
- [x] 正面字号形成清晰的黄金阶梯：词 > 释义 > 场景/音标 > 构词/词性
- [x] `.art-frame` 渲染宽高比约为 1.618:1（实测误差 < 1px）
- [x] 390×844 下正面所有区块完整可见、无裁切、无横向溢出
- [x] 390×640 下图形框高度收敛到 `clamp(96px,30vh,200px)`，评分按钮仍完整可点

## 动效
- [x] 切卡时正面子块按 40ms 级联入场，单张 ≤ 600ms，无布局跳动
- [x] 图形框有入场缩放与缓慢呼吸，不影响拖动/翻面
- [x] 点击评分按钮出现语义色压印环，评分流程无延迟
- [x] `deckPos` 变化有数字 tick；今日达标进度线扫光且当天只触发一次
- [x] `prefers-reduced-motion: reduce` 下无位移动画残留

## 音效
- [x] `rate2/rate1/rate0/skip` 四种评分音色可区分且不串音
- [x] `flip/drop/ok/bad/goal` 六类音效在对应动作触发
- [x] 首次手势前不发声；`prefers-reduced-motion` 不影响音效开关本身
- [x] `deck-meta` 喇叭按钮可切换，刷新后保持；`wc_sound_v1` 为唯一新增键
- [x] 音效不打断 `speechSynthesis` 朗读，页面隐藏后不再发声

## 回归
- [x] 四向滑动判定与方向提示与改造前一致
- [x] 点按翻面、背面左右滑切卡正常
- [x] 背面字母格子拖拽、自动判定、`刷剩下的` 重开逻辑未受影响
- [x] 自测 Enter、进度持久化、`mb.rated` 7 天清理未受影响
- [x] `git diff` 仅包含 `mobile/index.html` 与 `.trae/specs/polish-card-golden-motion/`
