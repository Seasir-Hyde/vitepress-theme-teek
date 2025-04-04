# vitepress-theme-teek

基础功能已完成开发，剩余加强功能请看下面的 TODO。

## 使用

项目拉取

```bash
git clone https://github.com/Kele-Bingtang/vitepress-theme-teek.git
```

依赖安装（只能用 pnpm 安装依赖）

```bash
pnpm install
```

引用包构建

```bash
pnpm to:theme stub
```

## 项目启动

文档项目启动

```bash
pnpm docs:dev
```

Demo 项目启动（三选一）

```bash
# 基本文档 Demo
pnpm demo:base dev
# 国际化文档 Demo（默认语言的文档放到根目录下）
pnpm demo:locales dev
# 国际化文档 Demo（默认语言的文档放到指定目录下）
pnpm demo:localesRoot dev
```

如果项目启动失败，则执行如下命令后再启动：

```base
pnpm plugin:build
```

## 配置

主题提供了大量的配置，可以在 `src/config/types.ts` 文件阅读配置项。

## TODO

- 添加 demo 容器
- md 插件代码优化
- 部署文档站
- 支持无障碍
- 归档页添加 commit 图标风格，如：`http://niubin.site/archive.html`
