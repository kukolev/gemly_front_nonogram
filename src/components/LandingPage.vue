<template>
  <div class="landing-page">
    <header class="hero">
      <p class="hero-subtitle">Добро пожаловать на сайт "Японские кроссворды"</p>
      <div class="hero-actions">
        <button @click="$emit('start')" class="start-btn">Открыть кроссворд!</button>
      </div>
    </header>

    <main class="content">
      <article class="article">
        <h2 class="welcome-title">Добро пожаловать на сайт https://rubyruby.games/nonograms</h2>
        <p>
          Наш сайт содержит множество японских кроссвордов, которые пополняются каждый день.
        </p>
        <h2>Что такое японские кроссворды?</h2>
        <p>
          Японский кроссворд (нонограмма) — это логическая головоломка, в которой с помощью чисел зашифровано некоторое изображение.
          Цель головоломки — полностью восстановить это изображение.
        </p>
        <p>
          В этих кроссвордах, в отличие от обычных, зашифрованы не слова, а изображения.
          Они закрашиваются в сетке согласно числам, расположенным слева от строк и сверху над столбцами.
        </p>
        <p>
          Числа показывают, сколько групп закрашенных клеток находится в соответствующей строке или столбце,
          и сколько слитных клеток содержит каждая из этих групп (например, число 5 означает, что в этом ряду есть группа из пяти подряд закрашенных клеток).
        </p>
        <p>
          Группы должны быть разделены как минимум одной пустой клеткой.
          Эти головоломки развивают логику, память и концентрацию внимания.
        </p>
      </article>
    </main>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import {countVisit} from "@/funcs.js";

defineEmits(['start']);

onMounted(async () => {
  countVisit()
});
</script>

<style scoped>
.landing-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
  font-family: 'Inter', sans-serif;
  color: #2c4550;
}

.hero {
  text-align: center;
  padding: 4rem 2rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 0;
  margin-bottom: 3rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.hero-title {
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 1rem;
  color: #1e293b;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: #64748b;
  margin-bottom: 2.5rem;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.start-btn {
  background-color: #2563eb;
  color: white;
  border: 2px solid transparent;
  padding: 1rem 2.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  border-radius: 0;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
}

.start-btn:hover {
  background-color: #1d4ed8;
  border-color: white;
  transform: translateY(-1px);
  box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
}

.start-btn:active {
  transform: translateY(0);
}

.content {
  line-height: 1.7;
}

.article {
  background: white;
  padding: 2rem;
}

.welcome-title,
.article h2 {
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  color: #1e293b;
  border-left: 4px solid #2563eb;
  padding-left: 1rem;
}

.article p {
  margin-bottom: 1.2rem;
  font-size: 1.1rem;
  color: #475569;
}

@media (max-width: 640px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .hero {
    padding: 2.5rem 1rem;
  }
}
</style>
