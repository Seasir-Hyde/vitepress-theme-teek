<script setup lang="ts" name="HomeRightInfo">
import { computed, unref } from "vue";
import { useData } from "vitepress";
import { useNamespace } from "../../../hooks";
import { usePage, useUnrefData } from "../../../configProvider";
import HomeMyCard from "../../HomeMyCard";
import HomeCategoryCard from "../../HomeCategoryCard";
import HomeTagCard from "../../HomeTagCard";
import HomeFriendLinkCard from "../../HomeFriendLinkCard";
import HomeTopArticleCard from "../../HomeTopArticleCard";
import HomeDocAnalysisCard from "../../HomeDocAnalysisCard";

defineOptions({ name: "HomeRightInfo" });

const ns = useNamespace("homeRightInfo");

const { frontmatter } = useData();
const { theme } = useUnrefData();
const { topArticle, category, tag, docAnalysis, friendLink, homeCardSort } = { ...theme, ...unref(frontmatter) };

const enabledTopArticleCard = topArticle?.enabled !== false;
const enabledCategoryCard = category?.enabled !== false;
const enabledTagCard = tag?.enabled !== false;
const enabledDocAnalysisCard = docAnalysis?.enabled !== false;
const enabledFriendLinkCard = friendLink?.enabled !== false;

// 获取用户配置 + 默认的卡片排序
const finalHomeCardSort = computed(() => {
  const configCardSort = homeCardSort || [];
  return ["my", ...new Set([...configCardSort, ...["topArticle", "category", "tag", "friendLink", "docAnalysis"]])];
});

const { isHomePage, isCategoriesPage, isTagsPage } = usePage();

// 定义组件映射
const componentMap = computed(() => {
  const homePage = unref(isHomePage);
  const categoriesPage = unref(isCategoriesPage);
  const tagsPage = unref(isTagsPage);

  return {
    my: {
      el: HomeMyCard,
      show: homePage,
      slot: ["-home-my-before", "-home-my-after"],
    },
    topArticle: {
      el: HomeTopArticleCard,
      show: homePage && enabledTopArticleCard,
      slot: ["-home-top-article-before", "-home-top-article-after"],
    },
    category: {
      el: HomeCategoryCard,
      props: { categoriesPage: categoriesPage },
      show: (homePage || categoriesPage) && enabledCategoryCard,
      slot: ["-home-category-before", "-home-category-after"],
    },
    tag: {
      el: HomeTagCard,
      props: { tagsPage: tagsPage },
      show: (homePage || tagsPage) && enabledTagCard,
      slot: ["-home-tag-before", "-home-tag-after"],
    },
    docAnalysis: {
      el: HomeDocAnalysisCard,
      show: homePage && enabledDocAnalysisCard,
      slot: ["-home-doc-analysis-before", "-home-doc-analysis-after"],
    },
    friendLink: {
      el: HomeFriendLinkCard,
      show: homePage && enabledFriendLinkCard,
      slot: ["-home-friend-link-before", "-home-friend-link-after"],
    },
  };
});
</script>

<template>
  <div :class="[ns.b(), 'flx-column']">
    <slot name="teek-home-info-before" />

    <template v-for="item in finalHomeCardSort" :key="item">
      <component v-if="componentMap[item]?.show" :is="componentMap[item]?.el" v-bind="componentMap[item]?.props">
        <template v-for="name in componentMap[item]?.slot" :key="name" #[name]>
          <slot :name="name" />
        </template>
      </component>
    </template>

    <slot name="teek-home-info-after" />
  </div>
</template>
