def create_number_icon(number):
    # 원 없이 숫자만 빨간색으로 표시하는 SVG 템플릿 생성
    if number < 1000:
        font_size = 65

    elif number < 10000:
        font_size = 45

    else:
        font_size = 75
    svg_template = f"""<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="{font_size}" fill="red">{number}</text></svg>"""
  
    # SVG 파일 저장
    with open(f"{number}.svg", "w") as file:
        file.write(svg_template)

# 예제로 숫자 1의 아이콘 생성, 배경색을 빨간색으로 변경
for i in range(1, 11111):
	create_number_icon(i)

