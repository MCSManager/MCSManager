import { ref } from "vue";

export interface FrontProductInfo extends IBusinessProductInfo {
  lines: Array<{ title: string; value: string }>;
}

const PRODUCT_CONFIGS: FrontProductInfo[] = [
  {
    productId: 1,
    title: "基础版 Minecraft 服务器",
    price: 39,
    ispId: 1,
    daemonId: "basic",
    lines: [
      { title: "CPU", value: "2核" },
      { title: "内存", value: "2GB" },
      { title: "存储", value: "20GB SSD" },
      { title: "玩家数", value: "最多10人" }
    ],
    remark: "适合小型团队或朋友聚会使用"
  },
  {
    productId: 2,
    title: "专业版 Minecraft 服务器",
    price: 89,
    ispId: 1,
    daemonId: "professional",
    lines: [
      { title: "CPU", value: "2核" },
      { title: "内存", value: "2GB" }
    ],
    remark: "适合中型社区服务器"
  },
  {
    productId: 3,
    title: "企业版 Minecraft 服务器",
    price: 199,
    ispId: 1,
    daemonId: "enterprise",
    lines: [
      { title: "CPU", value: "2核" },
      { title: "内存", value: "2GB" },
      { title: "存储", value: "20GB SSD" }
    ],
    remark: "适合大型服务器和商业用途"
  },
  {
    productId: 4,
    title: "旗舰版 Minecraft 服务器",
    price: 399,
    ispId: 1,
    daemonId: "flagship",
    lines: [
      { title: "CPU", value: "2核" },
      { title: "内存", value: "2GB" },
      { title: "存储", value: "20GB SSD" },
      { title: "玩家数", value: "最多10人" }
    ],
    remark: "顶级配置，适合超大型服务器"
  },
  {
    productId: 5,
    title: "旗舰版 Minecraft 服务器",
    price: 399,
    ispId: 1,
    daemonId: "flagship",
    lines: [
      { title: "CPU", value: "2核" },
      { title: "内存", value: "2GB" },
      { title: "存储", value: "20GB SSD" },
      { title: "玩家数", value: "最多10人" }
    ],
    remark: "顶级配置，适合超大型服务器"
  },
  {
    productId: 6,
    title: "旗舰版 Minecraft 服务器",
    price: 399,
    ispId: 1,
    daemonId: "flagship",
    lines: [
      { title: "CPU", value: "2核" },
      { title: "内存", value: "2GB" },
      { title: "存储", value: "20GB SSD" },
      { title: "玩家数", value: "最多10人" }
    ],
    remark: "顶级配置，适合超大型服务器"
  }
];

export function useShop() {
  const products = ref<FrontProductInfo[]>([]);
  const companyInfo = ref({
    name: "星星云数据",
    description: "专业的游戏服务器托管服务商，为您提供稳定、高性能的游戏服务器解决方案",
    contact: {
      phone: "400-888-6666",
      email: "support@mcscloud.com",
      qq: "800888888"
    }
  });

  const fetchProducts = async () => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        products.value = PRODUCT_CONFIGS;
        resolve();
      }, 800);
    });
  };

  return {
    products,
    companyInfo,
    fetchProducts
  };
}
