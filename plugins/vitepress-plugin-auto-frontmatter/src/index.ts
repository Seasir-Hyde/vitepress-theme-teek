import { normalizePath, Plugin } from "vite";
import { AutoFrontmatterOption } from "./types";
import { basename, extname, join, relative, resolve } from "node:path";
import { glob } from "tinyglobby";
import matter from "gray-matter";
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { formatDate } from "./util";
import picocolors from "picocolors";

export * from "./types";

export const log = (message: string, type = "yellow") => {
  console.log((picocolors as any)[type](message));
};

export default function VitePluginVitePressAutoFrontmatter(
  option: AutoFrontmatterOption = {}
): Plugin & { name: string } {
  return {
    name: "vitepress-plugin-auto-frontmatter",
    async config(config: any) {
      let { pattern } = option;
      if (!pattern) return;

      const { globOptions } = option;
      const { srcDir } = config.vitepress;

      if (typeof pattern === "string") pattern = [pattern];
      // 基于文档源目录 srcDir 匹配
      pattern = pattern.map(p => normalizePath(join(srcDir, p)));

      const filePaths = (
        await glob(pattern, {
          expandDirectories: false,
          ...globOptions,
          absolute: true,
          ignore: ["**/node_modules/**", "**/dist/**", ...(globOptions?.ignore || [])],
        })
      ).sort();

      writeFrontmatterToFile(filePaths, option, srcDir);
    },
  };
}

/**
 * 自动生成 frontmatter 并写入到 markdown 文件
 *
 * @param filePaths 文件路径列表
 * @param option 插件配置项
 * @param srcDir vp 配置项的 srcDir
 */
const writeFrontmatterToFile = (filePaths: string[], option: AutoFrontmatterOption, srcDir: string) => {
  const { include, exclude, transform } = option;

  for (const filePath of filePaths) {
    if (!filePath.endsWith(".md")) continue;

    const filename = basename(filePath, extname(filePath));
    const fileContent = readFileSync(filePath, "utf-8");
    const { data: frontmatter, content } = matter(fileContent);

    if (frontmatter.layout === "home") continue;

    const isPass = checkExcludeAndInclude(frontmatter, { exclude, include });
    if (!isPass) continue;

    let tempFrontmatter = { ...frontmatter };
    let hasChange = false;

    const addInfo: Record<string, any> = {
      title: filename,
      date: statSync(filePath).birthtime,
    };

    for (const [key, value] of Object.entries(addInfo)) {
      if (!frontmatter[key]) {
        // 放到最前面
        tempFrontmatter = { [key]: value, ...tempFrontmatter };
        hasChange = true;
      }
    }

    const transformResult = transform?.(tempFrontmatter, getFileInfo(srcDir, filePath));
    // 如果 frontmatter 没有修改过，且 transform 不存在，则代表下面不需要修改文件
    if (!hasChange && !transformResult) continue;

    const finalFrontmatter = transformResult || tempFrontmatter;
    // 确保日期格式为 yyyy-MM-dd hh:mm:ss
    finalFrontmatter.date = formatDate(tempFrontmatter.date);

    // 如果源文件的 frontmatter 已经全部包含处理后的 frontmatter，则不需要修改
    if (Object.keys(finalFrontmatter).every(key => frontmatter[key])) continue;

    // 转换为 --- xxx --- 字符串
    const frontmatterStr = Object.keys(finalFrontmatter).length
      ? matter.stringify("", finalFrontmatter).replace(/'/g, "")
      : "";

    // 将修改后的内容写入文件，EOL 为换行
    writeFileSync(filePath, `${frontmatterStr}${content}`);

    log(`'${filePath}' has been successfully written to frontmatter. (成功写入 frontmatter)`, "green");
  }
};

export const checkExcludeAndInclude = (
  frontmatter: Record<string, any>,
  { exclude, include }: AutoFrontmatterOption
) => {
  // 存在 include 但是不存在 frontmatter，则代表改文件不符合 include 要求
  if (include && !Object.keys(frontmatter).length) return false;

  if (exclude || include) {
    for (const [key, value] of Object.entries(frontmatter)) {
      // 如果设置了 exclude，则不匹配 exclude
      if (exclude?.[key] === value) return false;
      // 如果设置了 include，则只匹配 include
      if (include?.[key] !== value) return false;
    }
  }

  return true;
};

/**
 * 获取文件信息
 *
 * @param srcDir vp 配置项的 srcDir
 * @param filePath  文件路径
 */
export const getFileInfo = (srcDir: string, filePath: string) => {
  // 确保路径是绝对路径
  const workingDir = resolve(srcDir);
  const absoluteFilePath = resolve(filePath);
  // 计算相对路径
  const relativePath = relative(workingDir, absoluteFilePath).replace(/\\/g, "/");

  return { filePath, relativePath };
};
