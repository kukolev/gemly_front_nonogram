<template>
  <footer class="app-footer">
    <div class="footer-container">
      <div class="footer-line">
        Copyright © 2026 rubyruby.games
      </div>
      <div class="footer-line secondary">
        Reproduction of content from this site in any form is prohibited without the written agreement of the owner.
      </div>
    </div>
  </footer>
</template>

<script setup>
</script>

<style scoped>
.app-footer {
  background-color: #ffffff;
  border-top: 1px solid #e2e8f0;
  padding: 2rem 1rem;
  width: 100%;
  margin-top: 3rem;
  color: #64748b;
  font-size: 0.875rem;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.footer-line {
  line-height: 1.5;
}

.footer-line.secondary {
  font-size: 0.75rem;
  color: #94a3b8;
}

.footer-link {
  color: #2563eb;
  text-decoration: none;
  transition: color 0.2s;
}

.footer-link:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

@media (max-width: 640px) {
  .app-footer {
    padding: 1.5rem 1rem;
    margin-top: 2rem;
  }
}
</style>
