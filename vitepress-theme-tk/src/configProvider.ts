import { defineComponent, h, InjectionKey, provide, Ref, unref, type Component } from "vue";
import { usePermalinks, useAnchorScroll, useViewTransition } from "./hooks";
import type { Post } from "./data/post";
// @ts-ignore
import { data as posts } from "./data/posts.data";
import { useData } from "vitepress";
import "./styles/dark-transition.css";

export const postsSymbol: InjectionKey<Ref<Post>> = Symbol("posts");

function createConfigProvider(Layout: Component) {
  return defineComponent({
    name: "ConfigProvider",
    setup(_, { slots }) {
      // 往主题注入数据
      provide(postsSymbol, posts);

      // 开启监听器
      usePermalinks().startWatch();
      useAnchorScroll().startWatch();
      useViewTransition();

      return () => h(Layout, null, slots);
    },
  });
}

export const configProvider = (Layout: Component) => {
  return createConfigProvider(Layout);
};

export const useThemeConfig = () => {
  const { theme } = useData();
  return unref(theme);
};

export const isHomePages = () => {
  return !isCategoriesPages() && !isTagsPages();
};

export const isCategoriesPages = () => {
  const { frontmatter } = useData();
  return unref(frontmatter).categoriesPage;
};

export const isTagsPages = () => {
  const { frontmatter } = useData();
  return unref(frontmatter).tagsPage;
};
