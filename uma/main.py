import pygame
import tkinter as tk
from tkinter import filedialog

# 初始化Pygame
pygame.init()

# 设置窗口大小
screen_width = 800
screen_height = 600
screen = pygame.display.set_mode((screen_width, screen_height))

# 设置窗口标题
pygame.display.set_caption("Upload Image")

def upload_image():
    root = tk.Tk()
    root.withdraw()  # 隐藏tkinter窗口

    # 打开文件对话框选择图片
    file_path = filedialog.askopenfilename()

    # 加载选定的图片
    if file_path:
        image = pygame.image.load(file_path)
        image_rect = image.get_rect(center=(screen_width // 2, screen_height // 2))
        screen.blit(image, image_rect)
        pygame.display.flip()

# 主循环
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        elif event.type == pygame.MOUSEBUTTONDOWN:
            if event.button == 1:  # 左键点击
                upload_image()

    pygame.display.update()

pygame.quit()
