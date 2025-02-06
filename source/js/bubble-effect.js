document.addEventListener('DOMContentLoaded', function() {
  // 在首页和文章列表页显示气泡
  const isHomePage = location.pathname === '/' || location.pathname === '/page/';
  const isPostListPage = location.pathname.match(/^\/page\/\d+\/?$/);
  
  if (!isHomePage && !isPostListPage) {
    return;
  }

  // 奶茶数组
  const milkTeas = [
    '原味奶茶',
    '珍珠奶茶',
    '椰果奶茶',
    '芋圆奶茶',
    '布丁奶茶',
    '红豆奶茶',
    '抹茶奶茶',
    '焦糖奶茶',
    '草莓奶茶',
    '芒果奶茶',
    '巧克力奶茶',
    '茉莉奶茶'
  ];

  // 祝福语数组
  const blessings = [
    '心想事成',
    '平安喜乐',
    '健康快乐',
    '前程似锦',
    '梦想成真',
    '幸福安康',
    '事业有成',
    '好运连连',
    '吉祥如意',
    // 添加奶茶相关祝福
    `今天推荐喝${milkTeas[Math.floor(Math.random() * milkTeas.length)]}`,
    '奶茶要加珍珠',
    '记得喝奶茶',
    '奶茶使我快乐',
    '不如来杯奶茶',
    '今天当🐮🐴',
    '你是我的神！！！'
  ];

  const container = document.createElement('div');
  container.className = 'bubble-container';
  document.body.appendChild(container);

  // 创建爆炸效果
  function createExplosion(x, y, color) {
    const particles = 12;
    const blessing = blessings[Math.floor(Math.random() * blessings.length)];
    
    // 创建祝福文字
    const text = document.createElement('div');
    text.className = 'blessing-text';
    text.textContent = blessing;
    text.style.left = x + 'px';
    text.style.top = y + 'px';
    text.style.color = color;
    container.appendChild(text);

    // 创建爆炸粒子
    for (let i = 0; i < particles; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.backgroundColor = color;
      particle.style.left = x + 'px';
      particle.style.top = y + 'px';
      
      const angle = (i / particles) * 360;
      const velocity = 2 + Math.random() * 2;
      particle.style.setProperty('--angle', angle + 'deg');
      particle.style.setProperty('--velocity', velocity);
      
      container.appendChild(particle);
      setTimeout(() => particle.remove(), 1000);
    }

    setTimeout(() => text.remove(), 2000);
  }

  // 创建泡泡的函数
  function createBubble() {
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    
    // 增加边距使泡泡更分散
    const margin = 150;
    const startX = margin + Math.random() * (window.innerWidth - 2 * margin);
    bubble.style.left = `${startX}px`;
    
    // 增加动画时间让移动更慢
    const duration = 25 + Math.random() * 20;
    bubble.style.animationDuration = `${duration}s`;
    
    // 随机延迟使泡泡错开
    const delay = Math.random() * 20;
    bubble.style.animationDelay = `${delay}s`;
    
    const rotation = Math.random() * 360;
    bubble.style.transform = `rotate(${rotation}deg)`;

    let isHovered = false;
    
    function updateBubblePosition(e) {
      if (!isHovered) return;
      
      const rect = bubble.getBoundingClientRect();
      const bubbleX = rect.left + rect.width / 2;
      const bubbleY = rect.top + rect.height / 2;
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      
      const dx = mouseX - bubbleX;
      const dy = mouseY - bubbleY;
      
      bubble.style.transform = `translate(${dx * 0.2}px, ${dy * 0.2}px) scale(1.1)`;
    }

    bubble.addEventListener('mouseenter', function(e) {
      isHovered = true;
      this.style.animationPlayState = 'paused';
      this.style.transition = 'transform 0.3s ease';
      updateBubblePosition(e);
      document.addEventListener('mousemove', updateBubblePosition);
    });

    bubble.addEventListener('mouseleave', function() {
      isHovered = false;
      this.style.animationPlayState = 'running';
      this.style.transition = 'transform 0.5s ease';
      this.style.transform = `rotate(${rotation}deg)`;
      document.removeEventListener('mousemove', updateBubblePosition);
    });

    bubble.addEventListener('click', function(e) {
      e.stopPropagation();
      
      const style = window.getComputedStyle(this);
      const bgcolor = style.backgroundImage;
      const colorMatch = bgcolor.match(/rgba\([^)]+\)/);
      const color = colorMatch ? colorMatch[0] : 'rgba(255, 255, 255, 0.4)';

      const rect = this.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      
      createExplosion(x, y, color);
      
      // 从数组中移除被点击的泡泡
      const index = bubbles.indexOf(bubble);
      if (index > -1) {
        bubbles.splice(index, 1);
      }
      this.remove();
      
      // 创建新的泡泡来替代被点击的
      const newBubble = createBubble();
      bubbles.push(newBubble);
    });
    
    container.appendChild(bubble);
    
    // 动画结束时重新创建泡泡而不是移除
    bubble.addEventListener('animationend', () => {
      if (!isHovered) {
        // 重置泡泡位置到底部
        const newX = margin + Math.random() * (window.innerWidth - 2 * margin);
        bubble.style.left = `${newX}px`;
        
        // 重置动画
        bubble.style.animation = 'none';
        bubble.offsetHeight; // 触发重排
        bubble.style.animation = null;
        
        // 重新设置随机延迟
        bubble.style.animationDelay = '0s';
      }
    });

    return bubble;
  }

  // 初始创建泡泡
  const bubbleCount = 15;
  const bubbles = [];
  
  for (let i = 0; i < bubbleCount; i++) {
    bubbles.push(createBubble());
  }
}); 