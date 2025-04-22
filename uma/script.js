// script.js
document.getElementById('uploadButton').addEventListener('click', function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.addEventListener('change', handleFileSelect);
    input.click();
});

let imgProps = {
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    originalScale: 1 // 添加一个属性以存储原始缩放比例
};

let img = null; // 用于存储当前图像的变量
let scaleInput = document.querySelector('.scale-input');

window.onload = function() {
    // 创建提示框元素
    const alertBox = document.createElement('div');
    alertBox.textContent = '！！！注意：如果你在使用微信/QQ等的内置浏览器，你可能无法下载图片！建议直接在浏览器中打开该网站。';
    alertBox.classList.add('alert-box');
    document.body.appendChild(alertBox);

    // 在下一个动画帧中添加淡出效果
    requestAnimationFrame(() => {
        alertBox.style.opacity = '1'; // 淡入效果
    });

    // 设置定时器，在10秒后隐藏提示框
    setTimeout(function() {
        // 在下一个动画帧中添加淡出效果
        requestAnimationFrame(() => {
            alertBox.style.opacity = '0'; // 淡出效果
        });
        // 10秒后删除提示框
        setTimeout(() => {
            document.body.removeChild(alertBox);
        }, 300);
    }, 10000);
};


function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            // 移除之前的图像
            if (img) {
                URL.revokeObjectURL(img.src);
            }

            img = new Image();
            img.src = e.target.result;
            img.onload = function() {
                const canvas = document.getElementById('cardCanvas');
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // 计算图像的宽高比
                const aspectRatio = img.width / img.height;

                // 确定是将图像的宽度还是高度适应到画布
                if (img.width / canvas.width < img.height / canvas.height) {
                    imgProps.scale = canvas.width / img.width;
                } else {
                    imgProps.scale = canvas.height / img.height;
                }

                // 设置原始缩放比例为当前缩放比例
                imgProps.originalScale = imgProps.scale;

                // 重置偏移量
                imgProps.offsetX = 0;
                imgProps.offsetY = 0;

                // 更新输入框的值为初始缩放比例
                scaleInput.value = (imgProps.scale * 100).toFixed(2);

                // 在画布上绘制图像
                redraw();
            };
        };
        reader.readAsDataURL(file);
    }
}

// 绘制圆角矩形的函数
CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
    this.beginPath();
    this.moveTo(x + radius, y);
    this.lineTo(x + width - radius, y);
    this.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.lineTo(x + width, y + height - radius);
    this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.lineTo(x + radius, y + height);
    this.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.lineTo(x, y + radius);
    this.quadraticCurveTo(x, y, x + radius, y);
    this.closePath();
};

