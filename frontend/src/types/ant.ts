import type { ColumnType } from "ant-design-vue/es/table";

// export interface AntTableCell<T, C = any> {
//   text: any;
//   value: any;
//   record: T;
//   index: number;
//   column: ColumnType<C & Record<string, any>>;
// }

export interface AntTableCell {
  text: any;
  value: any;
  record: any;
  index: number;
  column: ColumnType<any>;
}

export interface AntColumnsType extends ColumnType, Record<string, any> {
  key?: string;
  align: any;
}
