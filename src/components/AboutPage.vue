<template>
  <div class="about-page">
    <main class="content">
      <article class="article">
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
import { countVisit } from "@/funcs.js";

onMounted(() => {
  countVisit();
});
</script>

<style scoped>
.about-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
  font-family: 'Inter', sans-serif;
  color: #2c4550;
}

.content {
  line-height: 1.7;
}

.article {
  background: white;
  padding: 2rem;
}

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
</style>