// 重绘图像的函数
function redraw() {
    const canvas = document.getElementById('cardCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.roundRect(0, 0, canvas.width, canvas.height, 20); // 调整半径以适应您的需求
    ctx.clip(); // 裁剪 canvas 到圆角矩形
    ctx.drawImage(img, imgProps.offsetX, imgProps.offsetY, img.width * imgProps.scale, img.height * imgProps.scale);
}

// 限制偏移量，使图像保持在画布范围内
function limitOffset() {
    const canvas = document.getElementById('cardCanvas');
    imgProps.offsetX = Math.min(0, Math.max(canvas.width - img.width * imgProps.scale, imgProps.offsetX));
    imgProps.offsetY = Math.min(0, Math.max(canvas.height - img.height * imgProps.scale, imgProps.offsetY));
}

// 允许拖动
let isDragging = false;
let startX, startY;
let canvas = document.getElementById('cardCanvas');

// 检测是否是移动设备
function iOS() {
  return [
    'iPad Simulator',
    'iPhone Simulator',
    'iPod Simulator',
    'iPad',
    'iPhone',
    'iPod'
  ].includes(navigator.platform)
  // iPad on iOS 13 detection
  || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
}

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || iOS();

// 添加事件监听器
if (isMobile) {
    // 如果是移动设备，使用触摸事件
    canvas.addEventListener('touchstart', function(e) {
        isDragging = true;
        startX = e.touches[0].clientX - imgProps.offsetX;
        startY = e.touches[0].clientY - imgProps.offsetY;
        e.preventDefault(); // 阻止默认的滑动行为
    });

    canvas.addEventListener('touchmove', function(e) {
        if (isDragging) {
            imgProps.offsetX = e.touches[0].clientX - startX;
            imgProps.offsetY = e.touches[0].clientY - startY;
            limitOffset(); // 更新拖动后的偏移量
            redraw(); // 重新绘制图像
            e.preventDefault(); // 阻止默认的滑动行为
        }
    });

    canvas.addEventListener('touchend', function() {
        isDragging = false;
    });

} else {
    // 如果是电脑设备，使用鼠标事件
    canvas.addEventListener('mousedown', function(e) {
        isDragging = true;
        startX = e.clientX - imgProps.offsetX;
        startY = e.clientY - imgProps.offsetY;
    });

    canvas.addEventListener('mousemove', function(e) {
        if (isDragging) {
            imgProps.offsetX = e.clientX - startX;
            imgProps.offsetY = e.clientY - startY;
            limitOffset(); // 更新拖动后的偏移量
            redraw(); // 重新绘制图像
        }
    });

    canvas.addEventListener('mouseup', function() {
        isDragging = false;
    });
}

// 添加事件监听器
if (isMobile) {
    // 如果是移动设备，使用触摸事件
    canvas.addEventListener('touchstart', function(e) {
        if (!img) {
            // 如果canvas为空，则阻止默认的滑动行为并弹出警告
            e.preventDefault();
            showAlarm("不可滑动，若要滑动网页请在该区域外（屏幕边缘/顶部）滑动");
            return;
        }
        isDragging = true;
        startX = e.touches[0].clientX - imgProps.offsetX;
        startY = e.touches[0].clientY - imgProps.offsetY;
        e.preventDefault(); // 阻止默认的滑动行为
    });

    canvas.addEventListener('touchmove', function(e) {
        if (isDragging) {
            if (!img) {
                // 如果canvas为空，则阻止默认的滑动行为并弹出警告
                e.preventDefault();
                showAlarm("不可滑动，若要滑动网页请在该区域外（屏幕边缘/顶部）滑动");
                return;
            }
            imgProps.offsetX = e.touches[0].clientX - startX;
            imgProps.offsetY = e.touches[0].clientY - startY;
            limitOffset(); // 更新拖动后的偏移量
            redraw(); // 重新绘制图像
            e.preventDefault(); // 阻止默认的滑动行为
        }
    });

    canvas.addEventListener('touchend', function() {
        isDragging = false;
    });
}

// 弹出警告函数
function showAlarm(message) {
    // 创建提示框元素
    const alertBox = document.createElement('div');
    alertBox.textContent = message;
    alertBox.classList.add('alert-box');
    document.body.appendChild(alertBox);

    // 在下一个动画帧中添加淡出效果
    requestAnimationFrame(() => {
        alertBox.style.opacity = '1'; // 淡入效果
    });

    // 设置定时器，在3秒后隐藏提示框
    setTimeout(function() {
        // 在下一个动画帧中添加淡出效果
        requestAnimationFrame(() => {
            alertBox.style.opacity = '0'; // 淡出效果
        });
        // 3秒后删除提示框
        setTimeout(() => {
            document.body.removeChild(alertBox);
        }, 300);
    }, 3000);
}

// 添加按钮事件监听器
document.querySelector('.scale-controls button:first-child').addEventListener('click', function() {
    scaleInput.value = parseFloat(scaleInput.value) - 1; // 递减1
    updateScale();
});

document.querySelector('.scale-controls button:last-child').addEventListener('click', function() {
    scaleInput.value = parseFloat(scaleInput.value) + 1; // 递增1
    updateScale();
});

// 添加输入框事件监听器
scaleInput.addEventListener('change', function() {
    updateScale();
});

// 立绘翻转按钮事件监听器
document.getElementById('flipButton').addEventListener('click', function() {
    flipImage();
});


// 更新图像大小的函数
function updateScale() {
    const newScale = parseFloat(scaleInput.value) / 100; // 获取输入框的值并转换为小数形式
    const initialScale = imgProps.originalScale; // 获取初始记录的缩放比例

    // 如果输入的缩放比例小于初始记录的值，则将输入的值调整为初始记录的值
    if (newScale < initialScale) {
        scaleInput.value = (initialScale * 100).toFixed(2); // 将输入框的值设为初始记录的值

        // 创建提示框元素
        const alertBox = document.createElement('div');
        alertBox.textContent = '图片不得过小';
        alertBox.classList.add('alert-box');
        document.body.appendChild(alertBox);

        // 在下一个动画帧中添加淡出效果
        requestAnimationFrame(() => {
            alertBox.style.opacity = '1'; // 淡入效果
        });

        // 设置定时器，在3秒后隐藏提示框
        setTimeout(function() {
            // 在下一个动画帧中添加淡出效果
            requestAnimationFrame(() => {
                alertBox.style.opacity = '0'; // 淡出效果
            });
            // 3秒后删除提示框
            setTimeout(() => {
                document.body.removeChild(alertBox);
            }, 300);
        }, 3000);

        imgProps.scale = initialScale;
        imgProps.offsetX = 1;
        imgProps.offsetY *= 1;

        // 限制偏移量以确保图像保持在画布范围内
        limitOffset();

        // 重新绘制图像
        redraw();

        return; // 结束函数，不进行后续的操作
    }

    const scaleDiff = newScale / imgProps.scale; // 计算缩放比例变化

    // 更新图像的缩放比例和偏移量
    imgProps.scale = newScale;
    imgProps.offsetX *= scaleDiff;
    imgProps.offsetY *= scaleDiff;

    // 限制偏移量以确保图像保持在画布范围内
    limitOffset();

    // 重新绘制图像
    redraw();
}

// 图片翻转函数
function flipImage() {
    if (img) {
        const canvas = document.getElementById('cardCanvas');
        const ctx = canvas.getContext('2d');

        // 清除画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 将图片水平翻转
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);

        // 重新绘制图像
        redraw();
    }
}

