<template>
  <div class="about-page">
    <main class="content">
      <article class="article">
        <h2>Что такое японские кроссворды?</h2>
        <p>
          Японские кроссворды (нонограммы) — это логические головоломки, в которых с помощью чисел зашифровано некоторое изображение.
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

        <div class="illustration">
          <!-- 5x5 smiley nonogram example -->
          <!-- Grid: row0=[0,1,0,1,0], row1=[0,1,0,1,0], row2=[0,0,0,0,0], row3=[1,0,0,0,1], row4=[0,1,1,1,0] -->
          <!-- Col clues: [1],[2,1],[1],[2,1],[1]  Row clues: [1,1],[1,1],[],[1,1],[3] -->
          <svg width="210" height="220" viewBox="0 0 210 220" xmlns="http://www.w3.org/2000/svg" class="nonogram-svg">
            <rect width="210" height="220" fill="#f8fafc" rx="8"/>
            <!-- Clue area shading -->
            <rect x="0" y="0" width="210" height="62" fill="#dbeafe"/>
            <rect x="0" y="0" width="50" height="220" fill="#dbeafe"/>
            <!-- Grid background -->
            <rect x="50" y="62" width="150" height="150" fill="white"/>
            <!-- Row 0: [0,1,0,1,0] -->
            <rect x="50"  y="62" width="30" height="30" fill="white"   stroke="#94a3b8" stroke-width="0.5"/>
            <rect x="80"  y="62" width="30" height="30" fill="#1e40af" stroke="#94a3b8" stroke-width="0.5"/>
            <rect x="110" y="62" width="30" height="30" fill="white"   stroke="#94a3b8" stroke-width="0.5"/>
            <rect x="140" y="62" width="30" height="30" fill="#1e40af" stroke="#94a3b8" stroke-width="0.5"/>
            <rect x="170" y="62" width="30" height="30" fill="white"   stroke="#94a3b8" stroke-width="0.5"/>
            <!-- Row 1: [0,1,0,1,0] -->
            <rect x="50"  y="92" width="30" height="30" fill="white"   stroke="#94a3b8" stroke-width="0.5"/>
            <rect x="80"  y="92" width="30" height="30" fill="#1e40af" stroke="#94a3b8" stroke-width="0.5"/>
            <rect x="110" y="92" width="30" height="30" fill="white"   stroke="#94a3b8" stroke-width="0.5"/>
            <rect x="140" y="92" width="30" height="30" fill="#1e40af" stroke="#94a3b8" stroke-width="0.5"/>
            <rect x="170" y="92" width="30" height="30" fill="white"   stroke="#94a3b8" stroke-width="0.5"/>
            <!-- Row 2: [0,0,0,0,0] -->
            <rect x="50"  y="122" width="30" height="30" fill="white" stroke="#94a3b8" stroke-width="0.5"/>
            <rect x="80"  y="122" width="30" height="30" fill="white" stroke="#94a3b8" stroke-width="0.5"/>
            <rect x="110" y="122" width="30" height="30" fill="white" stroke="#94a3b8" stroke-width="0.5"/>
            <rect x="140" y="122" width="30" height="30" fill="white" stroke="#94a3b8" stroke-width="0.5"/>
            <rect x="170" y="122" width="30" height="30" fill="white" stroke="#94a3b8" stroke-width="0.5"/>
            <!-- Row 3: [1,0,0,0,1] -->
            <rect x="50"  y="152" width="30" height="30" fill="#1e40af" stroke="#94a3b8" stroke-width="0.5"/>
            <rect x="80"  y="152" width="30" height="30" fill="white"   stroke="#94a3b8" stroke-width="0.5"/>
            <rect x="110" y="152" width="30" height="30" fill="white"   stroke="#94a3b8" stroke-width="0.5"/>
            <rect x="140" y="152" width="30" height="30" fill="white"   stroke="#94a3b8" stroke-width="0.5"/>
            <rect x="170" y="152" width="30" height="30" fill="#1e40af" stroke="#94a3b8" stroke-width="0.5"/>
            <!-- Row 4: [0,1,1,1,0] -->
            <rect x="50"  y="182" width="30" height="30" fill="white"   stroke="#94a3b8" stroke-width="0.5"/>
            <rect x="80"  y="182" width="30" height="30" fill="#1e40af" stroke="#94a3b8" stroke-width="0.5"/>
            <rect x="110" y="182" width="30" height="30" fill="#1e40af" stroke="#94a3b8" stroke-width="0.5"/>
            <rect x="140" y="182" width="30" height="30" fill="#1e40af" stroke="#94a3b8" stroke-width="0.5"/>
            <rect x="170" y="182" width="30" height="30" fill="white"   stroke="#94a3b8" stroke-width="0.5"/>
            <!-- Bold grid border -->
            <line x1="50"  y1="62"  x2="200" y2="62"  stroke="#475569" stroke-width="2"/>
            <line x1="50"  y1="62"  x2="50"  y2="212" stroke="#475569" stroke-width="2"/>
            <line x1="200" y1="62"  x2="200" y2="212" stroke="#475569" stroke-width="1"/>
            <line x1="50"  y1="212" x2="200" y2="212" stroke="#475569" stroke-width="1"/>
            <!-- Row clues (right-aligned at x=45) -->
            <text x="45" y="81"  text-anchor="end" font-size="13" fill="#1e293b" font-family="monospace">1 1</text>
            <text x="45" y="111" text-anchor="end" font-size="13" fill="#1e293b" font-family="monospace">1 1</text>
            <!-- row 2: empty — no clue -->
            <text x="45" y="171" text-anchor="end" font-size="13" fill="#1e293b" font-family="monospace">1 1</text>
            <text x="45" y="201" text-anchor="end" font-size="13" fill="#1e293b" font-family="monospace">3</text>
            <!-- Column clues (centered per column) -->
            <!-- col 0 center x=65: [1] -->
            <text x="65"  y="50" text-anchor="middle" font-size="13" fill="#1e293b" font-family="monospace">1</text>
            <!-- col 1 center x=95: [2,1] -->
            <text x="95"  y="36" text-anchor="middle" font-size="13" fill="#1e293b" font-family="monospace">2</text>
            <text x="95"  y="54" text-anchor="middle" font-size="13" fill="#1e293b" font-family="monospace">1</text>
            <!-- col 2 center x=125: [1] -->
            <text x="125" y="50" text-anchor="middle" font-size="13" fill="#1e293b" font-family="monospace">1</text>
            <!-- col 3 center x=155: [2,1] -->
            <text x="155" y="36" text-anchor="middle" font-size="13" fill="#1e293b" font-family="monospace">2</text>
            <text x="155" y="54" text-anchor="middle" font-size="13" fill="#1e293b" font-family="monospace">1</text>
            <!-- col 4 center x=185: [1] -->
            <text x="185" y="50" text-anchor="middle" font-size="13" fill="#1e293b" font-family="monospace">1</text>
          </svg>
          <div class="illustration-caption">Пример нонограммы 5×5 и её решение («смайлик»)</div>
        </div>

        <h2>Методы решения нонограмм</h2>
        <p>
          Нонограммы решаются с помощью логических рассуждений — без случайного перебора вариантов.
          Основные методы опираются на анализ отдельных строк и столбцов с последовательным уточнением состояния каждой клетки.
        </p>

        <h3>Метод перекрытия</h3>
        <p>
          Если блок достаточно велик относительно длины строки, часть клеток гарантированно будет закрашена при любом допустимом расположении блока.
          Например, если в строке из 7 клеток должен стоять блок длиной 5, то блок может начинаться в позиции 1, 2 или 3.
          Клетки, которые попадают во все три варианта одновременно (середина), точно закрашены — это и есть «перекрытие».
        </p>

        <div class="illustration">
          <!-- Overlap method: 7-cell row with clue [5] -->
          <!-- Variant 1: cells 0-4 filled; Variant 2: cells 1-5 filled; Variant 3: cells 2-6 filled -->
          <!-- Overlap (certain): cells 2,3,4 -->
          <svg width="265" height="155" viewBox="0 0 265 155" xmlns="http://www.w3.org/2000/svg" class="nonogram-svg">
            <rect width="265" height="155" fill="#f8fafc" rx="8"/>
            <!-- Clue badge -->
            <rect x="4" y="8" width="28" height="25" fill="#dbeafe" rx="4"/>
            <text x="18" y="25" text-anchor="middle" font-size="12" fill="#1e40af" font-family="monospace" font-weight="bold">5</text>
            <!-- Row 1: cells 0-4 light blue, 5-6 white -->
            <text x="82" y="25" text-anchor="end" font-size="11" fill="#475569" font-family="sans-serif">Вар. 1:</text>
            <rect x="86"  y="8" width="25" height="25" fill="#bfdbfe" stroke="#94a3b8" stroke-width="0.5"/>
            <rect x="111" y="8" width="25" height="25" fill="#bfdbfe" stroke="#94a3b8" stroke-width="0.5"/>
            <rect x="136" y="8" width="25" height="25" fill="#bfdbfe" stroke="#94a3b8" stroke-width="0.5"/>
            <rect x="161" y="8" width="25" height="25" fill="#bfdbfe" stroke="#94a3b8" stroke-width="0.5"/>
            <rect x="186" y="8" width="25" height="25" fill="#bfdbfe" stroke="#94a3b8" stroke-width="0.5"/>
            <rect x="211" y="8" width="25" height="25" fill="white"   stroke="#94a3b8" stroke-width="0.5"/>
            <rect x="236" y="8" width="25" height="25" fill="white"   stroke="#94a3b8" stroke-width="0.5"/>
            <!-- Row 2: cell 0 white, cells 1-5 light blue, cell 6 white -->
            <text x="82" y="57" text-anchor="end" font-size="11" fill="#475569" font-family="sans-serif">Вар. 2:</text>
            <rect x="86"  y="40" width="25" height="25" fill="white"   stroke="#94a3b8" stroke-width="0.5"/>
            <rect x="111" y="40" width="25" height="25" fill="#bfdbfe" stroke="#94a3b8" stroke-width="0.5"/>
            <rect x="136" y="40" width="25" height="25" fill="#bfdbfe" stroke="#94a3b8" stroke-width="0.5"/>
            <rect x="161" y="40" width="25" height="25" fill="#bfdbfe" stroke="#94a3b8" stroke-width="0.5"/>
            <rect x="186" y="40" width="25" height="25" fill="#bfdbfe" stroke="#94a3b8" stroke-width="0.5"/>
            <rect x="211" y="40" width="25" height="25" fill="#bfdbfe" stroke="#94a3b8" stroke-width="0.5"/>
            <rect x="236" y="40" width="25" height="25" fill="white"   stroke="#94a3b8" stroke-width="0.5"/>
            <!-- Row 3: cells 0-1 white, cells 2-6 light blue -->
            <text x="82" y="89" text-anchor="end" font-size="11" fill="#475569" font-family="sans-serif">Вар. 3:</text>
            <rect x="86"  y="72" width="25" height="25" fill="white"   stroke="#94a3b8" stroke-width="0.5"/>
            <rect x="111" y="72" width="25" height="25" fill="white"   stroke="#94a3b8" stroke-width="0.5"/>
            <rect x="136" y="72" width="25" height="25" fill="#bfdbfe" stroke="#94a3b8" stroke-width="0.5"/>
            <rect x="161" y="72" width="25" height="25" fill="#bfdbfe" stroke="#94a3b8" stroke-width="0.5"/>
            <rect x="186" y="72" width="25" height="25" fill="#bfdbfe" stroke="#94a3b8" stroke-width="0.5"/>
            <rect x="211" y="72" width="25" height="25" fill="#bfdbfe" stroke="#94a3b8" stroke-width="0.5"/>
            <rect x="236" y="72" width="25" height="25" fill="#bfdbfe" stroke="#94a3b8" stroke-width="0.5"/>
            <!-- Divider -->
            <line x1="86" y1="107" x2="261" y2="107" stroke="#64748b" stroke-width="1" stroke-dasharray="4,3"/>
            <!-- Row 4 (result): cells 0-1 white, cells 2-4 dark blue, cells 5-6 white -->
            <text x="82" y="132" text-anchor="end" font-size="11" fill="#1e293b" font-weight="bold" font-family="sans-serif">Итог:</text>
            <rect x="86"  y="115" width="25" height="25" fill="white"   stroke="#94a3b8" stroke-width="0.5"/>
            <rect x="111" y="115" width="25" height="25" fill="white"   stroke="#94a3b8" stroke-width="0.5"/>
            <rect x="136" y="115" width="25" height="25" fill="#1e40af" stroke="#94a3b8" stroke-width="0.5"/>
            <rect x="161" y="115" width="25" height="25" fill="#1e40af" stroke="#94a3b8" stroke-width="0.5"/>
            <rect x="186" y="115" width="25" height="25" fill="#1e40af" stroke="#94a3b8" stroke-width="0.5"/>
            <rect x="211" y="115" width="25" height="25" fill="white"   stroke="#94a3b8" stroke-width="0.5"/>
            <rect x="236" y="115" width="25" height="25" fill="white"   stroke="#94a3b8" stroke-width="0.5"/>
          </svg>
          <div class="illustration-caption">
            Метод перекрытия: строка из 7 клеток с подсказкой [5].
            Светло-синие клетки — возможные позиции блока, тёмно-синие — гарантированно закрашенные.
          </div>
        </div>

        <h3>Метод от краёв</h3>
        <p>
          Если клетка у края строки оказывается закрашенной, а первая подсказка задаёт конкретную длину блока,
          можно точно отсчитать этот блок от края и поставить граничную пустую клетку сразу после него.
          Этот приём позволяет быстро зафиксировать блоки, которые «прижаты» к одному из концов ряда.
        </p>

        <h3>Анализ пересечений строк и столбцов</h3>
        <p>
          Решение нонограммы — итеративный процесс: информация, полученная при разборе строк, уточняет
          допустимые состояния клеток в столбцах, и наоборот. Повторяя этот цикл снова и снова,
          шаг за шагом восстанавливают всё изображение — именно поэтому нонограммы нередко называют «крестословицами для глаз».
        </p>

        <h3>Метод от противного</h3>
        <p>
          В сложных случаях, когда простых логических зацепок не остаётся, можно временно предположить состояние
          одной клетки (закрашена или пуста) и проследить, не возникнет ли противоречие с подсказками.
          Если предположение ведёт к противоречию, истинным является противоположное состояние клетки.
        </p>
      </article>
    </main>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import { countVisit } from "@/funcs.js";

