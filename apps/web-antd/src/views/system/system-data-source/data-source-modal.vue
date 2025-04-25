<script setup lang="ts">
import type { RuleObject } from 'ant-design-vue/es/form';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { cloneDeep } from '@vben/utils';

import {
  Form,
  Select,
  Input,
  InputNumber,
  Switch,
  Row,
  Col,
  Button,
  message,
  Modal,
} from 'ant-design-vue';
import { pick } from 'lodash-es';

import {
  dataSourceAdd,
  dataSourceInfo,
  dataSourceUpdate,
  dataSourceTestConnection,
} from '#/api/system/data-source/api';
import type { SystemDataSourceConfig } from '#/api/system/data-source/model';

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
  systemName?: string;
  dbType?: string;
  jdbcUrl?: string;
  username?: string;
  password?: string;
  driverClass?: string;
  maxPoolSize?: number;
  connectionTimeout?: number;
  enabled?: boolean;
  dbName?: string;
  remark?: string;
}

/**
 * 定义默认值 用于reset
 */
const defaultValues: FormData = {
  id: undefined,
  systemName: '',
  dbType: 'mysql',
  jdbcUrl: '',
  username: '',
  password: '',
  driverClass: '',
  maxPoolSize: 10,
  connectionTimeout: 30000,
  enabled: true,
  dbName: '',
  remark: '',
};

/**
 * 表单数据ref
 */
const formData = ref(cloneDeep(defaultValues));

type AntdFormRules<T> = Partial<Record<keyof T, RuleObject[]>> & {
  [key: string]: RuleObject[];
};

/**
 * 表单校验规则
 */
const formRules = ref<AntdFormRules<FormData>>({
  systemName: [{ required: true, message: $t('ui.formRules.required') }],
  dbType: [{ required: true, message: $t('ui.formRules.required') }],
  jdbcUrl: [{ required: true, message: $t('ui.formRules.required') }],
  username: [{ required: true, message: $t('ui.formRules.required') }],
  password: [{ required: true, message: $t('ui.formRules.required') }],
  dbName: [{ required: true, message: $t('ui.formRules.required') }],
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
      const record = await dataSourceInfo(id);
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
    await (isUpdate.value ? dataSourceUpdate(data) : dataSourceAdd(data));
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
  formData.value = cloneDeep(defaultValues);
  resetFields();
}

async function handleTestConnection() {
  try {
    modalApi.modalLoading(true);
    // 预处理数据，确保所有必填属性存在
    const processedData: SystemDataSourceConfig = {
      ...formData.value,
      systemName: formData.value.systemName || '',
      dbType: formData.value.dbType || 'mysql',
      jdbcUrl: formData.value.jdbcUrl || '',
      username: formData.value.username || '',
      password: formData.value.password || '',
      enabled: formData.value.enabled || true,
    };

    await dataSourceTestConnection(processedData);
    Modal.success({
      title: '连接测试成功',
      content: `与数据源 ${formData.value.systemName} 的连接测试成功`,
    });
  } catch (error) {
    message.error({
      type: 'error',
      content: `连接测试失败: ${error}`,
    });
  } finally {
    modalApi.modalLoading(false);
  }
}
</script>

<template>
  <BasicModal :title="title">
    <Form :model="formData" layout="vertical">
      <Form.Item label="系统名称" v-bind="validateInfos.systemName">
        <Input
          :placeholder="$t('ui.formRules.required')"
          v-model:value="formData.systemName"
        />
      </Form.Item>
      <Form.Item label="数据库类型" v-bind="validateInfos.dbType">
        <Select v-model:value="formData.dbType">
          <Select.Option value="mysql">MySQL</Select.Option>
          <Select.Option value="oracle">Oracle</Select.Option>
          <Select.Option value="postgresql">PostgreSQL</Select.Option>
          <Select.Option value="sqlserver">SQL Server</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item label="数据库名" v-bind="validateInfos.dbName">
        <Input
          :placeholder="$t('ui.formRules.required')"
          v-model:value="formData.dbName"
        />
      </Form.Item>
      <Form.Item label="JDBC URL" v-bind="validateInfos.jdbcUrl">
        <Input
          :placeholder="$t('ui.formRules.required')"
          v-model:value="formData.jdbcUrl"
        />
      </Form.Item>
      <Row :gutter="16">
        <Col :span="12">
          <Form.Item label="用户名" v-bind="validateInfos.username">
            <Input
              :placeholder="$t('ui.formRules.required')"
              v-model:value="formData.username"
            />
          </Form.Item>
        </Col>
        <Col :span="12">
          <Form.Item label="密码" v-bind="validateInfos.password">
            <Input.Password
              :placeholder="$t('ui.formRules.required')"
              v-model:value="formData.password"
            />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item label="驱动类">
        <Input
          placeholder="如不填写将自动检测"
          v-model:value="formData.driverClass"
        />
      </Form.Item>
      <Row :gutter="16">
        <Col :span="12">
          <Form.Item label="最大连接数">
            <InputNumber
              :min="1"
              :max="100"
              v-model:value="formData.maxPoolSize"
            />
          </Form.Item>
        </Col>
        <Col :span="12">
          <Form.Item label="连接超时 (毫秒)">
            <InputNumber
              :min="1000"
              :step="1000"
              v-model:value="formData.connectionTimeout"
            />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item label="启用状态">
        <Switch v-model:checked="formData.enabled" />
      </Form.Item>
      <Form.Item label="备注">
        <Input.TextArea
          :rows="3"
          placeholder="请输入备注信息"
          v-model:value="formData.remark"
        />
      </Form.Item>
      <div class="mt-4 flex justify-end">
        <Button type="primary" @click="handleTestConnection"> 测试连接 </Button>
      </div>
    </Form>
  </BasicModal>
</template>
