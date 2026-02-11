<template>
  <div class="landing-page">
    <header class="hero">
      <h1 class="hero-title">Японские кроссворды</h1>
      <p class="hero-subtitle">Увлекательные логические головоломки</p>
      <button @click="$emit('start')" class="start-btn">Начать игру</button>
    </header>

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

    <footer class="footer">
      <p>&copy; 2026 Nonogram Game</p>
    </footer>
  </div>
</template>

<script setup>
defineEmits(['start']);
</script>

<style scoped>
.landing-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1rem;
  font-family: 'Inter', sans-serif;
  color: #2c4550;
}

.hero {
  text-align: center;
  padding: 4rem 2rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 1rem;
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

.start-btn {
  background-color: #2563eb;
  color: white;
  border: none;
  padding: 1rem 2.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
}

.start-btn:hover {
  background-color: #1d4ed8;
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

.footer {
  margin-top: 5rem;
  text-align: center;
  padding-top: 2rem;
  border-top: 1px solid #e2e8f0;
  color: #94a3b8;
  font-size: 0.9rem;
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
