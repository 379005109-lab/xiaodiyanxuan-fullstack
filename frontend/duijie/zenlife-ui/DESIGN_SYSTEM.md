# ZenLife UI/UX Design Standards
版本: 2.0 (Fresh Nature Gradient)

## 1. 核心色彩系统 (Color System)

### 品牌主渐变 (Primary Gradient)
用于：主要CTA按钮、选中状态导航、高亮图标。
*   **CSS Class:** `bg-gradient-to-r from-cyan-400 to-emerald-400`
*   **Hex Values:** Start `#22d3ee` -> End `#34d399`
*   **视觉感受:** 清新、医疗/科技感、自然、活力。

### 全局背景渐变 (Global Background)
用于：所有页面的底层背景。
*   **CSS Class:** `bg-gradient-to-b from-sky-100 via-sky-50 to-primary-100`
*   **Hex Values:** Top `#e0f2fe` -> Mid `#f0f9ff` -> Bottom `#dcfce7`
*   **视觉感受:** 通透、呼吸感、无边界。

### 功能色 (Functional Colors)
*   **价格金 (Value Gold):** `#d97706` (text-gold-600) - 仅用于价格数字，强调价值。
*   **文本黑 (Text Dark):** `#1f2937` (text-gray-800) - 用于一级标题。
*   **文本灰 (Text Light):** `#9ca3af` (text-gray-400) - 用于辅助说明、副标题。
*   **错误/收藏 (Alert Red):** `#ef4444` (text-red-500) - 爱心、错误提示。

---

## 2. 质感与特效 (Effects & Materials)

### 玻璃拟态 (Glassmorphism)
用于：底部导航栏、顶部搜索栏、悬浮按钮。
*   **背景:** `bg-white/80` (白色透明度80%)
*   **模糊:** `backdrop-blur-md` (中等背景模糊)
*   **边框:** `border border-white/50` (半透明白色描边，增加精致感)

### 阴影系统 (Shadows)
*   **卡片投影 (Card Shadow):** `shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)]` - 柔和的大面积阴影。
*   **彩色发光 (Glow Shadow):** `shadow-[0_10px_20px_-5px_rgba(52,211,153,0.4)]` (Emerald色调)
    *   *应用:* 所有渐变按钮必须搭配此彩色阴影，使按钮看起来是“浮起来”且发光的。

### 圆角 (Border Radius)
*   **卡片:** `rounded-3xl` (24px) - 极度圆润，亲和力强。
*   **按钮:** `rounded-full` (9999px) - 胶囊型。
*   **小元素:** `rounded-2xl` (16px) - 图标容器、小卡片。

---

## 3. 字体排版 (Typography)

*   **英文数字:** "Plus Jakarta Sans" - 几何感强，现代。
*   **中文:** "Noto Sans SC" - 屏显优化。
*   **Hero Logo:** 自定义 `font-sans`, 字重 `700+`, 尺寸 `200px+`。

---

## 4. 动效规范 (Motion)

*   **悬浮 (Hover):** `scale-105` (放大5%) + `shadow-lg`。
*   **点击 (Active):** `scale-95` (缩小5%)。
*   **页面入场:** `animate-fade-in` (透明度从0到1，位移10px)。
*   **持续漂浮:** `animate-float` (6秒循环上下浮动)。

---

## 5. 组件实例标准 (Component Specs)

### 底部主按钮 (Primary Button)
*   高度: `56px` (py-3/4)
*   圆角: `rounded-full`
*   背景: Cyan-Emerald Gradient
*   阴影: Colored Glow Shadow
*   图标: 白色，左侧对齐

### 底部导航栏 (Floating Dock)
*   位置: 距离底部 `24px` (bottom-6)
*   边距: 左右 `24px` (mx-6)
*   材质: Glassmorphism (带模糊)
*   选中态: 渐变背景圆形 + 白色图标 + 发光阴影