import { t } from "@/lang/i18n";
import type { QuickStartPackages } from "@/types";
import type { AntColumnsType } from "@/types/ant";
import { computed, type ComputedRef } from "vue";

/**
 * Table column definition: title, dataIndex, width, align, ellipsis, etc.
 * Cell rendering (e.g. tag, tooltip) is handled in PackageDetailTable bodyCell.
 */
export interface PackageTableColumnDef {
  key: string;
  dataIndex: keyof QuickStartPackages | string;
  title: string;
  width?: number;
  minWidth?: number;
  align: "left" | "center" | "right";
  /** Render as tag (e.g. version, platform, language, category, tags) */
  useTag?: boolean;
  /** Multiple tags (e.g. tags array) */
  useMultiTag?: boolean;
  /** Image column */
  isImage?: boolean;
  /** Fixed column */
  fixed?: "left" | "right";
  maxWidth?: number;
}

function buildColumnDefs(): PackageTableColumnDef[] {
  return [
    {
      key: "image",
      dataIndex: "image",
      title: "",
      width: 72,
      align: "center",
      isImage: true,
      fixed: "left"
    },
    {
      key: "title",
      dataIndex: "title",
      title: t("TXT_CODE_b5a0661a"),
      maxWidth: 600,
      width: 160,
      align: "left"
    },
    {
      key: "platform",
      dataIndex: "platform",
      title: t("TXT_CODE_387e9722"),
      width: 90,
      align: "center",
      useTag: true
    },
    {
      key: "runtime",
      dataIndex: "runtime",
      title: t("TXT_CODE_c71dc792"),
      width: 90,
      maxWidth: 180,
      align: "center"
    },
    {
      key: "remark",
      dataIndex: "remark",
      title: t("TXT_CODE_b8e8e6f5"),
      width: 100,
      maxWidth: 180,
      align: "center"
    },
    {
      key: "author",
      dataIndex: "author",
      title: t("TXT_CODE_7c441b9"),
      width: 90,
      align: "center"
    },
    {
      key: "action",
      dataIndex: "action",
      title: t("TXT_CODE_fe731dfc"),
      width: 100,
      align: "center"
    }
  ];
}

function columnDefToAntColumn(def: PackageTableColumnDef): AntColumnsType {
  const col: AntColumnsType = {
    key: def.key,
    dataIndex: def.dataIndex as string,
    title: def.title,
    align: def.align,
    ellipsis: !def.useTag && !def.useMultiTag && !def.isImage && def.key !== "action"
  } as AntColumnsType;
  if (def.width != null) col.width = def.width;
  if (def.minWidth != null) col.minWidth = def.minWidth;
  if (def.maxWidth != null) col.maxWidth = def.maxWidth;
  if (def.fixed) col.fixed = def.fixed;
  return col;
}

export function usePackageTableColumns(): {
  columns: ComputedRef<AntColumnsType[]>;
  columnDefs: ComputedRef<PackageTableColumnDef[]>;
} {
  const columnDefs = computed<PackageTableColumnDef[]>(() => buildColumnDefs());
  const columns = computed<AntColumnsType[]>(() => columnDefs.value.map(columnDefToAntColumn));
  return { columns, columnDefs };
}
