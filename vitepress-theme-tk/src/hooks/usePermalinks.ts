import { useRouter, useData } from "vitepress";
import { nextTick, onMounted } from "vue";
import { inBrowser } from "../helper";

export function usePermalinks() {
  const fakeHost = "http://a.com";
  const router = useRouter();
  const { site } = useData();
  const { permalinks = {}, base } = site.value;

  /**
   * 为 vitepress 的 router 添加 push 方法，支持手动跳转 permalink
   * 根据传入的 href 动态判断是否为文档地址或 permalink，如果为文档地址，则走 vitepress 默认的 go 方法，如果为 permalink，则根据 permalink 跳转对应的文档地址
   *
   * @param href 文档地址或 permalink
   */
  router.push = async (href = inBrowser ? location.href : "/") => {
    if (!href) throw new Error("href is undefined");

    const { pathname, search, hash } = new URL(href, fakeHost);
    // 解码，支持中文
    const decodePath = decodeURIComponent(pathname);
    const decodeHash = decodeURIComponent(hash);
    // 根据文档地址找 permalink
    let permalink = permalinks.map[decodePath];

    // 如果当前 pathname 和 permalink 相同，则直接跳转，等价于直接调用 go 方法
    if (permalink === decodePath) return router.go(href);

    if (!permalink) {
      // 如果 permalink 不存在，则根据 permalink 找 pathname
      const path = permalinks.inv[pathname];

      // 如果 path 存在，则进行更新
      if (path) {
        permalink = pathname;
        href = `${path}${search}${decodeHash}`;
      }
    }

    // 执行 vitepress 的 go 方法进行跳转
    router.go(href);
  };

  /**
   * 判断路由是否为文档路由
   * 1. 如果为文档路由，则替换为 permalink
   * 2. 如果为 permalink，则跳转到文档路由，然后重新触发该方法的第 1 点，即将文档路由替换为 permalink
   *
   * @param href 浏览器地址栏
   * @remark 第 2 点的逻辑已由 vitepress-plugin-permalink 插件实现了，这里留着只是二次预防
   */
  const processUrl = async (href: string) => {
    if (!Object.keys(permalinks).length) return;

    const { pathname, search, hash } = new URL(href, fakeHost);

    // 解码，支持中文
    const decodePath = decodeURIComponent(pathname.slice(base.length));
    const decodeHash = decodeURIComponent(hash);
    const permalink = permalinks.map[decodePath];

    // 如果当前 pathname 和 permalink 相同，则不需要处理
    if (permalink === decodePath) return;

    if (permalink) {
      // 存在 permalink 则在 URL 替换
      await nextTick();
      history.replaceState(history.state || null, "", `${permalink}${search}${decodeHash}`);
    } else {
      // 不存在 permalink 则跳转
      const path = permalinks.inv[`/${decodePath}`];
      if (path) return router.push(`${path}${search}${decodeHash}`);
    }
  };

  onMounted(() => processUrl(window.location.href));

  /**
   * 监听路由变化（刷新页面不会触发），处理路由地址
   */
  const startWatch = () => {
    const selfOnAfterRouteChanged = router.onAfterRouteChanged;
    router.onAfterRouteChanged = async (href: string) => {
      // 处理路由地址
      processUrl(href);

      // 调用已有的 onAfterRouteChanged
      selfOnAfterRouteChanged?.(href);
    };
  };

  return { startWatch };
}
