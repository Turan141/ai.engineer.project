import sys
from paddleocr import PaddleOCR

image_path = sys.argv[1]

ocr = PaddleOCR(use_angle_cls=True, lang="en")

result = ocr.ocr(image_path)

texts = []

for line in result[0]:
    texts.append(line[1][0])

print("\n".join(texts))