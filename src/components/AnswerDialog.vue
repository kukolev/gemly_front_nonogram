<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';

const props = defineProps({
  solution: { type: Array, required: true }
});

const emit = defineEmits(['ok']);

const canvasRef = ref(null);

const drawAnswer = () => {
  const canvas = canvasRef.value;
  if (!canvas || !props.solution?.length) return;

  const rows = props.solution.length;
  const cols = props.solution[0]?.length || 0;
  if (!cols) return;

  const maxPx = Math.min(window.innerWidth - 80, window.innerHeight - 180, 500);
  const cs = Math.max(4, Math.floor(maxPx / Math.max(rows, cols)));
  const w = cols * cs;
  const h = rows * cs;
  const dpr = window.devicePixelRatio || 1;

  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;

  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // White background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, w, h);

  // Black cells — full cell, no grid lines
  ctx.fillStyle = 'black';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (props.solution[r][c] === 1) {
        ctx.fillRect(c * cs, r * cs, cs+1, cs+1);
      }
    }
  }
};

onMounted(() => nextTick(drawAnswer));
watch(() => props.solution, () => nextTick(drawAnswer), { deep: true });
</script>

<template>
  <div class="answer-overlay" @click.self="$emit('ok')">
    <div class="answer-dialog">
      <div class="answer-canvas-wrapper">
        <canvas ref="canvasRef"></canvas>
      </div>
      <div class="answer-footer">
        <button class="ok-btn" @click="$emit('ok')">Ага, спасибо :)</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.answer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.answer-dialog {
  background: white;
  border: 2px solid black;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  padding: 1.5rem;
  max-width: calc(100vw - 40px);
  max-height: calc(100dvh - 40px);
}

.answer-canvas-wrapper {
  overflow: auto;
  max-width: calc(100vw - 80px);
  max-height: calc(100dvh - 160px);
}

.answer-canvas-wrapper canvas {
  display: block;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.answer-footer {
  display: flex;
  justify-content: center;
}

.ok-btn {
  padding: 0.55rem 2.5rem;
  background-color: white;
  color: black;
  border: 1px solid black;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s ease;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.ok-btn:hover {
  background-color: black;
  color: white;
}

.ok-btn:active {
  transform: translateY(1px);
}
</style>