defineEmits(['back']);

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Что такое японские кроссворды и как их решать',
  description: 'Узнайте, что такое нонограммы, как читать подсказки и какие методы — перекрытие, анализ пересечений и метод от противного — помогут решить любой японский кроссворд.',
  inLanguage: 'ru',
  author: { '@type': 'Organization', name: 'Японские кроссворды онлайн' },
  about: { '@type': 'Thing', name: 'Нонограмма' },
};

let ldScript = null;

onMounted(() => {
  countVisit();
  ldScript = document.createElement('script');
  ldScript.type = 'application/ld+json';
  ldScript.textContent = JSON.stringify(JSON_LD);
  document.head.appendChild(ldScript);
});

onUnmounted(() => {
  ldScript?.remove();
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
  margin-top: 2rem;
  margin-bottom: 1.5rem;
  color: #1e293b;
  border-left: 4px solid #2563eb;
  padding-left: 1rem;
}

.article h2:first-child {
  margin-top: 0;
}

.article h3 {
  font-size: 1.25rem;
  margin-top: 1.6rem;
  margin-bottom: 0.7rem;
  color: #1e293b;
  padding-left: 0.75rem;
  border-left: 3px solid #93c5fd;
}

.article p {
  margin-bottom: 1.2rem;
  font-size: 1.1rem;
  color: #475569;
}

.illustration {
  margin: 1.8rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
}

.nonogram-svg {
  max-width: 100%;
  height: auto;
}

.illustration-caption {
  font-size: 0.9rem;
  color: #64748b;
  text-align: center;
  font-style: italic;
  max-width: 480px;
}
</style>
