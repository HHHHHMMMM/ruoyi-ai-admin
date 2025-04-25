<!--
意图实体映射表单
-->
<script setup lang="ts">
import type { RuleObject } from 'ant-design-vue/es/form';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { cloneDeep } from '@vben/utils';

import { Form, FormItem, Input, InputNumber, RadioGroup } from 'ant-design-vue';
import { pick } from 'lodash-es';

import {
  intentEntityAdd,
  intentEntityInfo,
  intentEntityUpdate,
} from '#/api/system/intent-entity';

const emit = defineEmits<{ reload: [] }>();

const isUpdate = ref(false);
const title = computed(() => {
  return isUpdate.value ? $t('pages.common.edit') : $t('pages.common.add');
});

/**
 * 定义表单数据类型
 */
interface FormData {
  id?: number;
  intentType?: string;
  entityName?: string;
  isRequired?: number;
  priority?: number;
  promptTemplate?: string;
}

/**
 * 定义默认值 用于reset
 */
const defaultValues: FormData = {
  id: undefined,
  intentType: '',
  entityName: '',
  isRequired: 1,
  priority: 1,
  promptTemplate: '',
};

/**
 * 表单数据ref
 */
const formData = ref(defaultValues);

type AntdFormRules<T> = Partial<Record<keyof T, RuleObject[]>> & {
  [key: string]: RuleObject[];
};
/**
 * 表单校验规则
 */
const formRules = ref<AntdFormRules<FormData>>({
  intentType: [{ required: true, message: $t('ui.formRules.required') }],
  entityName: [{ required: true, message: $t('ui.formRules.required') }],
  isRequired: [{ required: true, message: $t('ui.formRules.selectRequired') }],
  priority: [{ required: true, message: $t('ui.formRules.required') }],
});

/**
 * useForm解构出表单方法
 */
const { validate, validateInfos, resetFields } = Form.useForm(
  formData,
  formRules,
);

const [BasicModal, modalApi] = useVbenModal({
  class: 'w-[800px]',
  fullscreenButton: true,
  closeOnClickModal: false,
  onClosed: handleCancel,
  onConfirm: handleConfirm,
  onOpenChange: async (isOpen) => {
    if (!isOpen) {
      return null;
    }
    modalApi.modalLoading(true);
    const { id } = modalApi.getData() as { id?: number | string };
    isUpdate.value = !!id;
    if (isUpdate.value && id) {
      const record = await intentEntityInfo(id);
      // 只赋值存在的字段
      const filterRecord = pick(record, Object.keys(defaultValues));
      formData.value = filterRecord;
    }
    modalApi.modalLoading(false);
  },
});

async function handleConfirm() {
  try {
    modalApi.modalLoading(true);
    await validate();
    // 可能会做数据处理 使用cloneDeep深拷贝
    const data = cloneDeep(formData.value);
    await (isUpdate.value ? intentEntityUpdate(data) : intentEntityAdd(data));
    emit('reload');
    await handleCancel();
  } catch (error) {
    console.error(error);
  } finally {
    modalApi.modalLoading(false);
  }
}

async function handleCancel() {
  modalApi.close();
  formData.value = defaultValues;
  resetFields();
}
</script>

<template>
  <BasicModal :title="title">
    <Form layout="vertical">
      <FormItem label="意图类型" v-bind="validateInfos.intentType">
        <Input
          :placeholder="$t('ui.formRules.required')"
          v-model:value="formData.intentType"
        />
      </FormItem>
      <FormItem label="实体名称" v-bind="validateInfos.entityName">
        <Input
          :placeholder="$t('ui.formRules.required')"
          v-model:value="formData.entityName"
        />
      </FormItem>
      <div class="grid sm:grid-cols-1 lg:grid-cols-2">
        <FormItem label="是否必需" v-bind="validateInfos.isRequired">
          <RadioGroup
            button-style="solid"
            option-type="button"
            v-model:value="formData.isRequired"
            :options="[
              { label: '是', value: 1 },
              { label: '否', value: 0 },
            ]"
          />
        </FormItem>
        <FormItem label="优先级" v-bind="validateInfos.priority">
          <InputNumber
            :min="1"
            :max="100"
            v-model:value="formData.priority"
            style="width: 100%"
          />
        </FormItem>
      </div>
      <FormItem label="提示模板" v-bind="validateInfos.promptTemplate">
        <Input placeholder="可选" v-model:value="formData.promptTemplate" />
      </FormItem>
    </Form>
  </BasicModal>
</template>