// 获取select元素
const attributeSelect = document.getElementById('attributeSelect');
const gradeSelect = document.getElementById('gradeSelect');

// 添加事件监听器
attributeSelect.addEventListener('change', function() {
    // 获取选中的属性值
    const selectedAttribute = attributeSelect.value;

    // 更新支援卡类型图片的src属性
    const typeImg = document.querySelector('.type img');
    typeImg.src = `images/card_type/${selectedAttribute}.png`;
});

gradeSelect.addEventListener('change', function() {
    // 获取选中的品级值
    const selectedGrade = gradeSelect.value;

    // 更新边框和标签图片的src属性
    const borderImg = document.querySelector('.border-overlay img');
    const tagImg = document.querySelector('.tag img');
    borderImg.src = `images/card_borders/${selectedGrade}.png`;
    tagImg.src = `images/card_tag/${selectedGrade}.png`;
});

// 初始化时触发一次事件，以确保初始值对应的元素会被更新
attributeSelect.dispatchEvent(new Event('change'));
gradeSelect.dispatchEvent(new Event('change'));

// 添加保存按钮功能
document.getElementById('saveButton').addEventListener('click', function() {
    saveCardPreview();
});

// 保存卡片预览功能
function saveCardPreview() {
    const cardPreview = document.querySelector('.border-container');
    html2canvas(cardPreview, {
        backgroundColor: null // 使用透明背景
    }).then(canvas => {
        // 创建一个链接
        const link = document.createElement('a');
        link.href = canvas.toDataURL(); // 将画布转换为数据 URL
        link.download = 'card_preview.png'; // 设置下载文件名
        link.click(); // 模拟点击链接进行下载
    });
    // 创建提示框元素
    const alertBox = document.createElement('div');
    alertBox.textContent = '（应该）下载成功了~';
    alertBox.classList.add('alert-box', 'success');
    document.body.appendChild(alertBox);

    // 在下一个动画帧中添加淡出效果
    requestAnimationFrame(() => {
        alertBox.style.opacity = '1'; // 淡入效果
    });

    // 设置定时器，在3秒后隐藏提示框
    setTimeout(function() {
        // 在下一个动画帧中添加淡出效果
        requestAnimationFrame(() => {
            alertBox.style.opacity = '0'; // 淡出效果
        });
        // 3秒后删除提示框
        setTimeout(() => {
            document.body.removeChild(alertBox);
        }, 300);
    }, 3000);
}

// 获取所有按钮和 GitHub 图标链接元素
const buttons = document.querySelectorAll('.button');
const githubLink = document.querySelector('.github-link');

// 遍历所有按钮，为它们添加鼠标悬停和点击事件监听器
buttons.forEach(button => {
    button.addEventListener('mouseover', function() {
        this.style.backgroundColor = '#0056b3'; // 改变背景颜色为悬停状态
    });

    button.addEventListener('mouseleave', function() {
        this.style.backgroundColor = '#007bff'; // 恢复默认背景颜色
    });

    button.addEventListener('mousedown', function() {
        this.style.backgroundColor = '#0056b3'; // 改变背景颜色为点击状态
    });

    button.addEventListener('mouseup', function() {
        this.style.backgroundColor = '#007bff'; // 恢复默认背景颜色
    });
});

// 为 GitHub 图标链接添加鼠标悬停和点击事件监听器
githubLink.addEventListener('mouseover', function() {
    this.querySelector('img').style.filter = 'invert(100%)'; // 反转颜色
});

githubLink.addEventListener('mouseleave', function() {
    this.querySelector('img').style.filter = 'invert(0%)'; // 恢复默认颜色
});

githubLink.addEventListener('mousedown', function() {
    this.querySelector('img').style.filter = 'invert(100%)'; // 反转颜色
});

githubLink.addEventListener('mouseup', function() {
    this.querySelector('img').style.filter = 'invert(0%)'; // 恢复默认颜色
});

// 获取弹窗元素和关闭按钮
const modal = document.getElementById('helpModal');
const helpButton = document.getElementById('helpButton');
const closeButton = document.getElementsByClassName('close')[0];

// 点击问号按钮显示弹窗
helpButton.onclick = function() {
    modal.style.display = 'block';
}

// 点击关闭按钮或者弹窗外部区域关闭弹窗
closeButton.onclick = function() {
    this.parentElement.parentElement.style.display = 'none'; // 修改这里
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}
