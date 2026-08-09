import { defineStore } from "pinia"

export const useAppStore = defineStore('app', {
  state: () => ({
    oemInfo: {}
  }),
  actions: {
    async getOemInfo() {
      const oemRes = await window.api.oem.getInfo()
      if (oemRes.success) {
        this.oemInfo = oemRes.data
      }
    }
  }
})
