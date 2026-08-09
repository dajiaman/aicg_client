<template>
  <div class="tour-custom-content">
    <div class="tour-desc-text">{{ description }}</div>
    <div class="tour-controls-row">

    </div>
  </div>
</template>

<script setup>

const props = defineProps({
  description: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['toggleVoice'])

const toggleVoice = () => {
  emit('toggleVoice')
}


</script>
