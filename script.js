document.addEventListener('DOMContentLoaded', function() {
    // 仅在此处初始化变量，不加载数据
    const savedData = localStorage.getItem('lastDrawingData');
    if (savedData) {
        // 将数据暂存，后续在 backgroundImage.onload 中处理
        window.__pendingDrawingData = savedData;
    }
    // 获取DOM元素
    const canvas = document.getElementById('drawingCanvas');
    const ctx = canvas.getContext('2d');
    const lineBtn = document.getElementById('lineBtn');
    const polygonBtn = document.getElementById('polygonBtn');
    const resetLineBtn = document.getElementById('resetLineBtn');
    const resetPolygonBtn = document.getElementById('resetPolygonBtn');
    const saveBtn = document.getElementById('saveBtn');
    const loadBtn = document.getElementById('loadBtn');
    const newBtn = document.getElementById('newBtn');
    const imageUpload = document.getElementById('imageUpload');
    const lengthResult = document.getElementById('lengthResult');
    const lengthInput = document.getElementById('lengthInput');
    const realLength = document.getElementById('realLength');
    const lengthUnit = document.getElementById('lengthUnit');
    const confirmLength = document.getElementById('confirmLength');
    const areaResult = document.getElementById('areaResult');

    // 加载背景图片
    const backgroundImage = new Image();
    backgroundImage.src = 'default.jpg';
    
    // 状态变量
    let mode = 'none'; // 'none', 'line', 'polygon'
    let isDrawing = false;
    let points = [];
    let scale = 1; // 比例尺：像素到实际单位的转换比例
    let pixelLength = 0; // 直线的像素长度
    
    // 设置canvas尺寸
    backgroundImage.onload = function() {
        canvas.width = backgroundImage.width;
        canvas.height = backgroundImage.height;
        
        // 检查是否有暂存的平面图数据
        if (window.__pendingDrawingData) {
            try {
                const loadedData = JSON.parse(window.__pendingDrawingData);
                // 恢复数据到页面
                if (loadedData.points) {
                    points = loadedData.points;
                }
                if (loadedData.scale) {
                    scale = loadedData.scale;
                }
                if (loadedData.zoomScale) {
                    zoomScale = loadedData.zoomScale;
                }
                if (loadedData.mode) {
                    mode = loadedData.mode;
                }
                // 更新UI状态
                if (mode === 'line') {
                    lineBtn.classList.add('active');
                    polygonBtn.classList.remove('active');
                } else if (mode === 'polygon') {
                    polygonBtn.classList.add('active');
                    lineBtn.classList.remove('active');
                }
                // 更新测量结果
                if (mode === 'line' && points.length === 2) {
                    pixelLength = calculateDistance(points[0], points[1]);
                    lengthResult.textContent = pixelLength.toFixed(2) + ' 像素';
                    lengthInput.style.display = 'flex';
                } else if (mode === 'polygon' && points.length > 2) {
                    const area = calculatePolygonArea();
                    areaResult.textContent = convertArea(area);
                }
            } catch (e) {
                console.error('Failed to parse saved drawing data:', e);
            }
            // 清除暂存数据
            delete window.__pendingDrawingData;
        }
        
        drawBackground();
    };
    
    // 绘制背景
    function drawBackground() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
        redrawAll();
    }
    
    // 重绘所有点和线
    function redrawAll() {
        if (points.length === 0) return;
        
        ctx.lineWidth = 2;
        
        if (mode === 'line' && points.length === 2) {
            // 绘制直线
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            ctx.lineTo(points[1].x, points[1].y);
            ctx.strokeStyle = 'green';
            ctx.stroke();
            
            // 绘制端点
            drawPoint(points[0].x, points[0].y);
            drawPoint(points[1].x, points[1].y);
        } else if (mode === 'polygon' && points.length > 0) {
            // 绘制多边形
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            
            if (points.length > 2) {
                ctx.closePath();
                ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
                ctx.fill();
            }
            
            ctx.strokeStyle = 'green';
            ctx.stroke();
            
            // 绘制所有点
            points.forEach(point => {
                drawPoint(point.x, point.y);
            });
        }
    }
    
    // 绘制点
    function drawPoint(x, y) {
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'red';
        ctx.fill();
    }
    
    // 计算两点之间的距离（像素）
    function calculateDistance(p1, p2) {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }
    
    // 计算多边形面积（像素）
    function calculatePolygonArea() {
        let area = 0;
        const n = points.length;
        
        if (n < 3) return 0;
        
        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            area += points[i].x * points[j].y;
            area -= points[j].x * points[i].y;
        }
        
        area = Math.abs(area) / 2;
        return area;
    }
    
    // 转换面积单位
    function convertArea(pixelArea) {
        if (scale === 1) return pixelArea.toFixed(2) + ' 平方像素';
        
        // 根据比例尺计算实际面积
        const realArea = pixelArea * Math.pow(scale, 2);
        const unit = lengthUnit.value;
        
        if (unit === 'm') {
            return realArea.toFixed(2) + ' 平方米';
        } else if (unit === 'cm') {
            return realArea.toFixed(2) + ' 平方厘米';
        } else if (unit === 'mm') {
            return realArea.toFixed(2) + ' 平方毫米';
        }
    }
    
    // 事件监听器
    lineBtn.addEventListener('click', function() {
        // 切换到线条模式前先清除当前绘制内容
        points = [];
        isDrawing = false;
        mode = 'line';
        this.classList.add('active');
        polygonBtn.classList.remove('active');
        drawBackground();
    });
    
    polygonBtn.addEventListener('click', function() {
        // 切换到多边形模式前先清除当前绘制内容
        points = [];
        isDrawing = false;
        mode = 'polygon';
        this.classList.add('active');
        lineBtn.classList.remove('active');
        drawBackground();
    });
    
    resetLineBtn.addEventListener('click', function() {
        // 只重置直线相关的内容
        points = [];
        isDrawing = false;
        if (mode === 'line') {
            mode = 'none';
            lineBtn.classList.remove('active');
        }
        lengthResult.textContent = '未测量';
        lengthInput.style.display = 'none';
        scale = 1; // 重置比例尺
        drawBackground();
    });
    
    resetPolygonBtn.addEventListener('click', function() {
        // 只重置多边形相关的内容
        if (mode === 'polygon') {
            points = [];
            isDrawing = false;
            mode = 'none';
            polygonBtn.classList.remove('active');
            drawBackground();
        }
        areaResult.textContent = '未测量';
    });
    
    canvas.addEventListener('mousedown', function(e) {
        if (mode === 'none') return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (mode === 'line') {
            if (points.length < 2) {
                points.push({ x, y });
                isDrawing = true;
                
                if (points.length === 2) {
                    pixelLength = calculateDistance(points[0], points[1]);
                    lengthResult.textContent = pixelLength.toFixed(2) + ' 像素';
                    lengthInput.style.display = 'flex';
                    isDrawing = false;
                }
            }
        } else if (mode === 'polygon') {
            // 检查是否点击了第一个点来闭合多边形
            if (points.length > 2) {
                const firstPoint = points[0];
                const distance = calculateDistance({ x, y }, firstPoint);
                
                if (distance < 10) { // 如果点击位置靠近第一个点
                    const area = calculatePolygonArea();
                    areaResult.textContent = convertArea(area);
                    isDrawing = false;
                    return;
                }
            }
            
            points.push({ x, y });
            
            if (points.length > 2) {
                const area = calculatePolygonArea();
                areaResult.textContent = convertArea(area);
            }
        }
        
        drawBackground();
    });
    
    canvas.addEventListener('mousemove', function(e) {
        if (!isDrawing) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 临时绘制
        drawBackground();
        
        if (mode === 'line' && points.length === 1) {
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            ctx.lineTo(x, y);
            ctx.strokeStyle = 'green';
            ctx.stroke();
            drawPoint(points[0].x, points[0].y);
        } else if (mode === 'polygon' && points.length > 0) {
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            
            ctx.lineTo(x, y);
            
            if (points.length > 2) {
                ctx.closePath();
                ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
                ctx.fill();
            }
            
            ctx.strokeStyle = 'green';
            ctx.stroke();
            
            points.forEach(point => {
                drawPoint(point.x, point.y);
            });
        }
    });
    
    confirmLength.addEventListener('click', function() {
        const length = parseFloat(realLength.value);
        const unit = lengthUnit.value;
        
        if (isNaN(length) || length <= 0) {
            alert('请输入有效的长度值');
            return;
        }
        
        // 计算比例尺
        scale = length / pixelLength;
        
        // 更新显示
        if (unit === 'm') {
            lengthResult.textContent = length.toFixed(2) + ' 米 (' + pixelLength.toFixed(2) + ' 像素)';
        } else if (unit === 'cm') {
            lengthResult.textContent = length.toFixed(2) + ' 厘米 (' + pixelLength.toFixed(2) + ' 像素)';
        } else if (unit === 'mm') {
            lengthResult.textContent = length.toFixed(2) + ' 毫米 (' + pixelLength.toFixed(2) + ' 像素)';
        }
        
        // 如果已经绘制了多边形，更新面积
        if (mode === 'polygon' && points.length > 2) {
            const area = calculatePolygonArea();
            areaResult.textContent = convertArea(area);
        }
    });
    
    // 重置绘图状态
    function resetDrawing() {
        points = [];
        isDrawing = false;
        drawBackground();
    }
    
    // 保存平面图功能
    saveBtn.addEventListener('click', function() {
        // 创建要保存的数据对象
        const saveData = {
            points: points,
            scale: scale,
            unit: lengthUnit.value,
            mode: mode,
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            zoomScale: zoomScale, // 添加缩放比例
            imageSrc: backgroundImage.src // 添加图片数据
        };
        
        // 将数据转换为JSON字符串
        const jsonData = JSON.stringify(saveData);
        
        // 使用localStorage保存数据
        const saveName = prompt('请输入保存名称:', '平面图_' + new Date().toLocaleString().replace(/[\/\s:]/g, '_'));
        if (saveName) {
            localStorage.setItem('floorplan_' + saveName, jsonData);
            // 同时保存为最后一次的平面图
            localStorage.setItem('lastDrawingData', jsonData);
            alert('平面图已保存!');
        }
    });
    
    // 加载平面图功能
    loadBtn.addEventListener('click', function() {
        const savedKeys = Object.keys(localStorage).filter(key => key.startsWith('floorplan_'));
        if (savedKeys.length === 0) {
            alert('没有找到已保存的平面图!');
            return;
        }
        
        const saveName = prompt('请输入要加载的平面图名称:', savedKeys[0].replace('floorplan_', ''));
        if (saveName) {
            const savedData = localStorage.getItem('floorplan_' + saveName);
            if (savedData) {
                try {
                    const loadedData = JSON.parse(savedData);
                    // 恢复数据到页面
                    if (loadedData.imageSrc) {
                        backgroundImage.src = loadedData.imageSrc;
                    }
                    if (loadedData.points) {
                        points = loadedData.points;
                    }
                    if (loadedData.scale) {
                        scale = loadedData.scale;
                    }
                    if (loadedData.zoomScale) {
                        zoomScale = loadedData.zoomScale;
                    }
                    if (loadedData.mode) {
                        mode = loadedData.mode;
                    }
                    // 更新UI状态
                    if (mode === 'line') {
                        lineBtn.classList.add('active');
                        polygonBtn.classList.remove('active');
                    } else if (mode === 'polygon') {
                        polygonBtn.classList.add('active');
                        lineBtn.classList.remove('active');
                    }
                    // 保存为最后一次的平面图
                    localStorage.setItem('lastDrawingData', savedData);
                    alert('平面图已加载!');
                } catch (e) {
                    console.error('Failed to parse saved drawing data:', e);
                    alert('加载平面图失败!');
                }
            } else {
                alert('未找到指定的平面图!');
            }
        }
    });
    
    // 上传图片功能
    imageUpload.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            if (confirm('上传新图片将重置当前平面图，确定要继续吗？')) {
                // 重置所有状态
                points = [];
                isDrawing = false;
                mode = 'none';
                scale = 1;
                
                // 重置UI状态
                lineBtn.classList.remove('active');
                polygonBtn.classList.remove('active');
                lengthResult.textContent = '未测量';
                lengthInput.style.display = 'none';
                areaResult.textContent = '未测量';
                
                // 清除最后一次的平面图数据
                localStorage.removeItem('lastDrawingData');
                
                // 读取并显示上传的图片
                const reader = new FileReader();
                reader.onload = function(event) {
                    backgroundImage.src = event.target.result;
                    // onload事件会自动重绘画布
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        }
    });
    
    // 点击上传按钮时触发文件选择
    newBtn.addEventListener('click', function(e) {
        e.preventDefault(); // 阻止默认行为
        imageUpload.click();
    }, { once: true }); // 确保事件只绑定一次
    
    // 输入图片URL功能
    document.getElementById('urlBtn').addEventListener('click', function() {
        const imageUrl = prompt('请输入图片URL:', 'default.jpg');
        if (imageUrl) {
            // 重置所有状态
            points = [];
            isDrawing = false;
            mode = 'none';
            scale = 1;
            
            // 重置UI状态
            lineBtn.classList.remove('active');
            polygonBtn.classList.remove('active');
            lengthResult.textContent = '未测量';
            lengthInput.style.display = 'none';
            areaResult.textContent = '未测量';
            
            // 保存URL到localStorage
            localStorage.setItem('last_image_url', imageUrl);
            
            // 加载图片
            backgroundImage.src = imageUrl;
        }
    });
    
    // 尝试加载上次使用的图片URL
    const lastImageUrl = localStorage.getItem('last_image_url');
    if (lastImageUrl) {
        backgroundImage.src = lastImageUrl;
    }
    
    // 初始化缩放比例
    let zoomScale = parseFloat(localStorage.getItem('zoom_scale')) || 1;
    
    // 缩放功能
    function applyZoom() {
        if (!backgroundImage.complete) return;
        
        const originalWidth = backgroundImage.naturalWidth;
        const originalHeight = backgroundImage.naturalHeight;
        
        canvas.width = originalWidth * zoomScale;
        canvas.height = originalHeight * zoomScale;
        
        drawBackground();
        
        // 保存缩放比例
        localStorage.setItem('zoom_scale', zoomScale.toString());
    }
    
    // 放大按钮
    document.getElementById('zoomInBtn').addEventListener('click', function() {
        zoomScale *= 1.25;
        applyZoom();
    });
    
    // 缩小按钮
    document.getElementById('zoomOutBtn').addEventListener('click', function() {
        zoomScale *= 0.75;
        applyZoom();
    });
    
    // 修改背景图片加载逻辑以支持缩放
    backgroundImage.onload = function() {
        applyZoom();
    };
    
    // 添加加载平面图功能
    function loadFloorPlan() {
        // 获取所有保存的平面图
        const savedPlans = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('floorplan_')) {
                savedPlans.push(key.substring(10)); // 移除 'floorplan_' 前缀
            }
        }
        
        if (savedPlans.length === 0) {
            alert('没有找到保存的平面图');
            return;
        }
        
        // 创建选择列表
        const planName = prompt('请选择要加载的平面图:\n' + savedPlans.join('\n'), savedPlans[0]);
        
        if (!planName) return;
        
        const jsonData = localStorage.getItem('floorplan_' + planName);
        if (!jsonData) {
            alert('找不到指定的平面图');
            return;
        }
        
        try {
            const loadedData = JSON.parse(jsonData);
            
            // 恢复保存的状态
            points = loadedData.points;
            scale = loadedData.scale;
            mode = loadedData.mode;
            lengthUnit.value = loadedData.unit;
            zoomScale = loadedData.zoomScale || 1; // 恢复缩放比例，默认为1
            
            // 恢复图片数据
            backgroundImage.src = loadedData.imageSrc;
            
            // 应用缩放比例
            applyZoom();
            
            // 更新UI
            if (mode === 'line') {
                lineBtn.classList.add('active');
                polygonBtn.classList.remove('active');
                if (points.length === 2) {
                    pixelLength = calculateDistance(points[0], points[1]);
                    lengthResult.textContent = pixelLength.toFixed(2) + ' 像素';
                    lengthInput.style.display = 'flex';
                }
            } else if (mode === 'polygon') {
                polygonBtn.classList.add('active');
                lineBtn.classList.remove('active');
                if (points.length > 2) {
                    const area = calculatePolygonArea();
                    areaResult.textContent = convertArea(area);
                }
            }
            
            // 重绘画布
            drawBackground();
            
            alert('平面图加载成功!');
        } catch (error) {
            alert('加载平面图时出错: ' + error.message);
        }
    }
    
    // 添加加载平面图按钮的事件监听器
    loadBtn.addEventListener('click', function() {
        loadFloorPlan();
    });
});