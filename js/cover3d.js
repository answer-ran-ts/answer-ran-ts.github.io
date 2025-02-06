document.addEventListener('DOMContentLoaded', function() {
  // 修改选择器以匹配文章封面图片
  const covers = document.querySelectorAll('.post-cover img, article.post-content img.post-cover__img');
  
  covers.forEach(cover => {
    // 添加必要的样式
    cover.style.transformStyle = 'preserve-3d';
    cover.style.backfaceVisibility = 'hidden';
    
    VanillaTilt.init(cover, {
      max: 15,           // 增加最大倾斜角度使效果更明显
      speed: 400,        
      glare: true,       
      "max-glare": 0.5,  
      scale: 1.05,       // 稍微调整缩放比例
      perspective: 1000, 
      easing: "cubic-bezier(.03,.98,.52,.99)",
      // 添加更多交互效果
      gyroscope: true,   // 启用陀螺仪效果（移动设备）
      gyroscopeMinAngleX: -45,    // 陀螺仪最小角度
      gyroscopeMaxAngleX: 45,     // 陀螺仪最大角度
      gyroscopeMinAngleY: -45,
      gyroscopeMaxAngleY: 45,
      
      onEnter: function(e) {
        cover.style.transition = "all 0.3s ease";
        // 添加阴影效果
        cover.style.boxShadow = "0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)";
      },
      
      onLeave: function(e) {
        cover.style.transition = "all 0.3s ease";
        cover.style.transform = "perspective(1000px) rotateX(0) rotateY(0) scale(1)";
        cover.style.boxShadow = "none";
      }
    });
  });
  
  // 添加额外的鼠标移动效果
  covers.forEach(cover => {
    cover.addEventListener('mousemove', function(e) {
      const rect = cover.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // 计算鼠标位置相对于元素中心的偏移
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const moveX = (x - centerX) / centerX;
      const moveY = (y - centerY) / centerY;
      
      // 添加光影效果
      cover.style.filter = `brightness(${100 + moveY * 10}%)`;
    });
    
    cover.addEventListener('mouseleave', function() {
      cover.style.filter = 'brightness(100%)';
    });
  });
}); 