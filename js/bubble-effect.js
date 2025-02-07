document.addEventListener("DOMContentLoaded", function () {
  // 只在首页和文章列表页显示气泡
  const path = location.pathname;
  if (!(path === "/" || path === "/page/" || /^\/page\/\d+\/?$/.test(path))) {
    return;
  }

  // 奶茶数组
  const milkTeas = [
    // 喜茶系列
    "喜茶多肉葡萄",
    "喜茶芝芝莓莓",
    "喜茶烤黑糖波波",
    "喜茶满杯红柚",
    "喜茶豆豆波波茶",
    "喜茶芝芝桃桃",
    // 奈雪系列
    "奈雪霸气芝士莓莓",
    "奈雪茉莉云朵",
    "奈雪椰椰芋圆",
    "奈雪杨枝甘露",
    "奈雪草莓雪王",
    "奈雪金玉满堂",
    // 蜜雪冰城系列
    "蜜雪冰城椰椰奶茶",
    "蜜雪冰城奥利奥奶茶",
    "蜜雪冰城草莓奶昔",
    "蜜雪冰城芋泥波波",
    "蜜雪冰城黑糖珍珠",
    // 茶百道系列
    "茶百道芋泥波波奶茶",
    "茶百道脏脏奶茶",
    "茶百道多肉葡萄",
    "茶百道幽兰拿铁",
    "茶百道芝士奶盖",
    // 其他系列
    "古茗青稞奶茶",
    "沪上阿姨奶茶",
    "益禾堂奶茶",
    "乐乐茶脏脏奶茶",
    "一点点布丁奶茶",
  ];

  // 祝福语数组
  const blessings = [
    // 财运祝福
    "我看你今天要发财啊💰",
    "我看你今天要暴富啊💰",
    "今天赚它一个亿💴",
    "钞能力MAX✨",
    "财运滚滚来🎲",
    "发财发到飞起来🚀",
    "今天必定横财运💸",
    // 日常祝福
    "今天也要元气满满⚡",
    "今天也要活力四射✨",
    // 奶茶相关
    `今天喝${milkTeas[Math.floor(Math.random() * milkTeas.length)]}🧋`,
    `来杯${milkTeas[Math.floor(Math.random() * milkTeas.length)]}解解渴🧋`,
    `请你喝${milkTeas[Math.floor(Math.random() * milkTeas.length)]}🧋`,
    "奶茶要加双倍珍珠🧋",
    // 搞笑祝福
    "今天要当最强大腿💪",
    "今天要当最靓的崽😎",
    "今天要当躺赢王👑",
    "今天要当摸鱼王🐟",
    "今天要当咸鱼王🐠",
    "今天要摸鱼摸到爽🐟",
    "摸鱼时间到了~",
  ];

  // 使用 DocumentFragment 优化 DOM 操作
  const fragment = document.createDocumentFragment();
  const container = document.createElement("div");
  container.className = "bubble-container";
  fragment.appendChild(container);

  // 使用 Set 存储活动的泡泡，提高查找和删除效率
  const activeBubbles = new Set();
  
  // 缓存随机数生成函数
  const random = Math.random;
  const floor = Math.floor;
  
  // 使用 requestAnimationFrame 的时间戳优化动画
  let lastTime = 0;
  const FRAME_RATE = 1000 / 60; // 60fps

  // 创建爆炸效果的优化版本
  function createExplosion(x, y, color) {
    const fragment = document.createDocumentFragment();
    const blessing = blessings[floor(random() * blessings.length)];
    
    // 创建祝福文字
    const text = document.createElement("div");
    text.className = "blessing-text";
    text.textContent = blessing;
    text.style.cssText = `left:${x}px;top:${y}px;color:${color};white-space:nowrap;`;
    fragment.appendChild(text);

    // 批量创建粒子
    const particles = Array.from({ length: 12 }, (_, i) => {
      const particle = document.createElement("div");
      particle.className = "particle";
      particle.style.cssText = `
        left:${x}px;
        top:${y}px;
        background-color:${color};
        --angle:${(i / 12) * 360}deg;
        --velocity:${2 + random() * 2}
      `;
      return particle;
    });

    particles.forEach(p => fragment.appendChild(p));
    container.appendChild(fragment);

    // 使用单个定时器优化清理
    setTimeout(() => {
      particles.forEach(p => p.remove());
      text.remove();
    }, 2000);
  }

  // 优化的泡泡创建函数
  function createBubble() {
    const bubble = document.createElement("div");
    bubble.className = "bubble";

    // 预计算并缓存样式值
    const margin = 150;
    const startX = margin + random() * (window.innerWidth - 2 * margin);
    const duration = 25 + random() * 20;
    const delay = random() * 20;
    const rotation = random() * 360;

    // 使用 cssText 批量设置样式
    bubble.style.cssText = `
      left:${startX}px;
      animation-duration:${duration}s;
      animation-delay:${delay}s;
      transform:rotate(${rotation}deg)
    `;

    // 使用闭包存储状态，避免重复查找
    let isHovered = false;
    let rafId = null;
    let mouseX = 0;
    let mouseY = 0;
    let offsetX = 0;
    let offsetY = 0;

    // 优化的动画函数
    function updatePosition(timestamp) {
      if (!isHovered) return;
      
      if (timestamp - lastTime < FRAME_RATE) {
        rafId = requestAnimationFrame(updatePosition);
        return;
      }
      
      const rect = bubble.getBoundingClientRect();
      const bubbleX = rect.left + rect.width / 2;
      const bubbleY = rect.top + rect.height / 2;
      
      offsetX += ((mouseX - bubbleX) - offsetX) * 0.2;
      offsetY += ((mouseY - bubbleY) - offsetY) * 0.2;
      
      bubble.style.transform = `translate(${offsetX}px,${offsetY}px) rotate(${rotation}deg)`;
      
      lastTime = timestamp;
      rafId = requestAnimationFrame(updatePosition);
    }

    // 事件处理函数优化
    const handlers = {
      mousemove: e => {
        if (isHovered) {
          mouseX = e.clientX;
          mouseY = e.clientY;
        }
      },
      
      mouseenter: e => {
        isHovered = true;
        bubble.style.animationPlayState = "paused";
        mouseX = e.clientX;
        mouseY = e.clientY;
        offsetX = offsetY = 0;
        document.addEventListener("mousemove", handlers.mousemove);
        rafId = requestAnimationFrame(updatePosition);
      },
      
      mouseleave: () => {
        isHovered = false;
        bubble.style.cssText = `
          left:${startX}px;
          animation-duration:${duration}s;
          animation-delay:${delay}s;
          transform:rotate(${rotation}deg);
          animation-play-state:running;
          transition:transform 0.5s ease
        `;
        document.removeEventListener("mousemove", handlers.mousemove);
        cancelAnimationFrame(rafId);
        offsetX = offsetY = 0;
      },
      
      click: e => {
        e.stopPropagation();
        const style = getComputedStyle(bubble);
        const color = style.backgroundImage.match(/rgba\([^)]+\)/) || ["rgba(255,255,255,0.4)"];
        const rect = bubble.getBoundingClientRect();
        createExplosion(rect.left + rect.width/2, rect.top + rect.height/2, color[0]);
        activeBubbles.delete(bubble);
        bubble.remove();
        const newBubble = createBubble();
        activeBubbles.add(newBubble);
        container.appendChild(newBubble);
      },
      
      animationend: () => {
        if (!isHovered) {
          const newX = margin + random() * (window.innerWidth - 2 * margin);
          bubble.style.left = `${newX}px`;
          bubble.style.animation = "none";
          bubble.offsetHeight;
          bubble.style.animation = null;
          bubble.style.animationDelay = "0s";
        }
      }
    };

    // 批量添加事件监听
    Object.entries(handlers).forEach(([event, handler]) => {
      bubble.addEventListener(event, handler);
    });

    return bubble;
  }

  // 初始化泡泡
  const bubbleCount = 15;
  for (let i = 0; i < bubbleCount; i++) {
    const bubble = createBubble();
    activeBubbles.add(bubble);
    container.appendChild(bubble);
  }

  document.body.appendChild(fragment);
});
