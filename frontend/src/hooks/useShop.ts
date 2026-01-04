import { publicSettingInfo, setSettingInfo } from "@/services/apis";
import { requestProducts } from "@/services/apis/redeem";
import type { Settings } from "@/types";
import { ref } from "vue";

export function useShop() {
  const { execute: updateSettingInfo } = setSettingInfo();
  const { execute: refreshSettingInfo, state: settingState } = publicSettingInfo();
  const { execute: fetchProducts, state: products, isLoading, isReady } = requestProducts();

  const companyInfo = ref({
    name: "",
    description: "",
    contact: {
      phone: "",
      email: "",
      qq: ""
    }
  });

  const updateShopInfo = async (data: Partial<Settings>) => {
    return await updateSettingInfo({
      data
    });
  };

  return {
    refreshSettingInfo,
    products,
    companyInfo,
    settingState,
    fetchProducts,
    isLoading,
    isReady,
    updateShopInfo
  };
}
