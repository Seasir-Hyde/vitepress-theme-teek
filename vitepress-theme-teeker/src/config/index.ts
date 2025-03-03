import { TkThemeConfig } from "./types";
import Sidebar from "vitepress-plugin-sidebar-resolve";
import Permalink from "vitepress-plugin-permalink";
import MdH1 from "vitepress-plugin-md-h1";
import Catalogue from "vitepress-plugin-catalogue";
import DocAnalysis from "vitepress-plugin-doc-analysis";
import FileContentLoader, { FileContentLoaderOptions } from "vitepress-plugin-file-content-loader";
import AutoFrontmatter from "vitepress-plugin-auto-frontmatter";
import { UserConfig } from "vitepress";
import { PluginOption } from "vite";
import { transformData, transformRaw } from "../post";
import { Post, TkContentData } from "../post/types";
import { todoPlugin, shareCardPlugin, imgCardPlugin, navCardPlugin, codeArrowPlugin } from "../markdown";
import { createCategory, createPermalink } from "./addFrontmatter";

export default function tkThemeConfig(config: TkThemeConfig = {}): UserConfig {
  const { vitePlugins, markdownPlugins = [], ...tkThemeConfig } = config;
  const {
    sidebar = true,
    sidebarOption = {},
    permalink = true,
    permalinkOption,
    mdH1 = true,
    catalogueOption,
    docAnalysis = true,
    docAnalysisOption = {},
    fileContentLoaderIgnore = [],
    autoFrontmatter = false,
    autoFrontmatterOption = {},
  } = vitePlugins || {};

  const plugins: PluginOption[] = [];

  const ignoreDir = {
    autoFrontmatter: ["**/@pages/**"],
    sidebar: ["@pages", "@fragment"],
    docAnalysis: ["@pages", /目录页/],
  };

  if (autoFrontmatter) {
    const {
      pattern,
      globOptions = {},
      transform,
      permalinkPrefix = "pages",
      categories = true,
    } = autoFrontmatterOption;

    if (!pattern) autoFrontmatterOption.pattern = "**/*.md";

    autoFrontmatterOption.globOptions = {
      ...autoFrontmatterOption.globOptions,
      ignore: [...ignoreDir.autoFrontmatter, ...(globOptions.ignore || [])],
    };

    autoFrontmatterOption.transform = (frontmatter, fileInfo) => {
      let transformResult = transform?.(frontmatter, fileInfo) || {};

      if (permalink && !frontmatter.permalink) {
        transformResult = { ...transformResult, ...createPermalink(permalinkPrefix) };
      }
      if (categories && !frontmatter.categories) {
        transformResult = { ...transformResult, ...createCategory(fileInfo, ["@fragment"]) };
      }

      return Object.keys(transformResult).length ? { ...frontmatter, ...transformResult } : undefined;
    };

    plugins.push(AutoFrontmatter(autoFrontmatterOption));
  }

  if (sidebar) {
    sidebarOption.ignoreList = [...(sidebarOption?.ignoreList || []), ...ignoreDir.sidebar];
    plugins.push(Sidebar(sidebarOption));
  }
  if (permalink) plugins.push(Permalink(permalinkOption));
  if (mdH1) plugins.push(MdH1());
  if (docAnalysis) {
    docAnalysisOption.ignoreList = [...(sidebarOption?.ignoreList || []), ...ignoreDir.docAnalysis];
    plugins.push(DocAnalysis(docAnalysisOption));
  }

  if (config.tkTheme !== false) {
    plugins.push(Catalogue(catalogueOption));

    const fileContentLoaderOptions: FileContentLoaderOptions<TkContentData, Post> = {
      pattern: ["**/*.md"],
      // 指定摘录格式
      excerpt: "<!-- more -->",
      includeSrc: true,
      transformData,
      transformRaw,
      themeConfigKey: "posts",
      globOptions: {
        ignore: ["**/components/**", "**/.vitepress/**", "**/public/**", ...fileContentLoaderIgnore],
      },
    };

    plugins.push(FileContentLoader<TkContentData, Post>(fileContentLoaderOptions));
  }

  return {
    // 使用永久链接插件需要忽略死链提醒
    ignoreDeadLinks: true,
    vite: {
      plugins: plugins as any,
      // 解决项目启动后终端打印 Scss 的废弃警告：The legacy JS API is deprecated and will be removed in Dart Sass 2.0.0.
      css: { preprocessorOptions: { scss: { api: "modern" } } },
      optimizeDeps: {
        include: ["element-plus", "@giscus/vue", "@waline/client"],
      },
    },
    markdown: {
      config: md => {
        [todoPlugin, shareCardPlugin, imgCardPlugin, navCardPlugin, codeArrowPlugin].forEach(plugin => md.use(plugin));
        // 用户配置的 markdown 插件
        markdownPlugins.forEach(plugin => md.use(plugin));
      },
    },
    themeConfig: tkThemeConfig,
  };
}
