# Microsoft Edge 上架填写参考（深色模式 1.0.0）

## 提交包

`dark-mode-chromium.zip`（在插件目录运行 `npm run pack`）

Firefox 用 `dark-mode-firefox.xpi`。不要上传源码目录。

## 商店语言

只保留两行：

- English
- Chinese (China)

设置页里的繁体中文不要单独作为商店语言。如果后台还留着 Chinese (Taiwan)，点 Remove。

分类：Productivity。不要勾选 Mature content。

反馈邮箱：hangdudu0@agent.qq.com

## 名称

English：

```
Dark Mode - Dark Theme for Websites
```

Chinese (China)：

```
深色模式 - 网页夜间模式
```

## 简短说明

这是扩展包里的短说明，不是下面的详细 Description。

English：

```
Turn on a dark theme for websites, and adjust brightness, contrast, and warmth for each site.
```

Chinese (China)：

```
为网页开启夜间模式，可按网站调节亮度、对比度和色温。
```

## English Description

```
Dark Mode turns websites into a dark theme and lets you tune the look for each site.

Choose Dark, Filter, or Normal. Dark paints the page with the current theme. Filter only adjusts brightness and warmth, without converting the page to dark. Normal leaves the site unchanged. Save the choice for the current site or apply it to all sites. Sites you have already set keep their own settings.

Adjust brightness, contrast, saturation, warmth, and dimming. The extension interface and the webpage share one theme, so changing it updates both. Settings include Simplified Chinese, Traditional Chinese, and English. You can export and import your settings.

Right-click a page to toggle dark mode for that site. Browser internal pages, the extension store, and other protected pages cannot be changed.

Feedback: hangdudu0@agent.qq.com
```

## 中文 Description

```
深色模式可以为网页开启夜间主题，并按网站分别调节显示效果。

可选深色、滤镜或普通。深色会用当前主题给网页上色。滤镜只调节明暗和色温，不会把网页改成深色。普通则保持这个网站原样。设置可以只保存到当前网站，也可以应用到全部网站。已经单独设置过的网站保持不变。

可调节亮度、对比度、饱和度、色温和变暗。扩展界面和网页共用同一套主题，改一处两边一起变。设置里可切换简体中文、繁体中文和 English。支持导出和导入设置。

在网页上右键，可以切换这个网站的深色模式。浏览器内部页、扩展商店和其他受保护页面无法改色。

反馈邮箱：hangdudu0@agent.qq.com
```

## Search terms

一项一项点 Add Term。每种语言最多 7 个。

English：

```
dark mode
dark theme
night mode
website dark mode
eye comfort
brightness
contrast
```

Chinese (China)：

```
深色模式
夜间模式
网页暗色
护眼
暗黑模式
亮度
对比度
```

## Single purpose

English：

```
Dark Mode applies a dark theme to ordinary websites and lets the user adjust brightness, contrast, saturation, warmth, and dimming for each site. It does not collect browsing history.
```

中文：

```
深色模式为普通网页应用夜间主题，并允许用户按网站调节亮度、对比度、饱和度、色温和变暗。不收集浏览记录。
```

## Permission justification

**storage**

```
Save theme, per-site mode, and slider values on this device only.
```

```
只在本机保存主题、每个网站的模式和滑杆数值。
```

**tabs**

```
Find the current tab and refresh dark mode on open pages after the user changes a setting.
```

```
识别当前标签页，并在用户更改设置后更新已经打开的网页。
```

**scripting**

```
Apply the dark theme stylesheet to a webpage when the user turns dark mode on.
```

```
在用户开启深色模式时，把夜间主题样式应用到网页。
```

**contextMenus**

```
Add a right-click command that toggles dark mode for the current site.
```

```
增加右键菜单，用来切换当前网站的深色模式。
```

**Site access / all websites**

```
Dark mode has to run on the websites the user visits. It cannot change browser internal pages, the extension store, or other protected pages.
```

```
深色模式需要在用户访问的网站上生效。浏览器内部页、扩展商店和其他受保护页面无法改色。
```

## Remote code

选择：No, I am not using remote code。

配置接口只读取评分开关和商店链接，不执行远程代码。评分默认关闭。

## Data usage

网站使用记录只保存在本机，用来判断是否显示评分。不上传浏览记录，不出售数据。
