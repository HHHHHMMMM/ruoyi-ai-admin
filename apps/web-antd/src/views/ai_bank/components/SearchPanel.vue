<template>
  <div class="search-panel">
    <div class="panel-header">
      <SearchOutlined class="search-icon" />
      <span class="panel-title">问题搜索</span>
    </div>
    <div class="panel-content">
      <Form layout="vertical" :model="formState">
        <FormItem>
          <InputSearch
            v-model:value="formState.keyword"
            placeholder="输入问题名称"
            enter-button
            allow-clear
            @search="handleSearch"
          />
        </FormItem>

        <FormItem>
          <RadioGroup v-model:value="formState.searchMode" button-style="solid">
            <RadioButton value="fuzzy">
              <template #icon><AimOutlined /></template>
              模糊
            </RadioButton>
            <RadioButton value="exact">
              <template #icon><FullscreenOutlined /></template>
              精确
            </RadioButton>
          </RadioGroup>
        </FormItem>
      </Form>

      <Divider style="margin: 8px 0" />

      <div v-if="searchHistory.length > 0" class="search-history">
        <div class="history-header">
          <span>搜索历史</span>
          <Button type="link" size="small" @click="clearHistory">
            <template #icon><DeleteOutlined /></template>
            清空
          </Button>
        </div>
        <List size="small">
          <ListItem v-for="(item, index) in searchHistory" :key="index">
            <Tag
              color="blue"
              class="history-tag"
              @click="applyHistorySearch(item)"
            >
              {{ item.keyword }}
              <template #icon><SearchOutlined /></template>
            </Tag>
          </ListItem>
        </List>
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
import {
  Form,
  FormItem,
  InputSearch,
  RadioGroup,
  RadioButton,
  Divider,
  Button,
  List,
  ListItem,
  Tag,
} from 'ant-design-vue';

export default defineComponent({
  name: 'SearchPanel',
  components: {
    SearchOutlined,
    AimOutlined,
    FullscreenOutlined,
    DeleteOutlined,
    Form,
    FormItem,
    InputSearch,
    RadioGroup,
    RadioButton,
    Divider,
    Button,
    List,
    ListItem,
    Tag,
  },
  emits: ['search'],
  setup(props, { emit }) {
    const formState = reactive({
      keyword: '',
      searchMode: 'fuzzy',
    });

    const searchHistory = ref<any[]>([]);

    const handleSearch = () => {
      const searchParams = {
        ...formState,
        searchType: 'problem', // 固定搜索类型为problem
      };
      searchHistory.value.push(searchParams);
      emit('search', searchParams);
    };

    const clearHistory = () => {
      searchHistory.value = [];
    };

    const applyHistorySearch = (item: any) => {
      Object.assign(formState, {
        keyword: item.keyword,
        searchMode: item.searchMode,
      });
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

<style lang="less" scoped>
.search-panel {
  display: flex;
  flex-direction: column;
  height: 100%;

  .panel-header {
    padding: 12px 16px;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    align-items: center;

    .search-icon {
      margin-right: 8px;
      color: #1890ff;
    }

    .panel-title {
      font-size: 16px;
      font-weight: 500;
    }
  }

  .panel-content {
    padding: 12px;
    flex: 1;
    overflow-y: auto;
  }

  .search-history {
    margin-top: 16px;

    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .history-tag {
      cursor: pointer;
    }
  }
}
</style>
