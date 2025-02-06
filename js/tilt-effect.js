document.addEventListener('DOMContentLoaded', function() {
  // 为文章卡片添加倾斜效果
  const articles = document.querySelectorAll('.recent-post-item');
  
  articles.forEach((article, index) => {
    // 为每个卡片设置不同的初始角度
    const startRotation = (index % 2 === 0) ? 2 : -2;
    article.style.transform = `rotate(${startRotation}deg)`;

    VanillaTilt.init(article, {
      max: 15,
      speed: 400,
      glare: true,
      "max-glare": 0.3,
      scale: 1.05,
      perspective: 1000,
      transition: true,
      "full-page-listening": false,
      gyroscope: true,
      reset: true,
      easing: "cubic-bezier(.03,.98,.52,.99)",
      transformOrigin: "center center"
    });

    // 添加鼠标进入和离开的额外效果
    article.addEventListener('mouseenter', () => {
      article.style.transform = 'rotate(0deg)';
    });

    article.addEventListener('mouseleave', () => {
      article.style.transform = `rotate(${startRotation}deg)`;
    });
  });
}); 