export interface DictData {
  createBy: string;
  createTime: string;
  cssClass: string;
  default: boolean;
  dictCode: number;
  dictLabel: string;
  dictSort: number;
  dictType: string;
  dictValue: string;
  isDefault: string;
  listClass: string;
  remark: string;
  status: string;
  updateBy?: any;
  updateTime?: any;
}

// 定义返回类型
export interface DictDataResponse {
  total: number;
  rows: DictData[];
}
