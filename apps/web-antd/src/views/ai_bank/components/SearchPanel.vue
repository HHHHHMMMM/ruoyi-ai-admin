<template>
  <div class="search-panel">
    <div class="panel-header">
      <SearchOutlined class="search-icon" />
      <span class="panel-title">节点搜索</span>
    </div>
    <div class="panel-content">
      <a-form layout="vertical" :model="formState">
        <a-form-item>
          <a-input-search
            v-model:value="formState.keyword"
            placeholder="输入节点名称或属性关键词"
            enter-button
            allow-clear
            @search="handleSearch"
          />
        </a-form-item>

        <a-form-item label="搜索类型">
          <a-select
            v-model:value="formState.searchType"
            placeholder="选择搜索类型"
            style="width: 100%"
          >
            <a-select-option value="name">节点名称</a-select-option>
            <a-select-option value="property">节点属性</a-select-option>
            <a-select-option value="all">全部</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item
          v-if="formState.searchType === 'property'"
          label="属性字段"
        >
          <a-select
            v-model:value="formState.propertyField"
            placeholder="选择属性字段"
            style="width: 100%"
          >
            <a-select-option value="id">ID</a-select-option>
            <a-select-option value="name">名称</a-select-option>
            <a-select-option value="description">描述</a-select-option>
            <a-select-option value="type">类型</a-select-option>
            <a-select-option value="all">全部属性</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item>
          <a-radio-group
            v-model:value="formState.searchMode"
            button-style="solid"
          >
            <a-radio-button value="fuzzy">
              <template #icon><AimOutlined /></template>
              模糊
            </a-radio-button>
            <a-radio-button value="exact">
              <template #icon><FullscreenOutlined /></template>
              精确
            </a-radio-button>
          </a-radio-group>
        </a-form-item>
      </a-form>

      <a-divider style="margin: 8px 0" />

      <div v-if="searchHistory.length > 0" class="search-history">
        <div class="history-header">
          <span>搜索历史</span>
          <a-button type="link" size="small" @click="clearHistory">
            <template #icon><DeleteOutlined /></template>
            清空
          </a-button>
        </div>
        <a-list size="small">
          <a-list-item v-for="(item, index) in searchHistory" :key="index">
            <a-tag
              color="blue"
              class="history-tag"
              @click="applyHistorySearch(item)"
            >
              {{ item.keyword }}
              <template #icon><SearchOutlined /></template>
            </a-tag>
          </a-list-item>
        </a-list>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref } from 'vue';
import {
  SearchOutlined,
  AimOutlined,
  FullscreenOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue';

export default defineComponent({
  name: 'SearchPanel',
  components: {
    SearchOutlined,
    AimOutlined,
    FullscreenOutlined,
    DeleteOutlined,
  },
  emits: ['search'],
  setup(props, { emit }) {
    const formState = reactive({
      keyword: '',
      searchType: 'all',
      propertyField: 'all',
      searchMode: 'fuzzy',
    });

    const searchHistory = ref<any[]>([]);

    const handleSearch = () => {
      const searchParams = { ...formState };
      searchHistory.value.push(searchParams);
      emit('search', searchParams);
    };

    const clearHistory = () => {
      searchHistory.value = [];
    };

    const applyHistorySearch = (item: any) => {
      Object.assign(formState, item);
      handleSearch();
    };

    return {
      formState,
      searchHistory,
      handleSearch,
      clearHistory,
      applyHistorySearch,
    };
  },
});
</script>
